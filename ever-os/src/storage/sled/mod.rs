use std::path::Path;

use ::sled::IVec;
use tokio::task::spawn_blocking;
use uuid::Uuid;

use crate::domains::{
    Alert, Category, Library, MediaItem, OperationLog, Tag, User, UserPermission, UserWithPassword,
};
use crate::error::{AppError, AppResult};
use crate::storage::*;

#[derive(Clone)]
pub struct SledStorage {
    db: ::sled::Db,
}

impl SledStorage {
    pub async fn open(path: &Path) -> AppResult<Self> {
        let path = path.to_owned();
        let db = spawn_blocking(move || ::sled::open(path))
            .await
            .map_err(|_| AppError::Internal)?
            .map_err(|_| AppError::Internal)?;
        Ok(Self { db })
    }

    fn now_ms() -> i64 {
        time::OffsetDateTime::now_utc().unix_timestamp_nanos() as i64 / 1_000_000
    }

    fn t_sequences(db: &::sled::Db) -> AppResult<::sled::Tree> {
        db.open_tree("sequences").map_err(|_| AppError::Internal)
    }
    fn next_id(db: &::sled::Db, table: &str) -> AppResult<i64> {
        let t = Self::t_sequences(db)?;
        let key = table.as_bytes();
        let prev = t.get(key).map_err(|_| AppError::Internal)?;
        let next = match prev {
            Some(v) => {
                let n = i64::from_be_bytes(v.as_ref().try_into().map_err(|_| AppError::Internal)?);
                n + 1
            }
            None => 1,
        };
        t.insert(key, next.to_be_bytes().to_vec())
            .map_err(|_| AppError::Internal)?;
        t.flush().map_err(|_| AppError::Internal)?;
        Ok(next)
    }

    fn tree(db: &::sled::Db, name: &str) -> AppResult<::sled::Tree> {
        db.open_tree(name).map_err(|_| AppError::Internal)
    }

    fn ser<T: serde::Serialize>(v: &T) -> AppResult<Vec<u8>> {
        serde_json::to_vec(v).map_err(|_| AppError::Internal)
    }
    fn de<T: serde::de::DeserializeOwned>(v: &IVec) -> AppResult<T> {
        serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)
    }
}

impl Storage for SledStorage {
    async fn migrate(&self) -> AppResult<()> {
        Ok(())
    }

    async fn user_count(&self) -> AppResult<i64> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "users")?;
            Ok(t.iter().filter_map(|r| r.ok()).count() as i64)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn create_user(&self, new_user: NewUser) -> AppResult<User> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "users")?;
            let uuid = Uuid::new_v4();

            let u = User {
                id,
                uuid,
                username: new_user.username.clone(),
                is_admin: new_user.is_admin,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                created_by: new_user.created_by,
                updated_by: new_user.created_by,
            };

            let up = UserWithPassword {
                user: u.clone(),
                password_hash: new_user.password_hash,
            };

            let users = Self::tree(&db, "users")?;
            let by_name = Self::tree(&db, "users_by_username")?;

            if by_name
                .get(new_user.username.as_bytes())
                .map_err(|_| AppError::Internal)?
                .is_some()
            {
                return Err(AppError::BadRequest("用户名已存在".to_string()));
            }

            users
                .insert(id.to_be_bytes(), Self::ser(&up)?)
                .map_err(|_| AppError::Internal)?;
            by_name
                .insert(new_user.username.as_bytes(), id.to_be_bytes().to_vec())
                .map_err(|_| AppError::Internal)?;
            users.flush().map_err(|_| AppError::Internal)?;
            by_name.flush().map_err(|_| AppError::Internal)?;
            Ok(u)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn find_user_by_username(&self, username: &str) -> AppResult<Option<UserWithPassword>> {
        let db = self.db.clone();
        let username = username.to_string();
        spawn_blocking(move || {
            let by_name = Self::tree(&db, "users_by_username")?;
            let users = Self::tree(&db, "users")?;
            let Some(id_bytes) = by_name
                .get(username.as_bytes())
                .map_err(|_| AppError::Internal)?
            else {
                return Ok(None);
            };
            let id = i64::from_be_bytes(
                id_bytes
                    .as_ref()
                    .try_into()
                    .map_err(|_| AppError::Internal)?,
            );
            let Some(v) = users
                .get(id.to_be_bytes())
                .map_err(|_| AppError::Internal)?
            else {
                return Ok(None);
            };
            Ok(Some(Self::de(&v)?))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_user_by_id(&self, id: i64) -> AppResult<Option<User>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let users = Self::tree(&db, "users")?;
            let Some(v) = users
                .get(id.to_be_bytes())
                .map_err(|_| AppError::Internal)?
            else {
                return Ok(None);
            };
            let up: UserWithPassword = Self::de(&v)?;
            Ok(Some(up.user))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_users(&self) -> AppResult<Vec<User>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let users = Self::tree(&db, "users")?;
            let mut out = Vec::new();
            for r in users.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let up: UserWithPassword =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if up.user.deleted_at.is_none() {
                    out.push(up.user);
                }
            }
            out.sort_by_key(|u| -u.id);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn upsert_user_permissions(
        &self,
        user_id: i64,
        perms: Vec<UserPermission>,
        actor_id: Option<i64>,
    ) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "user_permissions")?;
            let key = user_id.to_be_bytes();
            t.insert(key, Self::ser(&perms)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            let _ = actor_id;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_user_permissions(&self, user_id: i64) -> AppResult<Vec<UserPermission>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "user_permissions")?;
            let Some(v) = t
                .get(user_id.to_be_bytes())
                .map_err(|_| AppError::Internal)?
            else {
                return Ok(vec![]);
            };
            Self::de(&v)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn create_library(&self, new_lib: NewLibrary) -> AppResult<Library> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "libraries")?;
            let by_root = Self::tree(&db, "libraries_by_root_path")?;
            if by_root
                .get(new_lib.root_path.as_bytes())
                .map_err(|_| AppError::Internal)?
                .is_some()
            {
                return Err(AppError::BadRequest("root_path 已存在".to_string()));
            }
            let lib = Library {
                id,
                name: new_lib.name,
                root_path: new_lib.root_path,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                created_by: new_lib.created_by,
                updated_by: new_lib.created_by,
            };
            let t = Self::tree(&db, "libraries")?;
            t.insert(id.to_be_bytes(), Self::ser(&lib)?)
                .map_err(|_| AppError::Internal)?;
            by_root
                .insert(lib.root_path.as_bytes(), id.to_be_bytes().to_vec())
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            by_root.flush().map_err(|_| AppError::Internal)?;
            Ok(lib)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_library_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Library>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "libraries")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(None);
            };
            let lib: Library = Self::de(&v)?;
            if !include_deleted && lib.deleted_at.is_some() {
                return Ok(None);
            }
            Ok(Some(lib))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_libraries(&self, include_deleted: bool) -> AppResult<Vec<Library>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "libraries")?;
            let mut out: Vec<Library> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let lib: Library =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if !include_deleted && lib.deleted_at.is_some() {
                    continue;
                }
                out.push(lib);
            }
            out.sort_by_key(|l| -l.id);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn update_library_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Library> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "libraries")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut lib: Library = Self::de(&v)?;
            if lib.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            lib.name = name;
            lib.updated_at = Self::now_ms();
            lib.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&lib)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(lib)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn soft_delete_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "libraries")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut lib: Library = Self::de(&v)?;
            if lib.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            lib.deleted_at = Some(now);
            lib.updated_at = now;
            lib.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&lib)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn restore_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "libraries")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut lib: Library = Self::de(&v)?;
            if lib.deleted_at.is_none() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            lib.deleted_at = None;
            lib.updated_at = now;
            lib.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&lib)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn upsert_media_by_path(&self, input: MediaUpsert) -> AppResult<MediaItem> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let t_media = Self::tree(&db, "media_items")?;
            let t_by_path = Self::tree(&db, "media_by_path")?;

            let id = if let Some(id_bytes) = t_by_path
                .get(input.path.as_bytes())
                .map_err(|_| AppError::Internal)?
            {
                i64::from_be_bytes(
                    id_bytes
                        .as_ref()
                        .try_into()
                        .map_err(|_| AppError::Internal)?,
                )
            } else {
                let id = Self::next_id(&db, "media_items")?;
                t_by_path
                    .insert(input.path.as_bytes(), id.to_be_bytes().to_vec())
                    .map_err(|_| AppError::Internal)?;
                id
            };

            let prev = t_media
                .get(id.to_be_bytes())
                .map_err(|_| AppError::Internal)?;
            let item = if let Some(v) = prev {
                let mut existing: MediaItem = Self::de(&v)?;
                existing.file_name = input.file_name;
                existing.file_key = input.file_key;
                existing.media_type = input.media_type;
                existing.size_bytes = input.size_bytes;
                existing.library_id = input.library_id;
                existing.updated_at = now;
                existing.updated_by = input.created_by;
                existing
            } else {
                MediaItem {
                    id,
                    path: input.path,
                    file_name: input.file_name,
                    file_key: input.file_key,
                    media_type: input.media_type,
                    size_bytes: input.size_bytes,
                    favorite: false,
                    library_id: input.library_id,
                    created_at: now,
                    updated_at: now,
                    deleted_at: None,
                    created_by: input.created_by,
                    updated_by: input.created_by,
                    deleted_by: None,
                }
            };

            t_media
                .insert(id.to_be_bytes(), Self::ser(&item)?)
                .map_err(|_| AppError::Internal)?;
            t_media.flush().map_err(|_| AppError::Internal)?;
            t_by_path.flush().map_err(|_| AppError::Internal)?;
            Ok(item)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_media_by_id(&self, id: i64) -> AppResult<Option<MediaItem>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(None);
            };
            Ok(Some(Self::de(&v)?))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_media_by_path(&self, path: &str) -> AppResult<Option<MediaItem>> {
        let db = self.db.clone();
        let path = path.to_string();
        spawn_blocking(move || {
            let t_by_path = Self::tree(&db, "media_by_path")?;
            let Some(id_bytes) = t_by_path
                .get(path.as_bytes())
                .map_err(|_| AppError::Internal)?
            else {
                return Ok(None);
            };
            let id = i64::from_be_bytes(
                id_bytes
                    .as_ref()
                    .try_into()
                    .map_err(|_| AppError::Internal)?,
            );
            let t = Self::tree(&db, "media_items")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(None);
            };
            Ok(Some(Self::de(&v)?))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_media(&self, q: MediaQuery) -> AppResult<Vec<MediaItem>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let mut items: Vec<MediaItem> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let item: MediaItem =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if item.deleted_at.is_some() {
                    continue;
                }
                if let Some(ref mt) = q.media_type {
                    if &item.media_type != mt {
                        continue;
                    }
                }
                if let Some(f) = q.favorite {
                    if item.favorite != f {
                        continue;
                    }
                }
                if let Some(ref folder) = q.folder_path {
                    if !item.path.starts_with(folder) {
                        continue;
                    }
                }
                if let Some(ref text) = q.q {
                    let t = text.to_lowercase();
                    if !item.file_name.to_lowercase().contains(&t)
                        && !item.path.to_lowercase().contains(&t)
                    {
                        continue;
                    }
                }
                items.push(item);
            }
            items.sort_by_key(|i| -i.id);

            let limit = q.limit.clamp(1, 200) as usize;
            let offset = (q.page.saturating_sub(1) as usize) * limit;
            Ok(items.into_iter().skip(offset).take(limit).collect())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_trash_media(&self, q: TrashQuery) -> AppResult<Vec<MediaItem>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let mut items: Vec<MediaItem> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let item: MediaItem =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if item.deleted_at.is_none() {
                    continue;
                }
                if let Some(ref mt) = q.media_type {
                    if &item.media_type != mt {
                        continue;
                    }
                }
                items.push(item);
            }
            items.sort_by(|a, b| {
                b.deleted_at
                    .cmp(&a.deleted_at)
                    .then_with(|| b.id.cmp(&a.id))
            });
            let limit = q.limit.clamp(1, 200) as usize;
            let offset = (q.page.saturating_sub(1) as usize) * limit;
            Ok(items.into_iter().skip(offset).take(limit).collect())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn set_media_favorite(
        &self,
        id: i64,
        favorite: bool,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut item: MediaItem = Self::de(&v)?;
            item.favorite = favorite;
            item.updated_at = Self::now_ms();
            item.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&item)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn soft_delete_media(&self, id: i64, deleted_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut item: MediaItem = Self::de(&v)?;
            let now = Self::now_ms();
            item.deleted_at = Some(now);
            item.deleted_by = deleted_by;
            item.updated_at = now;
            item.updated_by = deleted_by;
            t.insert(id.to_be_bytes(), Self::ser(&item)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn restore_media(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut item: MediaItem = Self::de(&v)?;
            let now = Self::now_ms();
            item.deleted_at = None;
            item.deleted_by = None;
            item.updated_at = now;
            item.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&item)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn hard_delete_media_record(&self, id: i64) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_items")?;
            t.remove(id.to_be_bytes()).map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn create_category(&self, input: NewCategory) -> AppResult<Category> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "categories")?;
            let by_name = Self::tree(&db, "categories_by_name")?;
            if by_name
                .get(input.name.as_bytes())
                .map_err(|_| AppError::Internal)?
                .is_some()
            {
                return Err(AppError::BadRequest("名称已存在".to_string()));
            }
            let c = Category {
                id,
                name: input.name,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                created_by: input.created_by,
                updated_by: input.created_by,
            };
            let t = Self::tree(&db, "categories")?;
            t.insert(id.to_be_bytes(), Self::ser(&c)?)
                .map_err(|_| AppError::Internal)?;
            by_name
                .insert(c.name.as_bytes(), id.to_be_bytes().to_vec())
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            by_name.flush().map_err(|_| AppError::Internal)?;
            Ok(c)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_category_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Category>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "categories")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(None);
            };
            let c: Category = Self::de(&v)?;
            if !include_deleted && c.deleted_at.is_some() {
                return Ok(None);
            }
            Ok(Some(c))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_categories(&self, include_deleted: bool) -> AppResult<Vec<Category>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "categories")?;
            let mut out: Vec<Category> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let c: Category =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if !include_deleted && c.deleted_at.is_some() {
                    continue;
                }
                out.push(c);
            }
            out.sort_by_key(|c| -c.id);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn update_category_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Category> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "categories")?;
            let by_name = Self::tree(&db, "categories_by_name")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut c: Category = Self::de(&v)?;
            if c.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            if c.name != name {
                if by_name
                    .get(name.as_bytes())
                    .map_err(|_| AppError::Internal)?
                    .is_some()
                {
                    return Err(AppError::BadRequest("名称已存在".to_string()));
                }
                by_name
                    .remove(c.name.as_bytes())
                    .map_err(|_| AppError::Internal)?;
                by_name
                    .insert(name.as_bytes(), id.to_be_bytes().to_vec())
                    .map_err(|_| AppError::Internal)?;
                c.name = name;
            }
            c.updated_at = Self::now_ms();
            c.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&c)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            by_name.flush().map_err(|_| AppError::Internal)?;
            Ok(c)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn soft_delete_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "categories")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut c: Category = Self::de(&v)?;
            if c.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            c.deleted_at = Some(now);
            c.updated_at = now;
            c.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&c)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn restore_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "categories")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut c: Category = Self::de(&v)?;
            if c.deleted_at.is_none() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            c.deleted_at = None;
            c.updated_at = now;
            c.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&c)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn create_tag(&self, input: NewTag) -> AppResult<Tag> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "tags")?;
            let by_name = Self::tree(&db, "tags_by_name")?;
            if by_name
                .get(input.name.as_bytes())
                .map_err(|_| AppError::Internal)?
                .is_some()
            {
                return Err(AppError::BadRequest("名称已存在".to_string()));
            }
            let t1 = Tag {
                id,
                name: input.name,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                created_by: input.created_by,
                updated_by: input.created_by,
            };
            let t = Self::tree(&db, "tags")?;
            t.insert(id.to_be_bytes(), Self::ser(&t1)?)
                .map_err(|_| AppError::Internal)?;
            by_name
                .insert(t1.name.as_bytes(), id.to_be_bytes().to_vec())
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            by_name.flush().map_err(|_| AppError::Internal)?;
            Ok(t1)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn get_tag_by_id(&self, id: i64, include_deleted: bool) -> AppResult<Option<Tag>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "tags")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(None);
            };
            let tag: Tag = Self::de(&v)?;
            if !include_deleted && tag.deleted_at.is_some() {
                return Ok(None);
            }
            Ok(Some(tag))
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_tags(&self, include_deleted: bool) -> AppResult<Vec<Tag>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "tags")?;
            let mut out: Vec<Tag> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let tag: Tag =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if !include_deleted && tag.deleted_at.is_some() {
                    continue;
                }
                out.push(tag);
            }
            out.sort_by_key(|c| -c.id);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn update_tag_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Tag> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "tags")?;
            let by_name = Self::tree(&db, "tags_by_name")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut tag: Tag = Self::de(&v)?;
            if tag.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            if tag.name != name {
                if by_name
                    .get(name.as_bytes())
                    .map_err(|_| AppError::Internal)?
                    .is_some()
                {
                    return Err(AppError::BadRequest("名称已存在".to_string()));
                }
                by_name
                    .remove(tag.name.as_bytes())
                    .map_err(|_| AppError::Internal)?;
                by_name
                    .insert(name.as_bytes(), id.to_be_bytes().to_vec())
                    .map_err(|_| AppError::Internal)?;
                tag.name = name;
            }
            tag.updated_at = Self::now_ms();
            tag.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&tag)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            by_name.flush().map_err(|_| AppError::Internal)?;
            Ok(tag)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn soft_delete_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "tags")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut tag: Tag = Self::de(&v)?;
            if tag.deleted_at.is_some() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            tag.deleted_at = Some(now);
            tag.updated_at = now;
            tag.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&tag)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn restore_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "tags")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut tag: Tag = Self::de(&v)?;
            if tag.deleted_at.is_none() {
                return Err(AppError::NotFound);
            }
            let now = Self::now_ms();
            tag.deleted_at = None;
            tag.updated_at = now;
            tag.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&tag)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }
    async fn set_media_categories_by_file_key(
        &self,
        file_key: &str,
        category_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let db = self.db.clone();
        let file_key = file_key.to_string();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_category_rel")?;
            t.insert(file_key.as_bytes(), Self::ser(&category_ids)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            let _ = updated_by;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn set_media_tags_by_file_key(
        &self,
        file_key: &str,
        tag_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let db = self.db.clone();
        let file_key = file_key.to_string();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_tag_rel")?;
            t.insert(file_key.as_bytes(), Self::ser(&tag_ids)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            let _ = updated_by;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_media_category_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        let db = self.db.clone();
        let file_key = file_key.to_string();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_category_rel")?;
            let Some(v) = t.get(file_key.as_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(vec![]);
            };
            Self::de(&v)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_media_tag_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        let db = self.db.clone();
        let file_key = file_key.to_string();
        spawn_blocking(move || {
            let t = Self::tree(&db, "media_tag_rel")?;
            let Some(v) = t.get(file_key.as_bytes()).map_err(|_| AppError::Internal)? else {
                return Ok(vec![]);
            };
            Self::de(&v)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn insert_operation_log(&self, log: NewOperationLog) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "operation_logs")?;
            let rec = OperationLog {
                id,
                user_id: log.user_id,
                username: log.username,
                method: log.method,
                path: log.path,
                status_code: log.status_code,
                resource_type: log.resource_type,
                resource_id: log.resource_id,
                severity: log.severity,
                ip: log.ip,
                user_agent: log.user_agent,
                created_at: now,
            };
            let t = Self::tree(&db, "operation_logs")?;
            t.insert(id.to_be_bytes(), Self::ser(&rec)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_operation_logs(&self, limit: u32) -> AppResult<Vec<OperationLog>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "operation_logs")?;
            let mut out: Vec<OperationLog> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let rec: OperationLog =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                out.push(rec);
            }
            out.sort_by_key(|l| -l.id);
            let limit = limit.clamp(1, 500) as usize;
            out.truncate(limit);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn create_alert(&self, alert: NewAlert) -> AppResult<Alert> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let now = Self::now_ms();
            let id = Self::next_id(&db, "alerts")?;
            let rec = Alert {
                id,
                level: alert.level,
                source: alert.source,
                message: alert.message,
                data_json: alert.data_json,
                read_at: None,
                created_at: now,
                updated_at: now,
                deleted_at: None,
                created_by: alert.created_by,
                updated_by: alert.created_by,
            };
            let t = Self::tree(&db, "alerts")?;
            t.insert(id.to_be_bytes(), Self::ser(&rec)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(rec)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn list_alerts(&self, unread_only: bool, limit: u32) -> AppResult<Vec<Alert>> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "alerts")?;
            let mut out: Vec<Alert> = Vec::new();
            for r in t.iter() {
                let (_, v) = r.map_err(|_| AppError::Internal)?;
                let a: Alert =
                    serde_json::from_slice(v.as_ref()).map_err(|_| AppError::Internal)?;
                if a.deleted_at.is_some() {
                    continue;
                }
                if unread_only && a.read_at.is_some() {
                    continue;
                }
                out.push(a);
            }
            out.sort_by_key(|a| -a.id);
            let limit = limit.clamp(1, 200) as usize;
            out.truncate(limit);
            Ok(out)
        })
        .await
        .map_err(|_| AppError::Internal)?
    }

    async fn mark_alert_read(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let db = self.db.clone();
        spawn_blocking(move || {
            let t = Self::tree(&db, "alerts")?;
            let Some(v) = t.get(id.to_be_bytes()).map_err(|_| AppError::Internal)? else {
                return Err(AppError::NotFound);
            };
            let mut a: Alert = Self::de(&v)?;
            let now = Self::now_ms();
            a.read_at = Some(now);
            a.updated_at = now;
            a.updated_by = updated_by;
            t.insert(id.to_be_bytes(), Self::ser(&a)?)
                .map_err(|_| AppError::Internal)?;
            t.flush().map_err(|_| AppError::Internal)?;
            Ok(())
        })
        .await
        .map_err(|_| AppError::Internal)?
    }
}
