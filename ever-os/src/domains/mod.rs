use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub uuid: Uuid,
    pub username: String,
    pub is_admin: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserWithPassword {
    pub user: User,
    pub password_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPermission {
    pub user_id: i64,
    pub target: String,
    pub can_read: bool,
    pub can_write: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Photo,
    Video,
    Music,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaItem {
    pub id: i64,
    pub path: String,
    pub file_name: String,
    pub file_key: String,
    pub media_type: MediaType,
    pub size_bytes: i64,
    pub favorite: bool,
    pub library_id: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
    pub deleted_by: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Library {
    pub id: i64,
    pub name: String,
    pub root_path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OpSeverity {
    Normal,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationLog {
    pub id: i64,
    pub user_id: Option<i64>,
    pub username: Option<String>,
    pub method: String,
    pub path: String,
    pub status_code: i32,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub severity: OpSeverity,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertLevel {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: i64,
    pub level: AlertLevel,
    pub source: String,
    pub message: String,
    pub data_json: Option<serde_json::Value>,
    pub read_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub created_by: Option<i64>,
    pub updated_by: Option<i64>,
}
