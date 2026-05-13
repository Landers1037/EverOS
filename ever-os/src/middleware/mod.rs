use axum::Extension;
use axum::extract::State;
use axum::http::{HeaderMap, HeaderValue, Method};
use axum::middleware::Next;
use axum::response::Response;
use tracing::Instrument;

use crate::domains::OpSeverity;
use crate::state::AppState;
use crate::storage::NewOperationLog;
use crate::storage::Storage;

#[derive(Clone)]
pub struct CurrentUser {
    pub id: i64,
    pub username: String,
    pub is_admin: bool,
}

pub async fn request_logging(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    let enabled = state.config().middleware.logging;
    if !enabled {
        return next.run(req).await;
    }

    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let start = time::OffsetDateTime::now_utc();
    let resp = next.run(req).await;
    let ms = (time::OffsetDateTime::now_utc() - start).whole_milliseconds();
    tracing::info!(method = %method, path = %path, status = %resp.status(), elapsed_ms = ms);
    resp
}

pub async fn dynamic_trace(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    if !state.config().middleware.trace {
        return next.run(req).await;
    }

    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let start = time::OffsetDateTime::now_utc();
    let span = tracing::info_span!("http", method = %method, path = %path);

    let resp = async { next.run(req).await }.instrument(span).await;
    let ms = (time::OffsetDateTime::now_utc() - start).whole_milliseconds();
    tracing::trace!(method = %method, path = %path, status = %resp.status(), elapsed_ms = ms);
    resp
}

pub async fn dynamic_cors(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    let cfg = state.config();
    if !cfg.middleware.cors {
        return next.run(req).await;
    }

    let origin = req
        .headers()
        .get("origin")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let mut resp = next.run(req).await;

    if let Some(origin) = origin {
        if cfg
            .cors
            .allow_origins
            .iter()
            .any(|o| o == "*" || o == &origin)
        {
            let _ = resp.headers_mut().insert(
                "access-control-allow-origin",
                HeaderValue::from_str(&origin).unwrap_or(HeaderValue::from_static("*")),
            );
        }
    }

    let allow_headers = if cfg.cors.allow_headers.is_empty() {
        "*".to_string()
    } else {
        cfg.cors.allow_headers.join(",")
    };
    let allow_methods = if cfg.cors.allow_methods.is_empty() {
        "GET,POST,PUT,DELETE,OPTIONS".to_string()
    } else {
        cfg.cors.allow_methods.join(",")
    };

    let _ = resp.headers_mut().insert(
        "access-control-allow-headers",
        HeaderValue::from_str(&allow_headers).unwrap_or(HeaderValue::from_static("*")),
    );
    let _ = resp.headers_mut().insert(
        "access-control-allow-methods",
        HeaderValue::from_str(&allow_methods)
            .unwrap_or(HeaderValue::from_static("GET,POST,PUT,DELETE,OPTIONS")),
    );
    let _ = resp.headers_mut().insert(
        "access-control-allow-credentials",
        HeaderValue::from_static("true"),
    );

    resp
}

pub async fn dynamic_gzip(
    headers: HeaderMap,
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    if !state.config().middleware.gzip {
        return next.run(req).await;
    }

    let accept_gzip = headers
        .get("accept-encoding")
        .and_then(|v| v.to_str().ok())
        .is_some_and(|s| s.to_ascii_lowercase().contains("gzip"));

    if !accept_gzip {
        return next.run(req).await;
    }

    let resp = next.run(req).await;
    let content_type = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !content_type.starts_with("application/json") {
        return resp;
    }

    if resp.headers().contains_key("content-encoding") {
        return resp;
    }

    let (mut parts, body) = resp.into_parts();
    let collected = match http_body_util::BodyExt::collect(body).await {
        Ok(c) => c,
        Err(_) => return Response::from_parts(parts, axum::body::Body::empty()),
    };
    let bytes = collected.to_bytes();
    let bytes_vec = bytes.to_vec();

    let compressed = tokio::task::spawn_blocking(move || {
        use std::io::Write;
        let mut e = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
        e.write_all(&bytes_vec).map_err(|_| ())?;
        e.finish().map_err(|_| ())
    })
    .await
    .ok()
    .and_then(Result::ok);

    let Some(compressed) = compressed else {
        return Response::from_parts(parts, axum::body::Body::from(bytes));
    };

    parts
        .headers
        .insert("content-encoding", HeaderValue::from_static("gzip"));
    parts.headers.remove("content-length");
    parts.headers.insert(
        "content-length",
        HeaderValue::from_str(&compressed.len().to_string())
            .unwrap_or(HeaderValue::from_static("0")),
    );

    Response::from_parts(parts, axum::body::Body::from(compressed))
}

#[derive(Clone)]
pub struct PermissionTarget(pub &'static str);

pub async fn authz_by_path(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Result<Response, crate::error::AppError> {
    let path = req.uri().path();

    if path == "/health" || path == "/auth/login" || path == "/auth/register" {
        return Ok(next.run(req).await);
    }

    if req.method() == Method::OPTIONS {
        return Ok(next.run(req).await);
    }

    let user = req
        .extensions()
        .get::<CurrentUser>()
        .cloned()
        .ok_or(crate::error::AppError::Unauthorized)?;
    if user.is_admin {
        return Ok(next.run(req).await);
    }

    let target = permission_target_from_path(path);
    let action_read = req.method() == Method::GET;
    let perms = state.storage.list_user_permissions(user.id).await?;
    let ok = perms
        .iter()
        .any(|p| p.target == target && if action_read { p.can_read } else { p.can_write });
    if !ok {
        return Err(crate::error::AppError::Forbidden);
    }

    Ok(next.run(req).await)
}

fn permission_target_from_path(path: &str) -> &str {
    if path.starts_with("/ws/") {
        return "alerts";
    }
    if path.starts_with("/trash/") {
        return "media";
    }

    let p = path.trim_start_matches('/');
    let seg = p.split('/').next().unwrap_or("");
    match seg {
        "system" => "system",
        "media" => "media",
        "libraries" => "libraries",
        "categories" => "categories",
        "tags" => "tags",
        "alerts" => "alerts",
        "logs" => "logs",
        "users" => "users",
        "auth" => "users",
        _ => "system",
    }
}

pub async fn require_auth(
    req: axum::extract::Request,
    next: Next,
) -> Result<Response, crate::error::AppError> {
    if req.extensions().get::<CurrentUser>().is_none() {
        return Err(crate::error::AppError::Unauthorized);
    }
    Ok(next.run(req).await)
}

pub async fn require_permission(
    State(state): State<AppState>,
    Extension(user): Extension<CurrentUser>,
    Extension(target): Extension<PermissionTarget>,
    req: axum::extract::Request,
    next: Next,
) -> Result<Response, crate::error::AppError> {
    if user.is_admin {
        return Ok(next.run(req).await);
    }

    let perms = state.storage.list_user_permissions(user.id).await?;
    let action_read = req.method() == Method::GET;
    let ok = perms
        .iter()
        .any(|p| p.target == target.0 && if action_read { p.can_read } else { p.can_write });
    if !ok {
        return Err(crate::error::AppError::Forbidden);
    }

    Ok(next.run(req).await)
}

pub async fn operation_log(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    let method = req.method().to_string();
    let path = req.uri().path().to_string();
    let headers: HeaderMap = req.headers().clone();

    let user = req.extensions().get::<CurrentUser>().cloned();
    let resp = next.run(req).await;

    let status = resp.status().as_u16() as i32;
    let ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let ua = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let severity = if status >= 500 {
        OpSeverity::Critical
    } else if status >= 400 {
        OpSeverity::Warning
    } else {
        OpSeverity::Normal
    };

    let _ = state
        .storage
        .insert_operation_log(NewOperationLog {
            user_id: user.as_ref().map(|u| u.id),
            username: user.as_ref().map(|u| u.username.clone()),
            method,
            path,
            status_code: status,
            resource_type: None,
            resource_id: None,
            severity,
            ip,
            user_agent: ua,
        })
        .await;

    resp
}
