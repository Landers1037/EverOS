use axum::extract::State;
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};

use crate::config::AppConfig;
use crate::domains::{User, UserPermission};
use crate::error::{AppError, AppResult};
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewUser;
use crate::storage::Storage;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/me", get(me))
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub user: User,
    pub permissions: Vec<UserPermission>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    username: String,
    is_admin: bool,
    iss: String,
    aud: String,
    exp: usize,
}

pub async fn auth_optional(
    State(state): State<AppState>,
    mut req: axum::extract::Request,
    next: Next,
) -> Result<Response, AppError> {
    let Some(token) = bearer_token(req.headers()) else {
        return Ok(next.run(req).await);
    };

    let user = verify_jwt(&state.config(), &token)?;
    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let h = headers.get("authorization")?.to_str().ok()?;
    let h = h.trim();
    let token = h
        .strip_prefix("Bearer ")
        .or_else(|| h.strip_prefix("bearer "))?;
    Some(token.trim().to_string())
}

fn verify_jwt(cfg: &AppConfig, token: &str) -> AppResult<CurrentUser> {
    let mut validation = Validation::default();
    validation.set_issuer(&[cfg.auth.jwt.issuer.as_str()]);
    validation.set_audience(&[cfg.auth.jwt.audience.as_str()]);

    let data = jsonwebtoken::decode::<Claims>(
        token,
        &DecodingKey::from_secret(cfg.auth.jwt.secret.as_bytes()),
        &validation,
    )
    .map_err(|_| AppError::Unauthorized)?;

    let id: i64 = data
        .claims
        .sub
        .parse()
        .map_err(|_| AppError::Unauthorized)?;
    Ok(CurrentUser {
        id,
        username: data.claims.username,
        is_admin: data.claims.is_admin,
    })
}

fn sign_jwt(cfg: &AppConfig, user: &User) -> AppResult<String> {
    let exp = (time::OffsetDateTime::now_utc()
        + time::Duration::minutes(cfg.auth.jwt.expires_minutes))
    .unix_timestamp() as usize;
    let claims = Claims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        is_admin: user.is_admin,
        iss: cfg.auth.jwt.issuer.clone(),
        aud: cfg.auth.jwt.audience.clone(),
        exp,
    };
    jsonwebtoken::encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(cfg.auth.jwt.secret.as_bytes()),
    )
    .map_err(|_| AppError::Internal)
}

async fn register(
    State(state): State<AppState>,
    user: Option<axum::Extension<CurrentUser>>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<LoginResponse>> {
    if req.username.trim().is_empty() || req.password.trim().is_empty() {
        return Err(AppError::BadRequest("用户名或密码不能为空".to_string()));
    }

    let user_count = state.storage.user_count().await?;
    let mut is_admin = false;
    let mut created_by: Option<i64> = None;

    if user_count == 0 {
        is_admin = true;
    } else {
        let Some(axum::Extension(cu)) = user else {
            return Err(AppError::Forbidden);
        };
        if !cu.is_admin {
            return Err(AppError::Forbidden);
        }
        created_by = Some(cu.id);
    }

    let password_hash = hash_password(&req.password)?;
    let user = state
        .storage
        .create_user(NewUser {
            username: req.username,
            password_hash,
            is_admin,
            created_by,
        })
        .await?;

    let token = sign_jwt(&state.config(), &user)?;
    Ok(Json(LoginResponse { token, user }))
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    let Some(up) = state.storage.find_user_by_username(&req.username).await? else {
        return Err(AppError::Unauthorized);
    };

    verify_password(&req.password, &up.password_hash)?;
    let token = sign_jwt(&state.config(), &up.user)?;
    Ok(Json(LoginResponse {
        token,
        user: up.user,
    }))
}

async fn me(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
) -> AppResult<Json<MeResponse>> {
    let Some(user) = state.storage.get_user_by_id(cu.id).await? else {
        return Err(AppError::Unauthorized);
    };
    let permissions = if user.is_admin {
        vec![]
    } else {
        state.storage.list_user_permissions(user.id).await?
    };
    Ok(Json(MeResponse { user, permissions }))
}

pub(crate) fn hash_password(password: &str) -> AppResult<String> {
    use argon2::password_hash::SaltString;
    use argon2::{Argon2, PasswordHasher};

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal)?;
    Ok(hash.to_string())
}

pub(crate) fn verify_password(password: &str, hash: &str) -> AppResult<()> {
    use argon2::password_hash::PasswordHash;
    use argon2::{Argon2, PasswordVerifier};

    let parsed = PasswordHash::new(hash).map_err(|_| AppError::Unauthorized)?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .map_err(|_| AppError::Unauthorized)?;
    Ok(())
}
