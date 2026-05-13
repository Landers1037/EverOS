use std::sync::Arc;

use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use http_body_util::BodyExt;
use tower::ServiceExt;

use crate::app::build_app;
use crate::config::{
    AppConfig, AuthConfig, CorsConfig, DatabaseConfig, DatabaseEngine, JwtConfig, LogConfig,
    MiddlewareConfig, ServerConfig, SledConfig, SqliteConfig, StorageConfig, StorageExtensions,
};
use crate::domains::{AlertLevel, MediaType};
use crate::state::AppState;
use crate::storage::{MediaUpsert, NewAlert, Storage, StorageImpl, sqlite::SqliteStorage};

fn test_config() -> AppConfig {
    AppConfig {
        server: ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 0,
        },
        auth: AuthConfig {
            jwt: JwtConfig {
                issuer: "everos".to_string(),
                audience: "everos-ui".to_string(),
                secret: "test-secret".to_string(),
                expires_minutes: 60,
            },
        },
        database: DatabaseConfig {
            engine: DatabaseEngine::Sqlite,
            sqlite: SqliteConfig {
                path: "./data/sqlite".to_string(),
                name: "test.db".to_string(),
            },
            sled: SledConfig {
                path: "./data/sled".to_string(),
            },
        },
        storage: StorageConfig {
            mount_paths: vec![],
            exclude_dirs: vec![],
            extensions: StorageExtensions {
                photo: vec![],
                video: vec![],
                music: vec![],
            },
        },
        middleware: MiddlewareConfig {
            logging: false,
            trace: false,
            cors: false,
            gzip: false,
        },
        cors: CorsConfig {
            allow_origins: vec!["*".to_string()],
            allow_headers: vec!["*".to_string()],
            allow_methods: vec!["*".to_string()],
        },
        log: LogConfig {
            level: "info".to_string(),
            retention_days: 7,
        },
    }
}

async fn test_state() -> AppState {
    let dir = std::env::temp_dir().join(format!("everos-test-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&dir).unwrap();
    let db_file = dir.join("test.db");

    let storage = SqliteStorage::connect(&db_file).await.unwrap();
    let storage = Arc::new(StorageImpl::Sqlite(storage));
    storage.migrate().await.unwrap();

    let (alerts_tx, _) = tokio::sync::broadcast::channel(128);
    AppState::new(test_config(), storage, alerts_tx, None)
}

fn json_request(
    method: Method,
    uri: &str,
    body: serde_json::Value,
    token: Option<&str>,
) -> Request<Body> {
    let mut req = Request::builder()
        .method(method)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(t) = token {
        req = req.header(header::AUTHORIZATION, format!("Bearer {t}"));
    }
    req.body(Body::from(body.to_string())).unwrap()
}

async fn read_json(resp: axum::response::Response) -> (StatusCode, serde_json::Value) {
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let v = if bytes.is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap()
    };
    (status, v)
}

#[tokio::test]
async fn register_first_user_should_be_admin() {
    let state = test_state().await;
    let app = build_app(state);

    let req = json_request(
        Method::POST,
        "/api/v1/auth/register",
        serde_json::json!({"username":"admin","password":"pw"}),
        None,
    );
    let resp = app.oneshot(req).await.unwrap();
    let (status, body) = read_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.get("token").and_then(|v| v.as_str()).is_some());
    assert_eq!(body["user"]["is_admin"], serde_json::Value::Bool(true));
}

#[tokio::test]
async fn non_admin_should_not_create_user_even_with_permission() {
    let state = test_state().await;
    let app = build_app(state.clone());

    let req = json_request(
        Method::POST,
        "/api/v1/auth/register",
        serde_json::json!({"username":"admin","password":"pw"}),
        None,
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    let (_, body) = read_json(resp).await;
    let admin_token = body["token"].as_str().unwrap().to_string();

    let req = json_request(
        Method::POST,
        "/api/v1/users",
        serde_json::json!({
            "username":"bob",
            "password":"pw",
            "is_admin":false,
            "permissions":[{"target":"users","can_read":true,"can_write":true}]
        }),
        Some(&admin_token),
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let req = json_request(
        Method::POST,
        "/api/v1/auth/login",
        serde_json::json!({"username":"bob","password":"pw"}),
        None,
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    let (_, body) = read_json(resp).await;
    let bob_token = body["token"].as_str().unwrap().to_string();

    let req = json_request(
        Method::POST,
        "/api/v1/users",
        serde_json::json!({"username":"charlie","password":"pw","is_admin":false,"permissions":[]}),
        Some(&bob_token),
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn media_content_should_support_range() {
    let state = test_state().await;
    let app = build_app(state.clone());

    let req = json_request(
        Method::POST,
        "/api/v1/auth/register",
        serde_json::json!({"username":"admin","password":"pw"}),
        None,
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    let (_, body) = read_json(resp).await;
    let admin_token = body["token"].as_str().unwrap().to_string();
    let admin_id = body["user"]["id"].as_i64().unwrap();

    let dir = std::env::temp_dir().join(format!("everos-test-media-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&dir).unwrap();
    let file_path = dir.join("a.bin");
    std::fs::write(&file_path, b"hello world").unwrap();

    let item = state
        .storage
        .upsert_media_by_path(MediaUpsert {
            path: file_path.to_string_lossy().to_string(),
            file_name: "a.bin".to_string(),
            file_key: sha256_hex("a.bin"),
            media_type: MediaType::Video,
            size_bytes: 11,
            library_id: None,
            created_by: Some(admin_id),
        })
        .await
        .unwrap();

    let req = Request::builder()
        .method(Method::GET)
        .uri(format!("/api/v1/media/items/{}/content", item.id))
        .header(header::AUTHORIZATION, format!("Bearer {admin_token}"))
        .header(header::RANGE, "bytes=0-4")
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::PARTIAL_CONTENT);
    assert_eq!(resp.headers().get(header::ACCEPT_RANGES).unwrap(), "bytes");

    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(bytes.as_ref(), b"hello");
}

#[tokio::test]
async fn trash_list_should_return_deleted_items() {
    let state = test_state().await;
    let app = build_app(state.clone());

    let req = json_request(
        Method::POST,
        "/api/v1/auth/register",
        serde_json::json!({"username":"admin","password":"pw"}),
        None,
    );
    let resp = app.clone().oneshot(req).await.unwrap();
    let (_, body) = read_json(resp).await;
    let admin_token = body["token"].as_str().unwrap().to_string();
    let admin_id = body["user"]["id"].as_i64().unwrap();

    let dir = std::env::temp_dir().join(format!("everos-test-trash-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&dir).unwrap();
    let file_path = dir.join("a.jpg");
    std::fs::write(&file_path, b"fake").unwrap();

    let item = state
        .storage
        .upsert_media_by_path(MediaUpsert {
            path: file_path.to_string_lossy().to_string(),
            file_name: "a.jpg".to_string(),
            file_key: sha256_hex("a.jpg"),
            media_type: MediaType::Photo,
            size_bytes: 4,
            library_id: None,
            created_by: Some(admin_id),
        })
        .await
        .unwrap();
    state
        .storage
        .soft_delete_media(item.id, Some(admin_id))
        .await
        .unwrap();

    let req = Request::builder()
        .method(Method::GET)
        .uri("/api/v1/trash/media?page=1&limit=50")
        .header(header::AUTHORIZATION, format!("Bearer {admin_token}"))
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    let (status, body) = read_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        body.as_array()
            .unwrap()
            .iter()
            .any(|v| v["item"]["id"].as_i64() == Some(item.id))
    );
}

#[tokio::test]
async fn emit_alert_should_broadcast() {
    let state = test_state().await;
    let mut rx = state.alerts.subscribe();
    let rec = crate::modules::alerts::emit_alert(
        &state,
        NewAlert {
            level: AlertLevel::Info,
            source: "test".to_string(),
            message: "hi".to_string(),
            data_json: None,
            created_by: None,
        },
    )
    .await
    .unwrap();
    let evt = rx.recv().await.unwrap();
    assert_eq!(evt.alert.id, rec.id);
}

fn sha256_hex(s: &str) -> String {
    use sha2::Digest;
    let mut h = sha2::Sha256::new();
    h.update(s.as_bytes());
    hex::encode(h.finalize())
}
