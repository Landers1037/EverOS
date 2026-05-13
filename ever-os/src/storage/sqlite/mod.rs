use std::path::Path;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Arguments, Row, SqlitePool};
use uuid::Uuid;

use crate::domains::{
    Alert, AlertLevel, Category, Library, MediaItem, MediaType, OpSeverity, OperationLog, Tag,
    User, UserPermission, UserWithPassword,
};
use crate::error::{AppError, AppResult};
use crate::storage::*;

#[derive(Clone)]
pub struct SqliteStorage {
    pool: SqlitePool,
}

impl SqliteStorage {
    pub async fn connect(db_file: &Path) -> AppResult<Self> {
        if let Some(parent) = db_file.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|_| AppError::Internal)?;
        }

        let opts = SqliteConnectOptions::new()
            .filename(db_file)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(opts)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(Self { pool })
    }

    fn now_ms() -> i64 {
        time::OffsetDateTime::now_utc().unix_timestamp_nanos() as i64 / 1_000_000
    }
}

impl Storage for SqliteStorage {
    async fn migrate(&self) -> AppResult<()> {
        sqlx::migrate!()
            .run(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn user_count(&self) -> AppResult<i64> {
        let n: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM users WHERE deleted_at IS NULL")
            .fetch_one(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(n)
    }

    async fn create_user(&self, new_user: NewUser) -> AppResult<User> {
        let now = Self::now_ms();
        let uuid = Uuid::new_v4();

        let rec = sqlx::query(
            r#"
            INSERT INTO users (uuid, username, password_hash, is_admin, created_at, updated_at, deleted_at, created_by, updated_by)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?8)
            RETURNING id, uuid, username, is_admin, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(uuid.to_string())
        .bind(&new_user.username)
        .bind(&new_user.password_hash)
        .bind(if new_user.is_admin { 1 } else { 0 })
        .bind(now)
        .bind(now)
        .bind(new_user.created_by)
        .bind(new_user.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("用户名已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        Ok(User {
            id: rec.get::<i64, _>("id"),
            uuid: Uuid::parse_str(&rec.get::<String, _>("uuid")).map_err(|_| AppError::Internal)?,
            username: rec.get::<String, _>("username"),
            is_admin: rec.get::<i64, _>("is_admin") != 0,
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn find_user_by_username(&self, username: &str) -> AppResult<Option<UserWithPassword>> {
        let rec = sqlx::query(
            r#"
            SELECT id, uuid, username, password_hash, is_admin, created_at, updated_at, deleted_at, created_by, updated_by
            FROM users
            WHERE username = ?1 AND deleted_at IS NULL
            "#,
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        let Some(rec) = rec else { return Ok(None) };
        let user = User {
            id: rec.get::<i64, _>("id"),
            uuid: Uuid::parse_str(&rec.get::<String, _>("uuid")).map_err(|_| AppError::Internal)?,
            username: rec.get::<String, _>("username"),
            is_admin: rec.get::<i64, _>("is_admin") != 0,
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        };
        Ok(Some(UserWithPassword {
            user,
            password_hash: rec.get::<String, _>("password_hash"),
        }))
    }

    async fn get_user_by_id(&self, id: i64) -> AppResult<Option<User>> {
        let rec = sqlx::query(
            r#"
            SELECT id, uuid, username, is_admin, created_at, updated_at, deleted_at, created_by, updated_by
            FROM users
            WHERE id = ?1 AND deleted_at IS NULL
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        let Some(rec) = rec else { return Ok(None) };
        Ok(Some(User {
            id: rec.get::<i64, _>("id"),
            uuid: Uuid::parse_str(&rec.get::<String, _>("uuid")).map_err(|_| AppError::Internal)?,
            username: rec.get::<String, _>("username"),
            is_admin: rec.get::<i64, _>("is_admin") != 0,
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        }))
    }

    async fn list_users(&self) -> AppResult<Vec<User>> {
        let rows = sqlx::query(
            r#"
            SELECT id, uuid, username, is_admin, created_at, updated_at, deleted_at, created_by, updated_by
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY id DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        rows.into_iter()
            .map(|rec| {
                Ok(User {
                    id: rec.get::<i64, _>("id"),
                    uuid: Uuid::parse_str(&rec.get::<String, _>("uuid"))
                        .map_err(|_| AppError::Internal)?,
                    username: rec.get::<String, _>("username"),
                    is_admin: rec.get::<i64, _>("is_admin") != 0,
                    created_at: rec.get::<i64, _>("created_at"),
                    updated_at: rec.get::<i64, _>("updated_at"),
                    deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
                    created_by: rec.get::<Option<i64>, _>("created_by"),
                    updated_by: rec.get::<Option<i64>, _>("updated_by"),
                })
            })
            .collect()
    }

    async fn upsert_user_permissions(
        &self,
        user_id: i64,
        perms: Vec<UserPermission>,
        actor_id: Option<i64>,
    ) -> AppResult<()> {
        let now = Self::now_ms();
        let mut tx = self.pool.begin().await.map_err(|_| AppError::Internal)?;

        sqlx::query("DELETE FROM user_permissions WHERE user_id = ?1")
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;

        for p in perms {
            sqlx::query(
                r#"
                INSERT INTO user_permissions (user_id, target, can_read, can_write, created_at, updated_at, deleted_at, created_by, updated_by)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?8)
                "#,
            )
            .bind(user_id)
            .bind(p.target)
            .bind(if p.can_read { 1 } else { 0 })
            .bind(if p.can_write { 1 } else { 0 })
            .bind(now)
            .bind(now)
            .bind(actor_id)
            .bind(actor_id)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;
        }

        tx.commit().await.map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn list_user_permissions(&self, user_id: i64) -> AppResult<Vec<UserPermission>> {
        let rows = sqlx::query(
            r#"
            SELECT user_id, target, can_read, can_write
            FROM user_permissions
            WHERE user_id = ?1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        Ok(rows
            .into_iter()
            .map(|r| UserPermission {
                user_id: r.get::<i64, _>("user_id"),
                target: r.get::<String, _>("target"),
                can_read: r.get::<i64, _>("can_read") != 0,
                can_write: r.get::<i64, _>("can_write") != 0,
            })
            .collect())
    }

    async fn create_library(&self, new_lib: NewLibrary) -> AppResult<Library> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            INSERT INTO libraries (name, root_path, created_at, updated_at, deleted_at, created_by, updated_by)
            VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6)
            RETURNING id, name, root_path, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(new_lib.name)
        .bind(new_lib.root_path)
        .bind(now)
        .bind(now)
        .bind(new_lib.created_by)
        .bind(new_lib.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("root_path 已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        Ok(Library {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            root_path: rec.get::<String, _>("root_path"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn get_library_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Library>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, root_path, created_at, updated_at, deleted_at, created_by, updated_by
            FROM libraries
            WHERE id = ?1
            "#,
        );
        if !include_deleted {
            sql.push_str(" AND deleted_at IS NULL ");
        }
        let rec = sqlx::query(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rec.map(|r| Library {
            id: r.get::<i64, _>("id"),
            name: r.get::<String, _>("name"),
            root_path: r.get::<String, _>("root_path"),
            created_at: r.get::<i64, _>("created_at"),
            updated_at: r.get::<i64, _>("updated_at"),
            deleted_at: r.get::<Option<i64>, _>("deleted_at"),
            created_by: r.get::<Option<i64>, _>("created_by"),
            updated_by: r.get::<Option<i64>, _>("updated_by"),
        }))
    }

    async fn list_libraries(&self, include_deleted: bool) -> AppResult<Vec<Library>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, root_path, created_at, updated_at, deleted_at, created_by, updated_by
            FROM libraries
            "#,
        );
        if !include_deleted {
            sql.push_str(" WHERE deleted_at IS NULL ");
        }
        sql.push_str(" ORDER BY id DESC ");

        let rows = sqlx::query(&sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rows
            .into_iter()
            .map(|rec| Library {
                id: rec.get::<i64, _>("id"),
                name: rec.get::<String, _>("name"),
                root_path: rec.get::<String, _>("root_path"),
                created_at: rec.get::<i64, _>("created_at"),
                updated_at: rec.get::<i64, _>("updated_at"),
                deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
                created_by: rec.get::<Option<i64>, _>("created_by"),
                updated_by: rec.get::<Option<i64>, _>("updated_by"),
            })
            .collect())
    }

    async fn update_library_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Library> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            UPDATE libraries
            SET name=?1, updated_at=?2, updated_by=?3
            WHERE id=?4 AND deleted_at IS NULL
            RETURNING id, name, root_path, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(name)
        .bind(now)
        .bind(updated_by)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        let Some(rec) = rec else {
            return Err(AppError::NotFound);
        };
        Ok(Library {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            root_path: rec.get::<String, _>("root_path"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn soft_delete_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE libraries SET deleted_at=?1, updated_at=?2, updated_by=?3 WHERE id=?4 AND deleted_at IS NULL")
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn restore_library(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE libraries SET deleted_at=NULL, updated_at=?1, updated_by=?2 WHERE id=?3 AND deleted_at IS NOT NULL")
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn upsert_media_by_path(&self, input: MediaUpsert) -> AppResult<MediaItem> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            INSERT INTO media_items
              (path, file_name, file_key, media_type, size_bytes, favorite, library_id,
               created_at, updated_at, deleted_at, created_by, updated_by, deleted_by)
            VALUES
              (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7, ?8, NULL, ?9, ?10, NULL)
            ON CONFLICT(path) DO UPDATE SET
              file_name=excluded.file_name,
              file_key=excluded.file_key,
              media_type=excluded.media_type,
              size_bytes=excluded.size_bytes,
              library_id=excluded.library_id,
              updated_at=excluded.updated_at,
              updated_by=excluded.updated_by
            RETURNING
              id, path, file_name, file_key, media_type, size_bytes, favorite, library_id,
              created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
            "#,
        )
        .bind(input.path)
        .bind(input.file_name)
        .bind(input.file_key)
        .bind(match input.media_type {
            MediaType::Photo => "photo",
            MediaType::Video => "video",
            MediaType::Music => "music",
        })
        .bind(input.size_bytes)
        .bind(input.library_id)
        .bind(now)
        .bind(now)
        .bind(input.created_by)
        .bind(input.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        row_to_media(rec)
    }

    async fn get_media_by_id(&self, id: i64) -> AppResult<Option<MediaItem>> {
        let rec = sqlx::query(
            r#"
            SELECT id, path, file_name, file_key, media_type, size_bytes, favorite, library_id,
                   created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
            FROM media_items
            WHERE id = ?1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;
        rec.map(row_to_media).transpose()
    }

    async fn get_media_by_path(&self, path: &str) -> AppResult<Option<MediaItem>> {
        let rec = sqlx::query(
            r#"
            SELECT id, path, file_name, file_key, media_type, size_bytes, favorite, library_id,
                   created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
            FROM media_items
            WHERE path = ?1
            "#,
        )
        .bind(path)
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;
        rec.map(row_to_media).transpose()
    }

    async fn list_media(&self, q: MediaQuery) -> AppResult<Vec<MediaItem>> {
        let mut sql = String::from(
            r#"
            SELECT id, path, file_name, file_key, media_type, size_bytes, favorite, library_id,
                   created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
            FROM media_items
            WHERE deleted_at IS NULL
            "#,
        );
        let mut args = sqlx::sqlite::SqliteArguments::default();

        if let Some(t) = &q.media_type {
            sql.push_str(" AND media_type = ? ");
            let v = match t {
                MediaType::Photo => "photo",
                MediaType::Video => "video",
                MediaType::Music => "music",
            };
            let _ = args.add(v);
        }
        if let Some(fav) = q.favorite {
            sql.push_str(" AND favorite = ? ");
            let _ = args.add(if fav { 1i64 } else { 0i64 });
        }
        if let Some(folder) = &q.folder_path {
            sql.push_str(" AND path LIKE ? ");
            let _ = args.add(format!("{folder}%"));
        }
        if let Some(text) = &q.q {
            sql.push_str(" AND (file_name LIKE ? OR path LIKE ?) ");
            let pat = format!("%{text}%");
            let _ = args.add(pat.clone());
            let _ = args.add(pat);
        }

        sql.push_str(" ORDER BY id DESC LIMIT ? OFFSET ? ");
        let limit = q.limit.clamp(1, 200) as i64;
        let offset = (q.page.saturating_sub(1) as i64) * limit;
        let _ = args.add(limit);
        let _ = args.add(offset);

        let rows = sqlx::query_with(&sql, args)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        rows.into_iter().map(row_to_media).collect()
    }

    async fn list_trash_media(&self, q: TrashQuery) -> AppResult<Vec<MediaItem>> {
        let mut sql = String::from(
            r#"
            SELECT id, path, file_name, file_key, media_type, size_bytes, favorite, library_id,
                   created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
            FROM media_items
            WHERE deleted_at IS NOT NULL
            "#,
        );
        let mut args = sqlx::sqlite::SqliteArguments::default();

        if let Some(t) = &q.media_type {
            sql.push_str(" AND media_type = ? ");
            let v = match t {
                MediaType::Photo => "photo",
                MediaType::Video => "video",
                MediaType::Music => "music",
            };
            let _ = args.add(v);
        }

        sql.push_str(" ORDER BY deleted_at DESC, id DESC LIMIT ? OFFSET ? ");
        let limit = q.limit.clamp(1, 200) as i64;
        let offset = (q.page.saturating_sub(1) as i64) * limit;
        let _ = args.add(limit);
        let _ = args.add(offset);

        let rows = sqlx::query_with(&sql, args)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        rows.into_iter().map(row_to_media).collect()
    }

    async fn set_media_favorite(
        &self,
        id: i64,
        favorite: bool,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let now = Self::now_ms();
        sqlx::query("UPDATE media_items SET favorite=?1, updated_at=?2, updated_by=?3 WHERE id=?4")
            .bind(if favorite { 1 } else { 0 })
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn soft_delete_media(&self, id: i64, deleted_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        sqlx::query("UPDATE media_items SET deleted_at=?1, deleted_by=?2, updated_at=?3, updated_by=?4 WHERE id=?5")
            .bind(now)
            .bind(deleted_by)
            .bind(now)
            .bind(deleted_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn restore_media(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        sqlx::query("UPDATE media_items SET deleted_at=NULL, deleted_by=NULL, updated_at=?1, updated_by=?2 WHERE id=?3")
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn hard_delete_media_record(&self, id: i64) -> AppResult<()> {
        sqlx::query("DELETE FROM media_items WHERE id=?1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn create_category(&self, input: NewCategory) -> AppResult<Category> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            INSERT INTO categories (name, created_at, updated_at, deleted_at, created_by, updated_by)
            VALUES (?1, ?2, ?3, NULL, ?4, ?5)
            RETURNING id, name, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(input.name)
        .bind(now)
        .bind(now)
        .bind(input.created_by)
        .bind(input.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("名称已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        Ok(Category {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn get_category_by_id(
        &self,
        id: i64,
        include_deleted: bool,
    ) -> AppResult<Option<Category>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, created_at, updated_at, deleted_at, created_by, updated_by
            FROM categories
            WHERE id = ?1
            "#,
        );
        if !include_deleted {
            sql.push_str(" AND deleted_at IS NULL ");
        }
        let rec = sqlx::query(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rec.map(|r| Category {
            id: r.get::<i64, _>("id"),
            name: r.get::<String, _>("name"),
            created_at: r.get::<i64, _>("created_at"),
            updated_at: r.get::<i64, _>("updated_at"),
            deleted_at: r.get::<Option<i64>, _>("deleted_at"),
            created_by: r.get::<Option<i64>, _>("created_by"),
            updated_by: r.get::<Option<i64>, _>("updated_by"),
        }))
    }

    async fn list_categories(&self, include_deleted: bool) -> AppResult<Vec<Category>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, created_at, updated_at, deleted_at, created_by, updated_by
            FROM categories
            "#,
        );
        if !include_deleted {
            sql.push_str(" WHERE deleted_at IS NULL ");
        }
        sql.push_str(" ORDER BY id DESC ");

        let rows = sqlx::query(&sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rows
            .into_iter()
            .map(|rec| Category {
                id: rec.get::<i64, _>("id"),
                name: rec.get::<String, _>("name"),
                created_at: rec.get::<i64, _>("created_at"),
                updated_at: rec.get::<i64, _>("updated_at"),
                deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
                created_by: rec.get::<Option<i64>, _>("created_by"),
                updated_by: rec.get::<Option<i64>, _>("updated_by"),
            })
            .collect())
    }

    async fn update_category_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Category> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            UPDATE categories
            SET name=?1, updated_at=?2, updated_by=?3
            WHERE id=?4 AND deleted_at IS NULL
            RETURNING id, name, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(name)
        .bind(now)
        .bind(updated_by)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("名称已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        let Some(rec) = rec else {
            return Err(AppError::NotFound);
        };
        Ok(Category {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn soft_delete_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE categories SET deleted_at=?1, updated_at=?2, updated_by=?3 WHERE id=?4 AND deleted_at IS NULL")
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn restore_category(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE categories SET deleted_at=NULL, updated_at=?1, updated_by=?2 WHERE id=?3 AND deleted_at IS NOT NULL")
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn create_tag(&self, input: NewTag) -> AppResult<Tag> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            INSERT INTO tags (name, created_at, updated_at, deleted_at, created_by, updated_by)
            VALUES (?1, ?2, ?3, NULL, ?4, ?5)
            RETURNING id, name, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(input.name)
        .bind(now)
        .bind(now)
        .bind(input.created_by)
        .bind(input.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("名称已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        Ok(Tag {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn get_tag_by_id(&self, id: i64, include_deleted: bool) -> AppResult<Option<Tag>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, created_at, updated_at, deleted_at, created_by, updated_by
            FROM tags
            WHERE id = ?1
            "#,
        );
        if !include_deleted {
            sql.push_str(" AND deleted_at IS NULL ");
        }
        let rec = sqlx::query(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rec.map(|r| Tag {
            id: r.get::<i64, _>("id"),
            name: r.get::<String, _>("name"),
            created_at: r.get::<i64, _>("created_at"),
            updated_at: r.get::<i64, _>("updated_at"),
            deleted_at: r.get::<Option<i64>, _>("deleted_at"),
            created_by: r.get::<Option<i64>, _>("created_by"),
            updated_by: r.get::<Option<i64>, _>("updated_by"),
        }))
    }

    async fn list_tags(&self, include_deleted: bool) -> AppResult<Vec<Tag>> {
        let mut sql = String::from(
            r#"
            SELECT id, name, created_at, updated_at, deleted_at, created_by, updated_by
            FROM tags
            "#,
        );
        if !include_deleted {
            sql.push_str(" WHERE deleted_at IS NULL ");
        }
        sql.push_str(" ORDER BY id DESC ");

        let rows = sqlx::query(&sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;

        Ok(rows
            .into_iter()
            .map(|rec| Tag {
                id: rec.get::<i64, _>("id"),
                name: rec.get::<String, _>("name"),
                created_at: rec.get::<i64, _>("created_at"),
                updated_at: rec.get::<i64, _>("updated_at"),
                deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
                created_by: rec.get::<Option<i64>, _>("created_by"),
                updated_by: rec.get::<Option<i64>, _>("updated_by"),
            })
            .collect())
    }

    async fn update_tag_name(
        &self,
        id: i64,
        name: String,
        updated_by: Option<i64>,
    ) -> AppResult<Tag> {
        let now = Self::now_ms();
        let rec = sqlx::query(
            r#"
            UPDATE tags
            SET name=?1, updated_at=?2, updated_by=?3
            WHERE id=?4 AND deleted_at IS NULL
            RETURNING id, name, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(name)
        .bind(now)
        .bind(updated_by)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.is_unique_violation() {
                    return AppError::BadRequest("名称已存在".to_string());
                }
            }
            AppError::Internal
        })?;

        let Some(rec) = rec else {
            return Err(AppError::NotFound);
        };
        Ok(Tag {
            id: rec.get::<i64, _>("id"),
            name: rec.get::<String, _>("name"),
            created_at: rec.get::<i64, _>("created_at"),
            updated_at: rec.get::<i64, _>("updated_at"),
            deleted_at: rec.get::<Option<i64>, _>("deleted_at"),
            created_by: rec.get::<Option<i64>, _>("created_by"),
            updated_by: rec.get::<Option<i64>, _>("updated_by"),
        })
    }

    async fn soft_delete_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE tags SET deleted_at=?1, updated_at=?2, updated_by=?3 WHERE id=?4 AND deleted_at IS NULL")
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn restore_tag(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        let res = sqlx::query("UPDATE tags SET deleted_at=NULL, updated_at=?1, updated_by=?2 WHERE id=?3 AND deleted_at IS NOT NULL")
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        if res.rows_affected() == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    async fn set_media_categories_by_file_key(
        &self,
        file_key: &str,
        category_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let now = Self::now_ms();
        let mut tx = self.pool.begin().await.map_err(|_| AppError::Internal)?;

        sqlx::query("DELETE FROM media_category_rel WHERE file_key=?1")
            .bind(file_key)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;

        for cid in category_ids {
            sqlx::query(
                r#"
                INSERT INTO media_category_rel
                  (file_key, category_id, created_at, updated_at, deleted_at, created_by, updated_by)
                VALUES
                  (?1, ?2, ?3, ?4, NULL, ?5, ?6)
                "#,
            )
            .bind(file_key)
            .bind(cid)
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(updated_by)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;
        }

        tx.commit().await.map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn set_media_tags_by_file_key(
        &self,
        file_key: &str,
        tag_ids: Vec<i64>,
        updated_by: Option<i64>,
    ) -> AppResult<()> {
        let now = Self::now_ms();
        let mut tx = self.pool.begin().await.map_err(|_| AppError::Internal)?;

        sqlx::query("DELETE FROM media_tag_rel WHERE file_key=?1")
            .bind(file_key)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;

        for tid in tag_ids {
            sqlx::query(
                r#"
                INSERT INTO media_tag_rel
                  (file_key, tag_id, created_at, updated_at, deleted_at, created_by, updated_by)
                VALUES
                  (?1, ?2, ?3, ?4, NULL, ?5, ?6)
                "#,
            )
            .bind(file_key)
            .bind(tid)
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(updated_by)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::Internal)?;
        }

        tx.commit().await.map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn list_media_category_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        let rows = sqlx::query("SELECT category_id FROM media_category_rel WHERE file_key=?1")
            .bind(file_key)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(rows
            .into_iter()
            .map(|r| r.get::<i64, _>("category_id"))
            .collect())
    }

    async fn list_media_tag_ids(&self, file_key: &str) -> AppResult<Vec<i64>> {
        let rows = sqlx::query("SELECT tag_id FROM media_tag_rel WHERE file_key=?1")
            .bind(file_key)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(rows
            .into_iter()
            .map(|r| r.get::<i64, _>("tag_id"))
            .collect())
    }

    async fn insert_operation_log(&self, log: NewOperationLog) -> AppResult<()> {
        let now = Self::now_ms();
        sqlx::query(
            r#"
            INSERT INTO operation_logs
              (user_id, username, method, path, status_code, resource_type, resource_id, severity, ip, user_agent, created_at)
            VALUES
              (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            "#,
        )
        .bind(log.user_id)
        .bind(log.username)
        .bind(log.method)
        .bind(log.path)
        .bind(log.status_code)
        .bind(log.resource_type)
        .bind(log.resource_id)
        .bind(match log.severity {
            OpSeverity::Normal => "normal",
            OpSeverity::Warning => "warning",
            OpSeverity::Critical => "critical",
        })
        .bind(log.ip)
        .bind(log.user_agent)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;
        Ok(())
    }

    async fn list_operation_logs(&self, limit: u32) -> AppResult<Vec<OperationLog>> {
        let limit = limit.clamp(1, 500) as i64;
        let rows = sqlx::query(
            r#"
            SELECT id, user_id, username, method, path, status_code, resource_type, resource_id, severity, ip, user_agent, created_at
            FROM operation_logs
            ORDER BY id DESC
            LIMIT ?1
            "#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        Ok(rows
            .into_iter()
            .map(|r| OperationLog {
                id: r.get::<i64, _>("id"),
                user_id: r.get::<Option<i64>, _>("user_id"),
                username: r.get::<Option<String>, _>("username"),
                method: r.get::<String, _>("method"),
                path: r.get::<String, _>("path"),
                status_code: r.get::<i64, _>("status_code") as i32,
                resource_type: r.get::<Option<String>, _>("resource_type"),
                resource_id: r.get::<Option<String>, _>("resource_id"),
                severity: match r.get::<String, _>("severity").as_str() {
                    "warning" => OpSeverity::Warning,
                    "critical" => OpSeverity::Critical,
                    _ => OpSeverity::Normal,
                },
                ip: r.get::<Option<String>, _>("ip"),
                user_agent: r.get::<Option<String>, _>("user_agent"),
                created_at: r.get::<i64, _>("created_at"),
            })
            .collect())
    }

    async fn create_alert(&self, alert: NewAlert) -> AppResult<Alert> {
        let now = Self::now_ms();
        let data_json = alert.data_json.map(|v| v.to_string());
        let rec = sqlx::query(
            r#"
            INSERT INTO alerts
              (level, source, message, data_json, read_at, created_at, updated_at, deleted_at, created_by, updated_by)
            VALUES
              (?1, ?2, ?3, ?4, NULL, ?5, ?6, NULL, ?7, ?8)
            RETURNING
              id, level, source, message, data_json, read_at, created_at, updated_at, deleted_at, created_by, updated_by
            "#,
        )
        .bind(match alert.level {
            AlertLevel::Info => "info",
            AlertLevel::Warning => "warning",
            AlertLevel::Critical => "critical",
        })
        .bind(alert.source)
        .bind(alert.message)
        .bind(data_json)
        .bind(now)
        .bind(now)
        .bind(alert.created_by)
        .bind(alert.created_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|_| AppError::Internal)?;

        row_to_alert(rec)
    }

    async fn list_alerts(&self, unread_only: bool, limit: u32) -> AppResult<Vec<Alert>> {
        let limit = limit.clamp(1, 200) as i64;
        let rows = if unread_only {
            sqlx::query(
                r#"
                SELECT id, level, source, message, data_json, read_at, created_at, updated_at, deleted_at, created_by, updated_by
                FROM alerts
                WHERE deleted_at IS NULL AND read_at IS NULL
                ORDER BY id DESC
                LIMIT ?1
                "#,
            )
            .bind(limit)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?
        } else {
            sqlx::query(
                r#"
                SELECT id, level, source, message, data_json, read_at, created_at, updated_at, deleted_at, created_by, updated_by
                FROM alerts
                WHERE deleted_at IS NULL
                ORDER BY id DESC
                LIMIT ?1
                "#,
            )
            .bind(limit)
            .fetch_all(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?
        };

        rows.into_iter().map(row_to_alert).collect()
    }

    async fn mark_alert_read(&self, id: i64, updated_by: Option<i64>) -> AppResult<()> {
        let now = Self::now_ms();
        sqlx::query("UPDATE alerts SET read_at=?1, updated_at=?2, updated_by=?3 WHERE id=?4")
            .bind(now)
            .bind(now)
            .bind(updated_by)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|_| AppError::Internal)?;
        Ok(())
    }
}

fn row_to_media(row: sqlx::sqlite::SqliteRow) -> AppResult<MediaItem> {
    let media_type = match row.get::<String, _>("media_type").as_str() {
        "photo" => MediaType::Photo,
        "video" => MediaType::Video,
        "music" => MediaType::Music,
        _ => return Err(AppError::Internal),
    };

    Ok(MediaItem {
        id: row.get::<i64, _>("id"),
        path: row.get::<String, _>("path"),
        file_name: row.get::<String, _>("file_name"),
        file_key: row.get::<String, _>("file_key"),
        media_type,
        size_bytes: row.get::<i64, _>("size_bytes"),
        favorite: row.get::<i64, _>("favorite") != 0,
        library_id: row.get::<Option<i64>, _>("library_id"),
        created_at: row.get::<i64, _>("created_at"),
        updated_at: row.get::<i64, _>("updated_at"),
        deleted_at: row.get::<Option<i64>, _>("deleted_at"),
        created_by: row.get::<Option<i64>, _>("created_by"),
        updated_by: row.get::<Option<i64>, _>("updated_by"),
        deleted_by: row.get::<Option<i64>, _>("deleted_by"),
    })
}

fn row_to_alert(row: sqlx::sqlite::SqliteRow) -> AppResult<Alert> {
    let level = match row.get::<String, _>("level").as_str() {
        "info" => AlertLevel::Info,
        "warning" => AlertLevel::Warning,
        "critical" => AlertLevel::Critical,
        _ => return Err(AppError::Internal),
    };

    let data_json = row
        .get::<Option<String>, _>("data_json")
        .and_then(|s| serde_json::from_str(&s).ok());

    Ok(Alert {
        id: row.get::<i64, _>("id"),
        level,
        source: row.get::<String, _>("source"),
        message: row.get::<String, _>("message"),
        data_json,
        read_at: row.get::<Option<i64>, _>("read_at"),
        created_at: row.get::<i64, _>("created_at"),
        updated_at: row.get::<i64, _>("updated_at"),
        deleted_at: row.get::<Option<i64>, _>("deleted_at"),
        created_by: row.get::<Option<i64>, _>("created_by"),
        updated_by: row.get::<Option<i64>, _>("updated_by"),
    })
}
