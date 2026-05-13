use axum::extract::{Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use crate::domains::OperationLog;
use crate::state::AppState;
use crate::storage::Storage;

pub fn routes() -> Router<AppState> {
    Router::new().route("/logs/operations", get(list_operation_logs))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<u32>,
}

async fn list_operation_logs(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> crate::error::AppResult<Json<Vec<OperationLog>>> {
    let limit = q.limit.unwrap_or(100);
    Ok(Json(state.storage.list_operation_logs(limit).await?))
}
