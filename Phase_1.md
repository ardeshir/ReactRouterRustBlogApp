# Phase 1: Database Stabilization & Complete Backend CRUD

**Estimated Time**: 2-3 hours  
**Goal**: Make database persistent, extend schema, and implement full CRUD operations

---

## Step 1: Make Database Persistent

### Problem
Your database is likely in a temporary location that gets wiped on container restart.

### Solution

#### 1.1 Create persistent data directory

```bash
cd ~/ReactRouterRustBlogApp
mkdir -p backend/data
chmod 777 backend/data
```

#### 1.2 Update `docker-compose.dev.yml`

Add volume mount for database persistence:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: blog-backend-dev
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=sqlite:///app/data/blog.db  # ← Changed from /tmp
      - RUST_LOG=debug
      - PORT=3001
    volumes:
      - ./backend:/app
      - cargo-cache:/usr/local/cargo/registry
      - target-cache:/app/target
      - ./backend/data:/app/data  # ← Add this line for persistence
    networks:
      - blog-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: blog-frontend-dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:3001  # ← Use Docker service name
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - blog-network
    restart: unless-stopped

volumes:
  cargo-cache:
  target-cache:

networks:
  blog-network:
    driver: bridge
```

#### 1.3 Update `backend/entrypoint.sh`

Ensure database directory and file exist with proper permissions:

```bash
#!/bin/sh
set -e

echo "🔧 Setting up database environment..."

# Ensure data directory exists with proper permissions
mkdir -p /app/data
chmod 777 /app/data

# Create database file if it doesn't exist
if [ ! -f /app/data/blog.db ]; then
    touch /app/data/blog.db
    chmod 666 /app/data/blog.db
    echo "✅ Created new database file"
else
    echo "✅ Using existing database file"
fi

echo "📦 Database ready at /app/data/blog.db"

# Execute the main command (CMD from Dockerfile)
exec "$@"
```

#### 1.4 Test Persistence

```bash
# Restart containers to apply changes
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start
sleep 5

# Verify database file exists on host
ls -la backend/data/blog.db

# Test that data persists across restarts
echo "Testing data persistence..."
curl -s http://localhost:3001/api/posts | jq '.data | length'

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend
sleep 3

# Data should still be there
curl -s http://localhost:3001/api/posts | jq '.data | length'
echo "✅ Persistence test passed!"
```

---

## Step 2: Extend Database Schema

Add fields needed for a production blog: slug, excerpt, published_at, view_count, status.

### 2.1 Create Migration File

Create `backend/migrations/20250108000002_extend_posts.sql`:

```sql
-- Add new columns to posts table
ALTER TABLE posts ADD COLUMN excerpt TEXT;
ALTER TABLE posts ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE posts ADD COLUMN published_at DATETIME;
ALTER TABLE posts ADD COLUMN updated_by TEXT;
ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;

-- Add status column with constraint (SQLite doesn't enforce CHECK in ALTER TABLE, so we'll handle in app)
ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'draft';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

-- Update existing posts with computed values
UPDATE posts 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), ',', ''))
WHERE slug IS NULL;

UPDATE posts 
SET excerpt = SUBSTR(content, 1, 200) || '...'
WHERE excerpt IS NULL;

UPDATE posts 
SET status = 'published'
WHERE status IS NULL OR status = '';

-- Set published_at for existing posts
UPDATE posts
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;
```

### 2.2 Update Rust Models

Update `backend/src/models.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: i64,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub author: String,
    pub status: String,
    pub view_count: i64,
    pub created_at: String,
    pub published_at: Option<String>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePost {
    pub title: String,
    pub content: String,
    pub author: String,
    #[serde(default)]
    pub excerpt: Option<String>,
    #[serde(default = "default_status")]
    pub status: String,
}

fn default_status() -> String {
    "draft".to_string()
}

#[derive(Debug, Deserialize)]
pub struct UpdatePost {
    pub title: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub status: Option<String>,
    pub updated_by: Option<String>,
}

/// Generate URL-friendly slug from title
pub fn slugify(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'a'..='z' | '0'..='9' => c,
            _ => '-',
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slugify() {
        assert_eq!(slugify("Hello World"), "hello-world");
        assert_eq!(slugify("Rust & Axum Tutorial!"), "rust-axum-tutorial");
        assert_eq!(slugify("Multiple   Spaces"), "multiple-spaces");
    }
}
```

### 2.3 Apply Migration

```bash
# Restart backend to apply migration
docker-compose -f docker-compose.dev.yml restart backend

# Check migration logs
docker-compose -f docker-compose.dev.yml logs backend | grep -i migration

# Expected output:
# ✅ Migrations applied
```

---

## Step 3: Complete Backend CRUD Handlers

### 3.1 Update `backend/src/main.rs`

Replace the entire file with complete CRUD implementation:

```rust
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

mod models;
use models::{slugify, CreatePost, Post, UpdatePost};

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[derive(Deserialize)]
struct ListQuery {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_per_page")]
    per_page: i64,
    status: Option<String>,
}

fn default_page() -> i64 {
    1
}
fn default_per_page() -> i64 {
    10
}

#[derive(Serialize)]
struct PaginatedResponse<T> {
    data: Vec<T>,
    page: i64,
    per_page: i64,
    total: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    tracing::info!("🚀 Starting Blog Backend Server");

    // Load environment
    dotenvy::dotenv().ok();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:///app/data/blog.db".to_string());

    tracing::info!("📦 Database: {}", database_url);

    // Connect to database
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    tracing::info!("✅ Database connected");

    // Run migrations
    sqlx::migrate!("./migrations").run(&db).await?;
    tracing::info!("✅ Migrations applied");

    let state = AppState { db };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/posts", get(list_posts).post(create_post))
        .route(
            "/api/posts/:id",
            get(get_post).put(update_post).delete(delete_post),
        )
        .route("/api/posts/slug/:slug", get(get_post_by_slug))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🎉 Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "Blog API Server v1.0 - Ready"
}

async fn health_check(State(state): State<AppState>) -> Result<Json<serde_json::Value>, StatusCode> {
    // Test database connection
    match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "healthy",
            "database": "connected"
        }))),
        Err(_) => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

async fn list_posts(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<PaginatedResponse<Post>>, (StatusCode, String)> {
    let page = query.page.max(1);
    let per_page = query.per_page.clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut sql = "SELECT * FROM posts".to_string();
    let mut count_sql = "SELECT COUNT(*) FROM posts".to_string();

    if let Some(status) = &query.status {
        sql.push_str(&format!(" WHERE status = '{}'", status));
        count_sql.push_str(&format!(" WHERE status = '{}'", status));
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

    let posts = sqlx::query_as::<_, Post>(&sql)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (total,): (i64,) = sqlx::query_as(&count_sql)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PaginatedResponse {
        data: posts,
        page,
        per_page,
        total,
    }))
}

async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Post>, (StatusCode, String)> {
    // Increment view count
    sqlx::query("UPDATE posts SET view_count = view_count + 1 WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .ok();

    let post = sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}

async fn get_post_by_slug(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Post>, (StatusCode, String)> {
    // Increment view count
    sqlx::query("UPDATE posts SET view_count = view_count + 1 WHERE slug = ?")
        .bind(&slug)
        .execute(&state.db)
        .await
        .ok();

    let post = sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE slug = ?")
        .bind(slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}

async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePost>,
) -> Result<(StatusCode, Json<Post>), (StatusCode, String)> {
    // Validation
    if payload.title.len() < 3 {
        return Err((StatusCode::BAD_REQUEST, "Title too short".to_string()));
    }

    if payload.content.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Content is required".to_string()));
    }

    // Generate slug
    let slug = slugify(&payload.title);

    // Generate excerpt if not provided
    let excerpt = payload.excerpt.or_else(|| {
        Some(
            payload
                .content
                .chars()
                .take(200)
                .collect::<String>()
                + "...",
        )
    });

    // Set published_at if status is published
    let published_at = if payload.status == "published" {
        Some(chrono::Utc::now().to_rfc3339())
    } else {
        None
    };

    // Insert post
    let result = sqlx::query(
        "INSERT INTO posts (title, slug, content, excerpt, author, status, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.content)
    .bind(&excerpt)
    .bind(&payload.author)
    .bind(&payload.status)
    .bind(&published_at)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let id = result.last_insert_rowid();

    // Fetch created post
    let post = sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(post)))
}

async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePost>,
) -> Result<Json<Post>, (StatusCode, String)> {
    // Build dynamic update query
    let mut updates = vec![];
    let mut binds: Vec<String> = vec![];

    if let Some(title) = &payload.title {
        if title.len() < 3 {
            return Err((StatusCode::BAD_REQUEST, "Title too short".to_string()));
        }
        updates.push("title = ?");
        binds.push(title.clone());
        
        // Also update slug
        let slug = slugify(title);
        updates.push("slug = ?");
        binds.push(slug);
    }

    if let Some(content) = &payload.content {
        if content.is_empty() {
            return Err((StatusCode::BAD_REQUEST, "Content cannot be empty".to_string()));
        }
        updates.push("content = ?");
        binds.push(content.clone());
        
        // Auto-generate excerpt from content
        let excerpt = content.chars().take(200).collect::<String>() + "...";
        updates.push("excerpt = ?");
        binds.push(excerpt);
    }

    if let Some(excerpt) = &payload.excerpt {
        updates.push("excerpt = ?");
        binds.push(excerpt.clone());
    }

    if let Some(status) = &payload.status {
        updates.push("status = ?");
        binds.push(status.clone());

        // Set published_at when publishing
        if status == "published" {
            updates.push("published_at = COALESCE(published_at, ?)");
            binds.push(chrono::Utc::now().to_rfc3339());
        }
    }

    if let Some(updated_by) = &payload.updated_by {
        updates.push("updated_by = ?");
        binds.push(updated_by.clone());
    }

    if updates.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No fields to update".to_string()));
    }

    // Execute update with RETURNING clause
    let sql = format!(
        "UPDATE posts SET {} WHERE id = ? RETURNING *",
        updates.join(", ")
    );

    let mut query = sqlx::query_as::<_, Post>(&sql);
    for bind in binds {
        query = query.bind(bind);
    }
    query = query.bind(id);

    let post = query
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}

async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM posts WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Post not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
```

---

## Step 4: Test Backend CRUD

Create `backend/test-api.sh`:

```bash
#!/bin/bash
set -e

API_URL="http://localhost:3001/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Blog API CRUD Operations${NC}"
echo "===================================="

# Test 1: Health Check
echo -e "${BLUE}1️⃣  Health Check...${NC}"
HEALTH=$(curl -s "$API_URL/../health")
echo $HEALTH | jq '.'
if echo $HEALTH | jq -e '.status == "healthy"' > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: List all posts
echo -e "\n${BLUE}2️⃣  List all posts...${NC}"
POSTS=$(curl -s "$API_URL/posts?per_page=5")
POST_COUNT=$(echo $POSTS | jq '.data | length')
echo "Found $POST_COUNT posts"
echo -e "${GREEN}✅ List posts successful${NC}"

# Test 3: Create a new post
echo -e "\n${BLUE}3️⃣  Create new post...${NC}"
NEW_POST=$(curl -s -X POST "$API_URL/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test CRUD Operations Post",
    "content": "This post tests all CRUD operations in our blog API. It should have a slug, excerpt, and proper timestamps.",
    "author": "Test Automation",
    "status": "draft"
  }')
POST_ID=$(echo $NEW_POST | jq -r '.id')
POST_SLUG=$(echo $NEW_POST | jq -r '.slug')
echo "Created post ID: $POST_ID with slug: $POST_SLUG"
echo -e "${GREEN}✅ Create post successful${NC}"

# Test 4: Get single post by ID
echo -e "\n${BLUE}4️⃣  Get post by ID...${NC}"
SINGLE_POST=$(curl -s "$API_URL/posts/$POST_ID")
echo $SINGLE_POST | jq '{id, title, slug, status, view_count}'
echo -e "${GREEN}✅ Get post by ID successful${NC}"

# Test 5: Get post by slug
echo -e "\n${BLUE}5️⃣  Get post by slug...${NC}"
SLUG_POST=$(curl -s "$API_URL/posts/slug/$POST_SLUG")
echo $SLUG_POST | jq '{id, title, slug}'
echo -e "${GREEN}✅ Get post by slug successful${NC}"

# Test 6: Update post
echo -e "\n${BLUE}6️⃣  Update post...${NC}"
UPDATED_POST=$(curl -s -X PUT "$API_URL/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Post Title",
    "status": "published",
    "updated_by": "Test Script"
  }')
echo $UPDATED_POST | jq '{id, title, slug, status, published_at, updated_by}'
echo -e "${GREEN}✅ Update post successful${NC}"

# Test 7: Pagination
echo -e "\n${BLUE}7️⃣  Test pagination...${NC}"
PAGE1=$(curl -s "$API_URL/posts?page=1&per_page=2")
echo "Page 1 has $(echo $PAGE1 | jq '.data | length') posts"
echo "Total posts: $(echo $PAGE1 | jq '.total')"
echo -e "${GREEN}✅ Pagination working${NC}"

# Test 8: Filter by status
echo -e "\n${BLUE}8️⃣  Filter by status...${NC}"
PUBLISHED=$(curl -s "$API_URL/posts?status=published")
PUB_COUNT=$(echo $PUBLISHED | jq '.data | length')
echo "Found $PUB_COUNT published posts"
echo -e "${GREEN}✅ Status filtering working${NC}"

# Test 9: Delete post
echo -e "\n${BLUE}9️⃣  Delete post...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/posts/$POST_ID")
if [ "$HTTP_CODE" = "204" ]; then
    echo "Post deleted (HTTP $HTTP_CODE)"
    echo -e "${GREEN}✅ Delete post successful${NC}"
else
    echo -e "${RED}❌ Delete failed with HTTP $HTTP_CODE${NC}"
    exit 1
fi

# Test 10: Verify deletion
echo -e "\n${BLUE}🔟 Verify deletion...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/posts/$POST_ID")
if [ "$HTTP_CODE" = "404" ]; then
    echo "Post not found (HTTP $HTTP_CODE) - Correct!"
    echo -e "${GREEN}✅ Deletion verified${NC}"
else
    echo -e "${RED}❌ Post still exists (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ All CRUD operations successful!${NC}"
echo "===================================="
```

Make it executable and run:

```bash
chmod +x backend/test-api.sh

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services
sleep 5

# Run tests
./backend/test-api.sh
```

---

## Expected Output

```
🧪 Testing Blog API CRUD Operations
====================================
1️⃣  Health Check...
{
  "status": "healthy",
  "database": "connected"
}
✅ Health check passed

2️⃣  List all posts...
Found 3 posts
✅ List posts successful

3️⃣  Create new post...
Created post ID: 4 with slug: test-crud-operations-post
✅ Create post successful

... (more tests)

====================================
✅ All CRUD operations successful!
====================================
```

---

## Troubleshooting

### Database locked error
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Remove database file
rm backend/data/blog.db

# Restart
docker-compose -f docker-compose.dev.yml up -d
```

### Migration errors
```bash
# Check migration status
docker-compose -f docker-compose.dev.yml logs backend | grep migration

# Force re-run migrations
docker-compose -f docker-compose.dev.yml exec backend rm -rf /app/data/blog.db
docker-compose -f docker-compose.dev.yml restart backend
```

### CORS issues
- Verify `VITE_API_URL` uses `http://backend:3001` in docker-compose
- Check browser console for specific CORS errors
- Ensure CORS middleware is configured correctly in `main.rs`

---

## ✅ Phase 1 Complete

You should now have:
- ✅ Persistent database that survives container restarts
- ✅ Extended schema with slug, excerpt, status, view_count
- ✅ Complete CRUD API endpoints
- ✅ Validation and error handling
- ✅ Automated test suite

**Next**: Ready for Phase 2 - Frontend CRUD UI/UX
