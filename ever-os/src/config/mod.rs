use std::path::{Path, PathBuf};

use figment::Figment;
use figment::providers::{Env, Format, Toml};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub auth: AuthConfig,
    pub database: DatabaseConfig,
    pub storage: StorageConfig,
    pub middleware: MiddlewareConfig,
    pub cors: CorsConfig,
    pub log: LogConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtConfig {
    pub issuer: String,
    pub audience: String,
    pub secret: String,
    pub expires_minutes: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub engine: DatabaseEngine,
    pub sqlite: SqliteConfig,
    pub sled: SledConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseEngine {
    Sqlite,
    Sled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SqliteConfig {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SledConfig {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub mount_paths: Vec<String>,
    pub exclude_dirs: Vec<String>,
    pub extensions: StorageExtensions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageExtensions {
    pub photo: Vec<String>,
    pub video: Vec<String>,
    pub music: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiddlewareConfig {
    pub logging: bool,
    pub trace: bool,
    pub cors: bool,
    pub gzip: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    pub allow_origins: Vec<String>,
    pub allow_headers: Vec<String>,
    pub allow_methods: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub level: String,
    pub retention_days: i64,
}

impl AppConfig {
    pub fn default_path() -> PathBuf {
        PathBuf::from("./config/config.toml")
    }

    pub fn load(path: &Path) -> AppResult<Self> {
        Figment::new()
            .merge(Toml::file(path))
            .merge(Env::prefixed("EVEROS_").split("__"))
            .extract::<Self>()
            .map_err(|e| AppError::BadRequest(format!("配置解析失败: {e}")))
    }
}
