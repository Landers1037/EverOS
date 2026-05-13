use std::path::{Path, PathBuf};

use axum::extract::{Path as AxumPath, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;

use crate::domains::Library;
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewLibrary;
use crate::storage::Storage;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/libraries", post(create).get(list))
        .route(
            "/libraries/:id",
            get(get_one).put(update).delete(soft_delete),
        )
        .route("/libraries/:id/restore", post(restore))
}

#[derive(Debug, Deserialize)]
pub struct CreateLibraryRequest {
    pub name: String,
    pub root_path: String,
}

async fn create(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Json(req): Json<CreateLibraryRequest>,
) -> AppResult<Json<Library>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }

    let root = PathBuf::from(&req.root_path);
    if !is_under_mounts(&state.config().storage.mount_paths, &root) {
        return Err(AppError::BadRequest(
            "存储库必须创建在挂载目录下面".to_string(),
        ));
    }

    tokio::fs::create_dir_all(root.join("photo"))
        .await
        .map_err(|_| AppError::Internal)?;
    tokio::fs::create_dir_all(root.join("video"))
        .await
        .map_err(|_| AppError::Internal)?;
    tokio::fs::create_dir_all(root.join("music"))
        .await
        .map_err(|_| AppError::Internal)?;

    let lib = state
        .storage
        .create_library(NewLibrary {
            name: req.name,
            root_path: req.root_path,
            created_by: Some(cu.id),
        })
        .await?;

    Ok(Json(lib))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub include_deleted: Option<bool>,
}

async fn list(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Vec<Library>>> {
    Ok(Json(
        state
            .storage
            .list_libraries(q.include_deleted.unwrap_or(false))
            .await?,
    ))
}

async fn get_one(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<Json<Library>> {
    let Some(lib) = state.storage.get_library_by_id(id, false).await? else {
        return Err(AppError::NotFound);
    };
    Ok(Json(lib))
}

#[derive(Debug, Deserialize)]
pub struct UpdateLibraryRequest {
    pub name: String,
}

async fn update(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
    Json(req): Json<UpdateLibraryRequest>,
) -> AppResult<Json<Library>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }
    let lib = state
        .storage
        .update_library_name(id, req.name, Some(cu.id))
        .await?;
    Ok(Json(lib))
}

async fn soft_delete(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<()> {
    state.storage.soft_delete_library(id, Some(cu.id)).await?;
    Ok(())
}

async fn restore(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    AxumPath(id): AxumPath<i64>,
) -> AppResult<()> {
    state.storage.restore_library(id, Some(cu.id)).await?;
    Ok(())
}

fn is_under_mounts(mounts: &[String], path: &Path) -> bool {
    let Ok(p) = path.canonicalize() else {
        return false;
    };
    mounts.iter().any(|m| {
        PathBuf::from(m)
            .canonicalize()
            .ok()
            .is_some_and(|mp| p.starts_with(mp))
    })
}
