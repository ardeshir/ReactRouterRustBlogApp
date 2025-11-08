# React Router v7 + Rust Axum Blog: Production Implementation Guide

## Current Status: ✅ Working Foundation

You have a **working** React Router v7 + Rust Axum blog application with:
- Backend API serving on port 3001
- Frontend SSR app on port 3000
- Database connection established
- Basic routes displaying seed data

## Phase 1: Stabilize Database & Add Complete CRUD (Days 1-2)

### Step 1.1: Make Database Persistent

**Problem:** Database is in `/tmp` which gets wiped on container restart.

**Solution:** Use host-mounted volume.

#### 1. Create persistent data directory on host

```bash
cd ~/ReactRouterRustBlogApp
mkdir -p backend/data
chmod 777 backend/data
```

#### 2. Update `docker-compose.dev.yml`

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: blog-backend-dev
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=sqlite:///app/data/blog.db  # Changed from /tmp
      - RUST_LOG=debug
      - PORT=3001
    volumes:
      - ./backend:/app
      - cargo-cache:/usr/local/cargo/registry
      - target-cache:/app/target
      - ./backend/data:/app/data  # Add this line
    networks:
      - blog-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: blog-frontend-dev
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:3001  # Use service name
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - blog-network

volumes:
  cargo-cache:
  target-cache:

networks:
  blog-network:
    driver: bridge
```

#### 3. Update `backend/entrypoint.sh`

```bash
#!/bin/sh
set -e

# Ensure data directory exists with proper permissions
mkdir -p /app/data
chmod 777 /app/data

# Create database file if it doesn't exist
touch /app/data/blog.db
chmod 666 /app/data/blog.db

echo "✅ Database ready at /app/data/blog.db"

# Execute the main command
exec "$@"
```

#### 4. Test persistence

```bash
# Restart containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up

# Verify database file exists on host
ls -la backend/data/blog.db

# Test that data persists across restarts
curl http://localhost:3001/api/posts
docker-compose -f docker-compose.dev.yml restart backend
curl http://localhost:3001/api/posts  # Should return same data
```

### Step 1.2: Extend Database Schema

Add fields needed for a complete blog: tags, published_at, updated_by.

#### 1. Create new migration: `backend/migrations/20250108000000_extend_posts.sql`

```sql
-- Add new columns to posts table
ALTER TABLE posts ADD COLUMN excerpt TEXT;
ALTER TABLE posts ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE posts ADD COLUMN published_at DATETIME;
ALTER TABLE posts ADD COLUMN updated_by TEXT;
ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived'));

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

-- Update existing posts with slugs
UPDATE posts SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '''', '')) WHERE slug IS NULL;
UPDATE posts SET excerpt = SUBSTR(content, 1, 200) || '...' WHERE excerpt IS NULL;
UPDATE posts SET status = 'published' WHERE status IS NULL;
```

#### 2. Update `backend/src/models.rs`

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

// Helper function to generate slug from title
pub fn slugify(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}
```

#### 3. Test migration

```bash
# Restart backend to apply migration
docker-compose -f docker-compose.dev.yml restart backend

# Check logs
docker-compose -f docker-compose.dev.yml logs backend | grep -i migration
```

### Step 1.3: Complete Backend CRUD Handlers

Update `backend/src/main.rs` to add all CRUD endpoints:

```rust
use axum::{
    extract::{Path, Query, State},
    http::{HeaderValue, Method, StatusCode},
    routing::{get, post, put, delete},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

mod models;
use models::{Post, CreatePost, UpdatePost, slugify};

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

fn default_page() -> i64 { 1 }
fn default_per_page() -> i64 { 10 }

#[derive(Serialize)]
struct PaginatedResponse<T> {
    data: Vec<T>,
    page: i64,
    per_page: i64,
    total: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    tracing::info!("🚀 Starting blog backend server...");

    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:///app/data/blog.db".to_string());

    tracing::info!("📦 Database URL: {}", database_url);

    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    tracing::info!("✅ Database connected");

    sqlx::migrate!("./migrations").run(&db).await?;
    tracing::info!("✅ Migrations applied");

    let state = AppState { db };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/posts", get(list_posts).post(create_post))
        .route("/api/posts/:id", 
            get(get_post)
            .put(update_post)
            .delete(delete_post)
        )
        .route("/api/posts/slug/:slug", get(get_post_by_slug))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🎉 Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "Blog API Server v1.0"
}

async fn health_check() -> StatusCode {
    StatusCode::OK
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

    let post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE id = ?"
    )
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
    let post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE slug = ?"
    )
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
    if payload.title.len() < 3 {
        return Err((StatusCode::BAD_REQUEST, "Title too short".to_string()));
    }

    let slug = slugify(&payload.title);
    let excerpt = payload.excerpt
        .or_else(|| Some(payload.content.chars().take(200).collect::<String>() + "..."));

    let published_at = if payload.status == "published" {
        Some(chrono::Utc::now().to_rfc3339())
    } else {
        None
    };

    let result = sqlx::query(
        "INSERT INTO posts (title, slug, content, excerpt, author, status, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
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
    let mut updates = vec![];
    let mut params: Vec<String> = vec![];

    if let Some(title) = &payload.title {
        updates.push("title = ?");
        params.push(title.clone());
        let slug = slugify(title);
        updates.push("slug = ?");
        params.push(slug);
    }

    if let Some(content) = &payload.content {
        updates.push("content = ?");
        params.push(content.clone());
    }

    if let Some(excerpt) = &payload.excerpt {
        updates.push("excerpt = ?");
        params.push(excerpt.clone());
    }

    if let Some(status) = &payload.status {
        updates.push("status = ?");
        params.push(status.clone());

        if status == "published" {
            updates.push("published_at = ?");
            params.push(chrono::Utc::now().to_rfc3339());
        }
    }

    if let Some(updated_by) = &payload.updated_by {
        updates.push("updated_by = ?");
        params.push(updated_by.clone());
    }

    if updates.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No fields to update".to_string()));
    }

    let sql = format!(
        "UPDATE posts SET {} WHERE id = ? RETURNING *",
        updates.join(", ")
    );

    let mut query = sqlx::query_as::<_, Post>(&sql);
    for param in params {
        query = query.bind(param);
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

### Step 1.4: Test Backend CRUD

Create `backend/test-api.sh`:

```bash
#!/bin/bash
set -e

API_URL="http://localhost:3001/api"

echo "🧪 Testing Blog API CRUD Operations"
echo "=================================="

# Test 1: Health Check
echo "1️⃣  Health Check..."
curl -s "$API_URL/../health" && echo " ✅"

# Test 2: List all posts
echo "2️⃣  List all posts..."
curl -s "$API_URL/posts?per_page=5" | jq '.data | length' && echo " ✅"

# Test 3: Create a new post
echo "3️⃣  Create new post..."
NEW_POST=$(curl -s -X POST "$API_URL/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test CRUD Post",
    "content": "Testing full CRUD operations",
    "author": "Test User",
    "status": "draft"
  }')
POST_ID=$(echo $NEW_POST | jq -r '.id')
echo "Created post ID: $POST_ID ✅"

# Test 4: Get single post
echo "4️⃣  Get post by ID..."
curl -s "$API_URL/posts/$POST_ID" | jq '.title' && echo " ✅"

# Test 5: Update post
echo "5️⃣  Update post..."
curl -s -X PUT "$API_URL/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Post",
    "status": "published"
  }' | jq '.status' && echo " ✅"

# Test 6: Delete post
echo "6️⃣  Delete post..."
curl -s -X DELETE "$API_URL/posts/$POST_ID" -w "%{http_code}" && echo " ✅"

echo "=================================="
echo "✅ All CRUD operations successful!"
```

```bash
chmod +x backend/test-api.sh
./backend/test-api.sh
```

---

## Phase 2: Frontend CRUD UI/UX (Days 2-3)

### Step 2.1: Add Tailwind CSS for Styling

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**frontend/tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**frontend/app/tailwind.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
  }
}
```

**frontend/app/root.tsx:**

```tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "./tailwind.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
```

### Step 2.2: Create Layout Component

**frontend/app/components/Layout.tsx:**

```tsx
import { Link } from "react-router";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              📝 Blog
            </Link>
            <div className="flex gap-4">
              <Link 
                to="/posts" 
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Posts
              </Link>
              <Link 
                to="/posts/new" 
                className="btn-primary"
              >
                + New Post
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>Built with React Router v7 + Rust Axum</p>
        </div>
      </footer>
    </div>
  );
}
```

### Step 2.3: Create Complete CRUD Routes

**frontend/app/routes.ts:**

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("posts", "routes/posts.tsx"),
    route("posts/new", "routes/posts.new.tsx"),
    route("posts/:id", "routes/posts.$id.tsx"),
    route("posts/:id/edit", "routes/posts.$id.edit.tsx"),
  ]),
] satisfies RouteConfig;
```

**(Continue with detailed route implementations...)**

---

## Documentation for AI Agents

Create `AGENT_GUIDE.md` with:
1. Quick start commands
2. API endpoints documentation
3. Database schema
4. Component structure
5. Common tasks (add feature, fix bug, deploy)

---

## Phase 3: Kubernetes Deployment (Days 4-7)

### Infrastructure as Code with Terraform
### GitHub Actions CI/CD
### AWS EKS or Azure AKS deployment

(This section will be provided in next artifact)

---

**Status:** Phase 1 ready to implement.

