use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;

use crate::domains::Category;
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewCategory;
use crate::storage::Storage;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/categories", post(create).get(list))
        .route(
            "/categories/:id",
            get(get_one).put(update).delete(soft_delete),
        )
        .route("/categories/:id/restore", post(restore))
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
}

async fn create(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Json(req): Json<CreateCategoryRequest>,
) -> AppResult<Json<Category>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }
    let c = state
        .storage
        .create_category(NewCategory {
            name: req.name,
            created_by: Some(cu.id),
        })
        .await?;
    Ok(Json(c))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub include_deleted: Option<bool>,
}

async fn list(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Vec<Category>>> {
    Ok(Json(
        state
            .storage
            .list_categories(q.include_deleted.unwrap_or(false))
            .await?,
    ))
}

async fn get_one(State(state): State<AppState>, Path(id): Path<i64>) -> AppResult<Json<Category>> {
    let Some(c) = state.storage.get_category_by_id(id, false).await? else {
        return Err(AppError::NotFound);
    };
    Ok(Json(c))
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: String,
}

async fn update(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateCategoryRequest>,
) -> AppResult<Json<Category>> {
    if req.name.trim().is_empty() {
        return Err(AppError::BadRequest("name 不能为空".to_string()));
    }
    let c = state
        .storage
        .update_category_name(id, req.name, Some(cu.id))
        .await?;
    Ok(Json(c))
}

async fn soft_delete(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
) -> AppResult<()> {
    state.storage.soft_delete_category(id, Some(cu.id)).await?;
    Ok(())
}

async fn restore(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
) -> AppResult<()> {
    state.storage.restore_category(id, Some(cu.id)).await?;
    Ok(())
}
