use crate::domains::*;
use crate::error::AppResult;

pub mod sled;
pub mod sqlite;

#[derive(Debug, Clone)]
pub(crate) struct NewUser {
    pub username: String,
    pub password_hash: String,
    pub is_admin: bool,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct NewLibrary {
    pub name: String,
    pub root_path: String,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct NewCategory {
    pub name: String,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct NewTag {
    pub name: String,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct MediaUpsert {
    pub path: String,
    pub file_name: String,
    pub file_key: String,
    pub media_type: MediaType,
    pub size_bytes: i64,
    pub library_id: Option<i64>,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct MediaQuery {
    pub q: Option<String>,
    pub media_type: Option<MediaType>,
    pub favorite: Option<bool>,
    pub folder_path: Option<String>,
    pub page: u32,
    pub limit: u32,
}

#[derive(Debug, Clone)]
pub(crate) struct TrashQuery {
    pub media_type: Option<MediaType>,
    pub page: u32,
    pub limit: u32,
}

#[derive(Debug, Clone)]
pub(crate) struct NewAlert {
    pub level: AlertLevel,
    pub source: String,
    pub message: String,
    pub data_json: Option<serde_json::Value>,
    pub created_by: Option<i64>,
}

#[derive(Debug, Clone)]
pub(crate) struct NewOperationLog {
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
}

pub(crate) trait Storage: Send + Sync {
    async fn migrate(&self) -> AppResult<()>;

    async fn user_count(&self) -> AppResult<i64>;
    async fn create_user(&self, new_user: NewUser) -> AppResult<User>;
    async fn find_user_by_username(&self, username: &str) -> AppResult<Option<UserWithPassword>>;
    async fn get_user_by_id(&self, id: i64) -> AppResult<Option<User>>;
    async fn list_users(&self) -> AppResult<Vec<User>>;
    async fn upsert_user_permissions(
        &self,
        user_id: i64,
        perms: Vec<UserPermission>,
        actor_id: Option<i64>,
    ) -> AppResult<()>;
    async fn list_user_permissions(&self, user_id: i64) -> AppResult<Vec<UserPermission>>;

    async fn create_library(&self, new_lib: NewLibrary) -> AppResult<Library>;
    async fn get_library_by_id(&self, id: i64, include_deleted: bool)
    -> AppResult<Option<Library>>;
    async fn list_libraries(&self, include_deleted: bool) -> AppResult<Vec<Library>>;
    async fn update_library_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Library>;
    async fn soft_delete_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn restore_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;

    async fn upsert_media_by_path(&self, input: MediaUpsert) -> AppResult<MediaItem>;
    async fn get_media_by_id(&self, id: i64) -> AppResult<Option<MediaItem>>;
    #[allow(dead_code)]
    async fn get_media_by_path(&self, path: &str) -> AppResult<Option<MediaItem>>;
    async fn list_media(&self, q: MediaQuery) -> AppResult<Vec<MediaItem>>;
    async fn list_trash_media(&self, q: TrashQuery) -> AppResult<Vec<MediaItem>>;
    async fn set_media_favorite(
        &self,
        id: i64,
        favorite: bool,
        updated_by: Option<i64>,
    ) -> AppResult<()>;
    async fn soft_delete_media(&self, id: i64, deleted_by: Option<i64>) -> AppResult<()>;
    async fn restore_media(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn hard_delete_media_record(&self, id: i64) -> AppResult<()>;

    async fn create_category(&self, input: NewCategory) -> AppResult<Category>;
    async fn get_category_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Category>>;
    async fn list_categories(&self, include_deleted: bool) -> AppResult<Vec<Category>>;
    async fn update_category_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Category>;
    async fn soft_delete_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn restore_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn create_tag(&self, input: NewTag) -> AppResult<Tag>;
    async fn get_tag_by_id(&self, id: i64, include_deleted: bool) -> AppResult<Option<Tag>>;
    async fn list_tags(&self, include_deleted: bool) -> AppResult<Vec<Tag>>;
    async fn update_tag_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Tag>;
    async fn soft_delete_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn restore_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
    async fn set_media_categories_by_file_key(
        &self,
        file_key: &str,
        category_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()>;
    async fn set_media_tags_by_file_key(
        &self,
        file_key: &str,
        tag_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()>;
    async fn list_media_category_ids(&self, file_key: &str) -> AppResult<Vec<i64>>;
    async fn list_media_tag_ids(&self, file_key: &str) -> AppResult<Vec<i64>>;

    async fn insert_operation_log(&self, log: NewOperationLog) -> AppResult<()>;
    async fn list_operation_logs(&self, limit: u32) -> AppResult<Vec<OperationLog>>;

    async fn create_alert(&self, alert: NewAlert) -> AppResult<Alert>;
    async fn list_alerts(&self, unread_only: bool, limit: u32) -> AppResult<Vec<Alert>>;
    async fn mark_alert_read(&self, id: i64, updated_by: Option<i64>) -> AppResult<()>;
}

#[derive(Clone)]
pub enum StorageImpl {
    Sqlite(sqlite::SqliteStorage),
    Sled(sled::SledStorage),
}

impl StorageImpl {
    pub async fn migrate(&self) -> AppResult<()> {
        Storage::migrate(self).await
    }
}

impl Storage for StorageImpl {
    async fn migrate(&self) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.migrate().await,
            StorageImpl::Sled(s) => s.migrate().await,
        }
    }

    async fn user_count(&self) -> AppResult<i64> {
        match self {
            StorageImpl::Sqlite(s) => s.user_count().await,
            StorageImpl::Sled(s) => s.user_count().await,
        }
    }

    async fn create_user(&self, new_user: NewUser) -> AppResult<User> {
        match self {
            StorageImpl::Sqlite(s) => s.create_user(new_user).await,
            StorageImpl::Sled(s) => s.create_user(new_user).await,
        }
    }

    async fn find_user_by_username(&self, username: &str) -> AppResult<Option<UserWithPassword>> {
        match self {
            StorageImpl::Sqlite(s) => s.find_user_by_username(username).await,
            StorageImpl::Sled(s) => s.find_user_by_username(username).await,
        }
    }

    async fn get_user_by_id(&self, id: i64) -> AppResult<Option<User>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_user_by_id(id).await,
            StorageImpl::Sled(s) => s.get_user_by_id(id).await,
        }
    }

    async fn list_users(&self) -> AppResult<Vec<User>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_users().await,
            StorageImpl::Sled(s) => s.list_users().await,
        }
    }

    async fn upsert_user_permissions(
        &self,
        user_id: i64,
        perms: Vec<UserPermission>,
        actor_id: Option<i64>,
    ) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.upsert_user_permissions(user_id, perms, actor_id).await,
            StorageImpl::Sled(s) => s.upsert_user_permissions(user_id, perms, actor_id).await,
        }
    }

    async fn list_user_permissions(&self, user_id: i64) -> AppResult<Vec<UserPermission>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_user_permissions(user_id).await,
            StorageImpl::Sled(s) => s.list_user_permissions(user_id).await,
        }
    }

    async fn create_library(&self, new_lib: NewLibrary) -> AppResult<Library> {
        match self {
            StorageImpl::Sqlite(s) => s.create_library(new_lib).await,
            StorageImpl::Sled(s) => s.create_library(new_lib).await,
        }
    }

    async fn get_library_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Library>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_library_by_id(id, include_deleted).await,
            StorageImpl::Sled(s) => s.get_library_by_id(id, include_deleted).await,
        }
    }

    async fn list_libraries(&self, include_deleted: bool) -> AppResult<Vec<Library>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_libraries(include_deleted).await,
            StorageImpl::Sled(s) => s.list_libraries(include_deleted).await,
        }
    }

    async fn update_library_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Library> {
        match self {
            StorageImpl::Sqlite(s) => s.update_library_name(id, name, updated_by).await,
            StorageImpl::Sled(s) => s.update_library_name(id, name, updated_by).await,
        }
    }

    async fn soft_delete_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.soft_delete_library(id, updated_by).await,
            StorageImpl::Sled(s) => s.soft_delete_library(id, updated_by).await,
        }
    }

    async fn restore_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.restore_library(id, updated_by).await,
            StorageImpl::Sled(s) => s.restore_library(id, updated_by).await,
        }
    }

    async fn upsert_media_by_path(&self, input: MediaUpsert) -> AppResult<MediaItem> {
        match self {
            StorageImpl::Sqlite(s) => s.upsert_media_by_path(input).await,
            StorageImpl::Sled(s) => s.upsert_media_by_path(input).await,
        }
    }

    async fn get_media_by_id(&self, id: i64) -> AppResult<Option<MediaItem>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_media_by_id(id).await,
            StorageImpl::Sled(s) => s.get_media_by_id(id).await,
        }
    }

    async fn get_media_by_path(&self, path: &str) -> AppResult<Option<MediaItem>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_media_by_path(path).await,
            StorageImpl::Sled(s) => s.get_media_by_path(path).await,
        }
    }

    async fn list_media(&self, q: MediaQuery) -> AppResult<Vec<MediaItem>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_media(q).await,
            StorageImpl::Sled(s) => s.list_media(q).await,
        }
    }

    async fn list_trash_media(&self, q: TrashQuery) -> AppResult<Vec<MediaItem>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_trash_media(q).await,
            StorageImpl::Sled(s) => s.list_trash_media(q).await,
        }
    }

    async fn set_media_favorite(
        &self,
        id: i64,
        favorite: bool,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.set_media_favorite(id, favorite, updated_by).await,
            StorageImpl::Sled(s) => s.set_media_favorite(id, favorite, updated_by).await,
        }
    }

    async fn soft_delete_media(&self, id: i64, deleted_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.soft_delete_media(id, deleted_by).await,
            StorageImpl::Sled(s) => s.soft_delete_media(id, deleted_by).await,
        }
    }

    async fn restore_media(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.restore_media(id, updated_by).await,
            StorageImpl::Sled(s) => s.restore_media(id, updated_by).await,
        }
    }

    async fn hard_delete_media_record(&self, id: i64) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.hard_delete_media_record(id).await,
            StorageImpl::Sled(s) => s.hard_delete_media_record(id).await,
        }
    }

    async fn create_category(&self, input: NewCategory) -> AppResult<Category> {
        match self {
            StorageImpl::Sqlite(s) => s.create_category(input).await,
            StorageImpl::Sled(s) => s.create_category(input).await,
        }
    }

    async fn get_category_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Category>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_category_by_id(id, include_deleted).await,
            StorageImpl::Sled(s) => s.get_category_by_id(id, include_deleted).await,
        }
    }

    async fn list_categories(&self, include_deleted: bool) -> AppResult<Vec<Category>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_categories(include_deleted).await,
            StorageImpl::Sled(s) => s.list_categories(include_deleted).await,
        }
    }

    async fn update_category_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Category> {
        match self {
            StorageImpl::Sqlite(s) => s.update_category_name(id, name, updated_by).await,
            StorageImpl::Sled(s) => s.update_category_name(id, name, updated_by).await,
        }
    }

    async fn soft_delete_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.soft_delete_category(id, updated_by).await,
            StorageImpl::Sled(s) => s.soft_delete_category(id, updated_by).await,
        }
    }

    async fn restore_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.restore_category(id, updated_by).await,
            StorageImpl::Sled(s) => s.restore_category(id, updated_by).await,
        }
    }

    async fn create_tag(&self, input: NewTag) -> AppResult<Tag> {
        match self {
            StorageImpl::Sqlite(s) => s.create_tag(input).await,
            StorageImpl::Sled(s) => s.create_tag(input).await,
        }
    }

    async fn get_tag_by_id(&self, id: i64, include_deleted: bool) -> AppResult<Option<Tag>> {
        match self {
            StorageImpl::Sqlite(s) => s.get_tag_by_id(id, include_deleted).await,
            StorageImpl::Sled(s) => s.get_tag_by_id(id, include_deleted).await,
        }
    }

    async fn list_tags(&self, include_deleted: bool) -> AppResult<Vec<Tag>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_tags(include_deleted).await,
            StorageImpl::Sled(s) => s.list_tags(include_deleted).await,
        }
    }

    async fn update_tag_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Tag> {
        match self {
            StorageImpl::Sqlite(s) => s.update_tag_name(id, name, updated_by).await,
            StorageImpl::Sled(s) => s.update_tag_name(id, name, updated_by).await,
        }
    }

    async fn soft_delete_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.soft_delete_tag(id, updated_by).await,
            StorageImpl::Sled(s) => s.soft_delete_tag(id, updated_by).await,
        }
    }

    async fn restore_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.restore_tag(id, updated_by).await,
            StorageImpl::Sled(s) => s.restore_tag(id, updated_by).await,
        }
    }

    async fn set_media_categories_by_file_key(
        &self,
        file_key: &str,
        category_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => {
                s.set_media_categories_by_file_key(file_key, category_ids, updated_by)
                    .await
            }
            StorageImpl::Sled(s) => {
                s.set_media_categories_by_file_key(file_key, category_ids, updated_by)
                    .await
            }
        }
    }

    async fn set_media_tags_by_file_key(
        &self,
        file_key: &str,
        tag_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => {
                s.set_media_tags_by_file_key(file_key, tag_ids, updated_by)
                    .await
            }
            StorageImpl::Sled(s) => {
                s.set_media_tags_by_file_key(file_key, tag_ids, updated_by)
                    .await
            }
        }
    }

    async fn list_media_category_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_media_category_ids(file_key).await,
            StorageImpl::Sled(s) => s.list_media_category_ids(file_key).await,
        }
    }

    async fn list_media_tag_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_media_tag_ids(file_key).await,
            StorageImpl::Sled(s) => s.list_media_tag_ids(file_key).await,
        }
    }

    async fn insert_operation_log(&self, log: NewOperationLog) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.insert_operation_log(log).await,
            StorageImpl::Sled(s) => s.insert_operation_log(log).await,
        }
    }

    async fn list_operation_logs(&self, limit: u32) -> AppResult<Vec<OperationLog>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_operation_logs(limit).await,
            StorageImpl::Sled(s) => s.list_operation_logs(limit).await,
        }
    }

    async fn create_alert(&self, alert: NewAlert) -> AppResult<Alert> {
        match self {
            StorageImpl::Sqlite(s) => s.create_alert(alert).await,
            StorageImpl::Sled(s) => s.create_alert(alert).await,
        }
    }

    async fn list_alerts(&self, unread_only: bool, limit: u32) -> AppResult<Vec<Alert>> {
        match self {
            StorageImpl::Sqlite(s) => s.list_alerts(unread_only, limit).await,
            StorageImpl::Sled(s) => s.list_alerts(unread_only, limit).await,
        }
    }

    async fn mark_alert_read(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        match self {
            StorageImpl::Sqlite(s) => s.mark_alert_read(id, updated_by).await,
            StorageImpl::Sled(s) => s.mark_alert_read(id, updated_by).await,
        }
    }
}
