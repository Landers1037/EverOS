use std::path::PathBuf;
use std::sync::Arc;

use ever_os::app::build_app;
use ever_os::config::{AppConfig, DatabaseEngine};
use ever_os::state::AppState;
use ever_os::storage::{StorageImpl, sled::SledStorage, sqlite::SqliteStorage};
use tokio::signal;
use tokio::sync::broadcast;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::reload;
use tracing_subscriber::util::SubscriberInitExt;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg_path = std::env::var("CONFIG_PATH")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(AppConfig::default_path);
    let cfg = AppConfig::load(&cfg_path)?;

    let (filter_layer, filter_handle) = reload::Layer::new(EnvFilter::new(cfg.log.level.clone()));
    tracing_subscriber::registry()
        .with(filter_layer)
        .with(tracing_subscriber::fmt::layer())
        .init();

    let (alerts_tx, _alerts_rx) = broadcast::channel(1024);

    let host = cfg.server.host.clone();
    let port = cfg.server.port;

    let storage: Arc<StorageImpl> = match cfg.database.engine {
        DatabaseEngine::Sqlite => {
            let db_file = PathBuf::from(&cfg.database.sqlite.path).join(&cfg.database.sqlite.name);
            Arc::new(StorageImpl::Sqlite(SqliteStorage::connect(&db_file).await?))
        }
        DatabaseEngine::Sled => {
            let p = PathBuf::from(&cfg.database.sled.path);
            Arc::new(StorageImpl::Sled(SledStorage::open(&p).await?))
        }
    };

    storage.migrate().await?;

    let state = AppState::new(cfg, storage, alerts_tx, Some(filter_handle));
    let app = build_app(state);

    let addr = format!("{host}:{port}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("listening on {}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install terminate handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
