use axum::middleware;
use axum::routing::get;
use axum::{Json, Router};
use tower::ServiceBuilder;

use crate::error::AppResult;
use crate::middleware::{
    authz_by_path, dynamic_cors, dynamic_gzip, dynamic_trace, operation_log, request_logging,
};
use crate::modules;
use crate::state::AppState;

pub fn build_app(state: AppState) -> Router {
    let api: Router<AppState> = Router::new()
        .route("/health", get(health))
        .merge(modules::auth::routes())
        .merge(modules::system::routes())
        .merge(modules::users::routes())
        .merge(modules::media::routes())
        .merge(modules::libraries::routes())
        .merge(modules::categories::routes())
        .merge(modules::tags::routes())
        .merge(modules::logs::routes())
        .merge(modules::alerts::routes())
        .layer(middleware::from_fn_with_state(state.clone(), authz_by_path))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            modules::auth::auth_optional,
        ));

    Router::new()
        .nest("/api/v1", api)
        .with_state(state.clone())
        .layer(
            ServiceBuilder::new()
                .layer(middleware::from_fn_with_state(state.clone(), dynamic_cors))
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    request_logging,
                ))
                .layer(middleware::from_fn_with_state(state.clone(), dynamic_trace))
                .layer(middleware::from_fn_with_state(state.clone(), dynamic_gzip))
                .layer(middleware::from_fn_with_state(state.clone(), operation_log)),
        )
}

async fn health() -> AppResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({ "status": "ok" })))
}
