use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use crate::domains::{User, UserPermission};
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::{NewUser, Storage};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(list_users).post(create_user))
        .route(
            "/users/:id/permissions",
            get(list_permissions).put(set_permissions),
        )
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub is_admin: Option<bool>,
    pub permissions: Option<Vec<UserPermissionInput>>,
}

#[derive(Debug, Deserialize)]
pub struct UserPermissionInput {
    pub target: String,
    pub can_read: bool,
    pub can_write: bool,
}

async fn list_users(State(state): State<AppState>) -> AppResult<Json<Vec<User>>> {
    Ok(Json(state.storage.list_users().await?))
}

async fn create_user(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Json(req): Json<CreateUserRequest>,
) -> AppResult<Json<User>> {
    if !cu.is_admin {
        return Err(AppError::Forbidden);
    }
    if req.username.trim().is_empty() || req.password.trim().is_empty() {
        return Err(AppError::BadRequest("用户名或密码不能为空".to_string()));
    }

    let is_admin = req.is_admin.unwrap_or(false);
    let password_hash = crate::modules::auth::hash_password(&req.password)?;
    let user = state
        .storage
        .create_user(NewUser {
            username: req.username,
            password_hash,
            is_admin,
            created_by: Some(cu.id),
        })
        .await?;

    if !is_admin {
        let perms = req
            .permissions
            .unwrap_or_default()
            .into_iter()
            .map(|p| UserPermission {
                user_id: user.id,
                target: p.target,
                can_read: p.can_read,
                can_write: p.can_write,
            })
            .collect();
        state
            .storage
            .upsert_user_permissions(user.id, perms, Some(cu.id))
            .await?;
    }

    Ok(Json(user))
}

async fn list_permissions(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> AppResult<Json<Vec<UserPermission>>> {
    Ok(Json(state.storage.list_user_permissions(id).await?))
}

#[derive(Debug, Deserialize)]
pub struct SetPermissionsRequest {
    pub permissions: Vec<UserPermissionInput>,
}

async fn set_permissions(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
    Json(req): Json<SetPermissionsRequest>,
) -> AppResult<()> {
    let perms = req
        .permissions
        .into_iter()
        .map(|p| UserPermission {
            user_id: id,
            target: p.target,
            can_read: p.can_read,
            can_write: p.can_write,
        })
        .collect();
    state
        .storage
        .upsert_user_permissions(id, perms, Some(cu.id))
        .await?;
    Ok(())
}
