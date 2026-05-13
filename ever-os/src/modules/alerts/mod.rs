use axum::extract::{Path, Query, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::routing::{get, put};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

use crate::domains::Alert;
use crate::error::AppResult;
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewAlert;
use crate::storage::Storage;

#[derive(Debug, Clone, Serialize)]
pub struct AlertEvent {
    pub alert: Alert,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/alerts", get(list_alerts))
        .route("/alerts/:id/read", put(mark_read))
        .route("/ws/alerts", get(ws_alerts))
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub unread: Option<bool>,
    pub limit: Option<u32>,
}

async fn list_alerts(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Vec<Alert>>> {
    let unread = q.unread.unwrap_or(false);
    let limit = q.limit.unwrap_or(100);
    Ok(Json(state.storage.list_alerts(unread, limit).await?))
}

async fn mark_read(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
    Path(id): Path<i64>,
) -> AppResult<()> {
    state.storage.mark_alert_read(id, Some(cu.id)).await?;
    Ok(())
}

async fn ws_alerts(State(state): State<AppState>, ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(state.alerts.subscribe(), socket))
}

async fn handle_ws(
    mut rx: broadcast::Receiver<AlertEvent>,
    mut socket: axum::extract::ws::WebSocket,
) {
    while let Ok(evt) = rx.recv().await {
        if let Ok(text) = serde_json::to_string(&evt) {
            if socket
                .send(axum::extract::ws::Message::Text(text))
                .await
                .is_err()
            {
                break;
            }
        }
    }
}

pub(crate) async fn emit_alert(state: &AppState, alert: NewAlert) -> AppResult<Alert> {
    let rec = state.storage.create_alert(alert).await?;
    let _ = state.alerts.send(AlertEvent { alert: rec.clone() });
    Ok(rec)
}
