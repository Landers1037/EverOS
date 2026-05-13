use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;

use crate::domains::Tag;
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewTag;
use crate::storage::Storage;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tags", post(create).get(list))
        .route("/tags/:id", get(get_one).put(update).delete(soft_delete))
        .route("/tags/:id/restore", post(restore))
}

#[derive(Debug, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
}

async fn create(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Json(req): Json<CreateTagRequest>,
) -> AppResult<Json<Tag>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }
    let t = state
        .storage
        .create_tag(NewTag {
            name: req.name,
            created_by: Some(cu.id),
        })
        .await?;
    Ok(Json(t))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub include_deleted: Option<bool>,
}

async fn list(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Vec<Tag>>> {
    Ok(Json(
        state
            .storage
            .list_tags(q.include_deleted.unwrap_or(false))
            .await?,
    ))
}

async fn get_one(State(state): State<AppState>, Path(id): Path<i64>) -> AppResult<Json<Tag>> {
    let Some(t) = state.storage.get_tag_by_id(id, false).await? else {
        return Err(AppError::NotFound);
    };
    Ok(Json(t))
}

#[derive(Debug, Deserialize)]
pub struct UpdateTagRequest {
    pub name: String,
}

async fn update(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateTagRequest>,
) -> AppResult<Json<Tag>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }
    let t = state
        .storage
        .update_tag_name(id, req.name, Some(cu.id))
        .await?;
    Ok(Json(t))
}

async fn soft_delete(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
) -> AppResult<()> {
    state.storage.soft_delete_tag(id, Some(cu.id)).await?;
    Ok(())
}

async fn restore(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
) -> AppResult<()> {
    state.storage.restore_tag(id, Some(cu.id)).await?;
    Ok(())
}
