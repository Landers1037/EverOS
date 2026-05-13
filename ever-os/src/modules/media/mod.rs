use std::collections::HashSet;
use std::path::{Path, PathBuf};

use axum::body::Body;
use axum::extract::{Path as AxumPath, Query, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio_util::io::ReaderStream;
use walkdir::WalkDir;

use crate::domains::{MediaItem, MediaType};
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::Storage;
use crate::storage::{MediaQuery, MediaUpsert, TrashQuery};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/media/scan", post(scan))
        .route("/media/items", get(list_items))
        .route("/media/items/:id", get(get_item).delete(delete_item))
        .route("/media/items/:id/favorite", put(set_favorite))
        .route("/media/items/:id/categories", put(set_categories))
        .route("/media/items/:id/tags", put(set_tags))
        .route("/media/items/:id/content", get(get_content))
        .route("/trash/media", get(list_trash))
        .route("/trash/media/:id/restore", post(restore_item))
        .route("/trash/media/:id", delete(hard_delete_item))
}

#[derive(Debug, Serialize)]
pub struct ScanResponse {
    pub scanned: u64,
    pub upserted: u64,
}

async fn scan(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
) -> AppResult<Json<ScanResponse>> {
    let cfg = state.config();
    let mount_paths = cfg.storage.mount_paths.clone();
    let exclude_dirs: HashSet<String> = cfg
        .storage
        .exclude_dirs
        .iter()
        .map(|s| s.to_lowercase())
        .collect();
    let exts_photo: HashSet<String> = cfg
        .storage
        .extensions
        .photo
        .iter()
        .map(|s| s.to_lowercase())
        .collect();
    let exts_video: HashSet<String> = cfg
        .storage
        .extensions
        .video
        .iter()
        .map(|s| s.to_lowercase())
        .collect();
    let exts_music: HashSet<String> = cfg
        .storage
        .extensions
        .music
        .iter()
        .map(|s| s.to_lowercase())
        .collect();

    let storage = state.storage.clone();
    let actor_id = cu.id;

    let res = tokio::task::spawn_blocking(move || -> AppResult<(u64, u64)> {
        let mut scanned = 0u64;
        let mut upserted = 0u64;

        for mp in mount_paths {
            let root = PathBuf::from(mp);
            if !root.exists() {
                continue;
            }

            let walker = WalkDir::new(&root)
                .follow_links(false)
                .into_iter()
                .filter_entry(|e| {
                    if e.file_type().is_dir() {
                        if let Some(name) = e.file_name().to_str() {
                            let n = name.to_lowercase();
                            if exclude_dirs.contains(&n) {
                                return false;
                            }
                        }
                    }
                    true
                });

            for entry in walker.filter_map(|e| e.ok()) {
                if !entry.file_type().is_file() {
                    continue;
                }
                scanned += 1;
                let path = entry.path();
                let Some(ext) = path
                    .extension()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_lowercase())
                else {
                    continue;
                };

                let media_type = if exts_photo.contains(&ext) {
                    MediaType::Photo
                } else if exts_video.contains(&ext) {
                    MediaType::Video
                } else if exts_music.contains(&ext) {
                    MediaType::Music
                } else {
                    continue;
                };

                let meta = std::fs::metadata(path).map_err(|_| AppError::Internal)?;
                let size_bytes = meta.len() as i64;
                let full_path = normalize_path(path);
                let file_name = path
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or_default()
                    .to_string();
                let file_key = sha256_hex(&file_name);

                let input = MediaUpsert {
                    path: full_path,
                    file_name,
                    file_key,
                    media_type,
                    size_bytes,
                    library_id: None,
                    created_by: Some(actor_id),
                };

                upserted += 1;
                let _ = futures::executor::block_on(storage.upsert_media_by_path(input))?;
            }
        }

        Ok((scanned, upserted))
    })
    .await
    .map_err(|_| AppError::Internal)??;

    Ok(Json(ScanResponse {
        scanned: res.0,
        upserted: res.1,
    }))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub q: Option<String>,
    #[serde(rename = "type")]
    pub media_type: Option<String>,
    pub favorite: Option<bool>,
    pub folder_path: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct MediaItemResponse {
    pub item: MediaItem,
    pub category_ids: Vec<i64>,
    pub tag_ids: Vec<i64>,
}

async fn list_items(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Vec<MediaItemResponse>>> {
    let mt = q.media_type.as_deref().map(parse_media_type).transpose()?;
    let page = q.page.unwrap_or(1);
    let limit = q.limit.unwrap_or(50);

    let items = state
        .storage
        .list_media(MediaQuery {
            q: q.q,
            media_type: mt,
            favorite: q.favorite,
            folder_path: q.folder_path,
            page,
            limit,
        })
        .await?;

    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let category_ids = state
            .storage
            .list_media_category_ids(&item.file_key)
            .await?;
        let tag_ids = state.storage.list_media_tag_ids(&item.file_key).await?;
        out.push(MediaItemResponse {
            item,
            category_ids,
            tag_ids,
        });
    }

    Ok(Json(out))
}

async fn get_item(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<Json<MediaItemResponse>> {
    let Some(item) = state.storage.get_media_by_id(id).await? else {
        return Err(AppError::NotFound);
    };
    let category_ids = state
        .storage
        .list_media_category_ids(&item.file_key)
        .await?;
    let tag_ids = state.storage.list_media_tag_ids(&item.file_key).await?;
    Ok(Json(MediaItemResponse {
        item,
        category_ids,
        tag_ids,
    }))
}

#[derive(Debug, Deserialize)]
pub struct FavoriteRequest {
    pub favorite: bool,
}

async fn set_favorite(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
    Json(req): Json<FavoriteRequest>,
) -> AppResult<StatusCode> {
    state
        .storage
        .set_media_favorite(id, req.favorite, Some(cu.id))
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct SetIdsRequest {
    pub ids: Vec<i64>,
}

async fn set_categories(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
    Json(req): Json<SetIdsRequest>,
) -> AppResult<StatusCode> {
    let Some(item) = state.storage.get_media_by_id(id).await? else {
        return Err(AppError::NotFound);
    };
    state
        .storage
        .set_media_categories_by_file_key(&item.file_key, req.ids, Some(cu.id))
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn set_tags(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
    Json(req): Json<SetIdsRequest>,
) -> AppResult<StatusCode> {
    let Some(item) = state.storage.get_media_by_id(id).await? else {
        return Err(AppError::NotFound);
    };
    state
        .storage
        .set_media_tags_by_file_key(&item.file_key, req.ids, Some(cu.id))
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn delete_item(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<StatusCode> {
    state.storage.soft_delete_media(id, Some(cu.id)).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn restore_item(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<StatusCode> {
    state.storage.restore_media(id, Some(cu.id)).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn hard_delete_item(
    State(state): State<AppState>,
    axum::Extension(_cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<StatusCode> {
    let Some(item) = state.storage.get_media_by_id(id).await? else {
        return Err(AppError::NotFound);
    };
    if item.deleted_at.is_none() {
        return Err(AppError::BadRequest("只能在回收站中物理删除".to_string()));
    }
    let _ = tokio::fs::remove_file(&item.path).await;
    state.storage.hard_delete_media_record(id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct TrashListQuery {
    #[serde(rename = "type")]
    pub media_type: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

async fn list_trash(
    State(state): State<AppState>,
    Query(q): Query<TrashListQuery>,
) -> AppResult<Json<Vec<MediaItemResponse>>> {
    let mt = q.media_type.as_deref().map(parse_media_type).transpose()?;
    let page = q.page.unwrap_or(1);
    let limit = q.limit.unwrap_or(50);

    let items = state
        .storage
        .list_trash_media(TrashQuery {
            media_type: mt,
            page,
            limit,
        })
        .await?;
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let category_ids = state
            .storage
            .list_media_category_ids(&item.file_key)
            .await?;
        let tag_ids = state.storage.list_media_tag_ids(&item.file_key).await?;
        out.push(MediaItemResponse {
            item,
            category_ids,
            tag_ids,
        });
    }
    Ok(Json(out))
}

async fn get_content(
    headers: HeaderMap,
    State(state): State<AppState>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<Response> {
    let Some(item) = state.storage.get_media_by_id(id).await? else {
        return Err(AppError::NotFound);
    };
    if item.deleted_at.is_some() {
        return Err(AppError::NotFound);
    }

    let mut file = tokio::fs::File::open(&item.path)
        .await
        .map_err(|_| AppError::NotFound)?;
    let len = file.metadata().await.map_err(|_| AppError::NotFound)?.len();

    let mime = mime_guess::from_path(&item.path).first_or_octet_stream();
    let range = headers
        .get(header::RANGE)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| parse_range(s, len));

    let mut resp = if let Some((start, end)) = range {
        let n = end - start + 1;
        file.seek(std::io::SeekFrom::Start(start))
            .await
            .map_err(|_| AppError::Internal)?;
        let body = Body::from_stream(ReaderStream::new(file.take(n)));
        let mut resp = (StatusCode::PARTIAL_CONTENT, body).into_response();
        resp.headers_mut().insert(
            header::CONTENT_RANGE,
            HeaderValue::from_str(&format!("bytes {start}-{end}/{len}"))
                .map_err(|_| AppError::Internal)?,
        );
        resp.headers_mut().insert(
            header::CONTENT_LENGTH,
            HeaderValue::from_str(&n.to_string()).map_err(|_| AppError::Internal)?,
        );
        resp
    } else if headers.contains_key(header::RANGE) {
        let mut resp = (StatusCode::RANGE_NOT_SATISFIABLE, Body::empty()).into_response();
        resp.headers_mut().insert(
            header::CONTENT_RANGE,
            HeaderValue::from_str(&format!("bytes */{len}")).map_err(|_| AppError::Internal)?,
        );
        resp
    } else {
        let body = Body::from_stream(ReaderStream::new(file));
        let mut resp = body.into_response();
        resp.headers_mut().insert(
            header::CONTENT_LENGTH,
            HeaderValue::from_str(&len.to_string()).map_err(|_| AppError::Internal)?,
        );
        resp
    };

    resp.headers_mut()
        .insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));
    resp.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(mime.as_ref()).map_err(|_| AppError::Internal)?,
    );
    Ok(resp)
}

fn parse_media_type(s: &str) -> AppResult<MediaType> {
    match s {
        "photo" => Ok(MediaType::Photo),
        "video" => Ok(MediaType::Video),
        "music" => Ok(MediaType::Music),
        _ => Err(AppError::BadRequest("未知媒体类型".to_string())),
    }
}

fn sha256_hex(s: &str) -> String {
    let mut h = Sha256::new();
    h.update(s.as_bytes());
    hex::encode(h.finalize())
}

fn normalize_path(p: &Path) -> String {
    if let Ok(c) = p.canonicalize() {
        c.to_string_lossy().to_string()
    } else {
        p.to_string_lossy().to_string()
    }
}

fn parse_range(s: &str, len: u64) -> Option<(u64, u64)> {
    let s = s.trim();
    let s = s.strip_prefix("bytes=")?;
    let first = s.split(',').next()?.trim();
    if first.is_empty() {
        return None;
    }
    let (a, b) = first.split_once('-')?;

    if a.is_empty() {
        let suffix: u64 = b.trim().parse().ok()?;
        if suffix == 0 {
            return None;
        }
        if suffix >= len {
            return Some((0, len.saturating_sub(1)));
        }
        let start = len - suffix;
        return Some((start, len.saturating_sub(1)));
    }

    let start: u64 = a.trim().parse().ok()?;
    if start >= len {
        return None;
    }
    if b.trim().is_empty() {
        return Some((start, len.saturating_sub(1)));
    }
    let end: u64 = b.trim().parse().ok()?;
    if end < start || end >= len {
        return None;
    }
    Some((start, end))
}
