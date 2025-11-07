use axum::{
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing FIRST to see errors
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    tracing::info!("Starting blog backend server...");

    // Load environment variables (non-fatal if missing)
    dotenvy::dotenv().ok();

    // Get database URL with fallback
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:///app/data/blog.db".to_string());

    tracing::info!("Database URL: {}", database_url);

   // Around line 30, replace directory creation with:

   // Ensure data directory exists with retries
   for attempt in 1..=3 {
       match std::fs::create_dir_all("/app/data") {
         Ok(_) => {
            // Set permissions (Unix only)
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let perms = std::fs::Permissions::from_mode(0o777);
                std::fs::set_permissions("/app/data", perms).ok();
            }
            tracing::info!("Data directory ready");
            break;
         }
          Err(e) if attempt < 3 => {
            tracing::warn!("Attempt {} to create data directory failed: {}", attempt, e);
            std::thread::sleep(std::time::Duration::from_millis(100));
         }
          Err(e) => {
            tracing::error!("Failed to create data directory after 3 attempts: {}", e);
            return Err(e.into());
         }
      }
    }

    // Create data directory if it doesn't exist
    // std::fs::create_dir_all("/app/data")
    //    .map_err(|e| {
    //        tracing::error!("Failed to create data directory: {}", e);
    //        e
    //    })?;

    // CRITICAL: Use connection pool with retry logic
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&database_url)
        .await
        .map_err(|e| {
            tracing::error!("Failed to connect to database: {}", e);
            e
        })?;

    tracing::info!("Database connected successfully");

    // Run migrations (embedded in binary)
    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to run migrations: {}", e);
            e
        })?;

    tracing::info!("Migrations applied successfully");

    let state = AppState { db };

    // CORS configuration - adjust origins for your needs
    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3000".parse::<HeaderValue>().unwrap(),
            "http://frontend:3000".parse::<HeaderValue>().unwrap(),
        ])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
        .allow_credentials(true);

    // Build router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/posts", get(list_posts).post(create_post))
        .route("/api/posts/:id", get(get_post))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // CRITICAL: Bind to 0.0.0.0, not 127.0.0.1 for Docker!
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| {
            tracing::error!("Failed to bind to {}: {}", addr, e);
            e
        })?;

    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "Blog API Server"
}

async fn health_check() -> StatusCode {
    StatusCode::OK
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct Post {
    id: i64,
    title: String,
    content: String,
    author: String,
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct CreatePost {
    title: String,
    content: String,
    author: String,
}

async fn list_posts(
    State(state): State<AppState>,
) -> Result<Json<Vec<Post>>, (StatusCode, String)> {
    let posts = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, created_at FROM posts ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    Ok(Json(posts))
}

async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePost>,
) -> Result<(StatusCode, Json<Post>), (StatusCode, String)> {
    let result = sqlx::query(
        "INSERT INTO posts (title, content, author) VALUES (?1, ?2, ?3)"
    )
    .bind(&payload.title)
    .bind(&payload.content)
    .bind(&payload.author)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    let id = result.last_insert_rowid();

    let post = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, created_at FROM posts WHERE id = ?1"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    Ok((StatusCode::CREATED, Json(post)))
}

async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Post>, (StatusCode, String)> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, created_at FROM posts WHERE id = ?1"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}
