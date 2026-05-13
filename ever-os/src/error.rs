use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("未授权")]
    Unauthorized,
    #[error("禁止访问")]
    Forbidden,
    #[error("资源不存在")]
    NotFound,
    #[error("参数错误: {0}")]
    BadRequest(String),
    #[error("内部错误")]
    Internal,
}

#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub code: String,
    pub message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", self.to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "FORBIDDEN", self.to_string()),
            AppError::NotFound => (StatusCode::NOT_FOUND, "NOT_FOUND", self.to_string()),
            AppError::BadRequest(_) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", self.to_string()),
            AppError::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL",
                self.to_string(),
            ),
        };

        (
            status,
            Json(ErrorBody {
                code: code.to_string(),
                message,
            }),
        )
            .into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
