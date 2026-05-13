CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target TEXT NOT NULL,
  can_read INTEGER NOT NULL,
  can_write INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

CREATE TABLE IF NOT EXISTS libraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_libraries_root_path ON libraries(root_path);

CREATE TABLE IF NOT EXISTS media_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_key TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  library_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER,
  deleted_by INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_items_path ON media_items(path);
CREATE INDEX IF NOT EXISTS idx_media_items_file_key ON media_items(file_key);
CREATE INDEX IF NOT EXISTS idx_media_items_media_type ON media_items(media_type);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS media_category_rel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_key TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_media_category_rel_file_key ON media_category_rel(file_key);
CREATE INDEX IF NOT EXISTS idx_media_category_rel_category_id ON media_category_rel(category_id);

CREATE TABLE IF NOT EXISTS media_tag_rel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_key TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_media_tag_rel_file_key ON media_tag_rel(file_key);
CREATE INDEX IF NOT EXISTS idx_media_tag_rel_tag_id ON media_tag_rel(tag_id);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  severity TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  data_json TEXT,
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  created_by INTEGER,
  updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_alerts_read_at ON alerts(read_at);

