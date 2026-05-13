use std::path::PathBuf;

use axum::extract::State;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use sysinfo::{Disks, Networks, System};
use tracing_subscriber::EnvFilter;

use crate::config::AppConfig;
use crate::domains::AlertLevel;
use crate::error::AppResult;
use crate::middleware::CurrentUser;
use crate::state::AppState;
use crate::storage::NewAlert;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/system/reload-config", post(reload_config))
        .route("/system/reboot/hard", post(hard_reboot))
        .route("/system/info", get(system_info))
}

#[derive(Debug, Serialize)]
pub struct ReloadConfigResponse {
    pub ok: bool,
}

async fn reload_config(
    State(state): State<AppState>,
    axum::Extension(cu): axum::Extension<CurrentUser>,
) -> AppResult<Json<ReloadConfigResponse>> {
    let path = std::env::var("CONFIG_PATH")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(AppConfig::default_path);
    let next = AppConfig::load(&path)?;
    state.set_config(next.clone());

    if let Some(handle) = state.log_reload.as_ref() {
        let _ = handle.reload(EnvFilter::new(next.log.level));
    }

    let _ = crate::modules::alerts::emit_alert(
        &state,
        NewAlert {
            level: AlertLevel::Info,
            source: "config".to_string(),
            message: "配置已重载".to_string(),
            data_json: None,
            created_by: Some(cu.id),
        },
    )
    .await;

    Ok(Json(ReloadConfigResponse { ok: true }))
}

async fn hard_reboot() -> AppResult<Json<ReloadConfigResponse>> {
    tokio::spawn(async {
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        std::process::exit(0);
    });
    Ok(Json(ReloadConfigResponse { ok: true }))
}

#[derive(Debug, Serialize)]
pub struct SystemInfoResponse {
    pub cpu_usage: f32,
    pub total_memory: u64,
    pub used_memory: u64,
    pub network_rx: u64,
    pub network_tx: u64,
    pub thread_count: Option<u64>,
    pub handle_count: Option<u64>,
    pub mount_free_space: Vec<MountSpace>,
}

#[derive(Debug, Serialize)]
pub struct MountSpace {
    pub path: String,
    pub available: Option<u64>,
    pub total: Option<u64>,
}

async fn system_info(State(state): State<AppState>) -> AppResult<Json<SystemInfoResponse>> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_info().cpu_usage();

    let networks = Networks::new_with_refreshed_list();
    let (rx, tx) = networks
        .iter()
        .fold((0u64, 0u64), |(rx, tx), (_name, data)| {
            (rx + data.received(), tx + data.transmitted())
        });

    let (thread_count, handle_count) = system_process_metrics();

    let disks = Disks::new_with_refreshed_list();
    let cfg = state.config();
    let mount_free_space = cfg
        .storage
        .mount_paths
        .iter()
        .map(|p| {
            let mp = PathBuf::from(p);
            let mut best: Option<(u64, u64)> = None;
            for d in disks.list() {
                let mount = d.mount_point();
                if mp.starts_with(mount) {
                    let total = d.total_space();
                    let avail = d.available_space();
                    best = Some((avail, total));
                }
            }
            MountSpace {
                path: p.clone(),
                available: best.map(|v| v.0),
                total: best.map(|v| v.1),
            }
        })
        .collect();

    Ok(Json(SystemInfoResponse {
        cpu_usage,
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        network_rx: rx,
        network_tx: tx,
        thread_count,
        handle_count,
        mount_free_space,
    }))
}

fn system_process_metrics() -> (Option<u64>, Option<u64>) {
    #[cfg(target_os = "linux")]
    {
        let t = crate::platform::linux::process_thread_count().ok();
        let h = crate::platform::linux::process_handle_count().ok();
        (t, h)
    }
    #[cfg(target_os = "windows")]
    {
        let t = crate::platform::windows::process_thread_count().ok();
        let h = crate::platform::windows::process_handle_count().ok();
        (t, h)
    }
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        let t = crate::platform::fallback::process_thread_count().ok();
        let h = crate::platform::fallback::process_handle_count().ok();
        (t, h)
    }
}
