use std::sync::Arc;

use arc_swap::ArcSwap;
use tokio::sync::broadcast;
use tracing_subscriber::reload;
use tracing_subscriber::{EnvFilter, Registry};

use crate::config::AppConfig;
use crate::storage::StorageImpl;

pub type LogReloadHandle = reload::Handle<EnvFilter, Registry>;

#[derive(Clone)]
pub struct AppState {
    config: Arc<ArcSwap<AppConfig>>,
    pub storage: Arc<StorageImpl>,
    pub alerts: broadcast::Sender<crate::modules::alerts::AlertEvent>,
    pub log_reload: Option<LogReloadHandle>,
}

impl AppState {
    pub fn new(
        config: AppConfig,
        storage: Arc<StorageImpl>,
        alerts: broadcast::Sender<crate::modules::alerts::AlertEvent>,
        log_reload: Option<LogReloadHandle>,
    ) -> Self {
        Self {
            config: Arc::new(ArcSwap::from_pointee(config)),
            storage,
            alerts,
            log_reload,
        }
    }

    pub fn config(&self) -> Arc<AppConfig> {
        self.config.load_full()
    }

    pub fn set_config(&self, next: AppConfig) {
        self.config.store(Arc::new(next));
    }
}
