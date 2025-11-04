use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;
use std::sync::Arc;

use crate::error::AppError;
use crate::models::{Post, CreatePost, UpdatePost};
use crate::schema::{PaginationParams, PaginatedResponse};

type AppState = Arc<crate::AppState>;

pub async fn list_posts(
    State(state): State<AppState>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Post>>, AppError> {
    let page = params.page.max(1);
    let per_page = params.per_page.clamp(1, 100);
    let offset = (page - 1) * per_page;

    let posts = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, status, created_at, updated_at 
         FROM posts 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?"
    )
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(PaginatedResponse {
        data: posts,
        page,
        per_page,
        total,
    }))
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Post>, AppError> {
    let post = sqlx::query_as::<_, Post>(
        "SELECT id, title, content, author, status, created_at, updated_at 
         FROM posts 
         WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound,
        _ => AppError::DatabaseError(e),
    })?;

    Ok(Json(post))
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePost>,
) -> Result<(StatusCode, Json<Post>), AppError> {
    if payload.title.len() < 3 {
        return Err(AppError::ValidationError(
            "Title must be at least 3 characters".to_string()
        ));
    }

    if payload.content.is_empty() {
        return Err(AppError::ValidationError(
            "Content cannot be empty".to_string()
        ));
    }

    if payload.author.is_empty() {
        return Err(AppError::ValidationError(
            "Author cannot be empty".to_string()
        ));
    }

    let post = sqlx::query_as::<_, Post>(
        r#"
        INSERT INTO posts (title, content, author, status)
        VALUES (?, ?, ?, ?)
        RETURNING id, title, content, author, status, created_at, updated_at
        "#
    )
    .bind(&payload.title)
    .bind(&payload.content)
    .bind(&payload.author)
    .bind(&payload.status)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(post)))
}

pub async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePost>,
) -> Result<Json<Post>, AppError> {
    if let Some(ref title) = payload.title {
        if title.len() < 3 {
            return Err(AppError::ValidationError(
                "Title must be at least 3 characters".to_string()
            ));
        }
    }

    let post = sqlx::query_as::<_, Post>(
        r#"
        UPDATE posts 
        SET title = COALESCE(?, title),
            content = COALESCE(?, content),
            author = COALESCE(?, author),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, title, content, author, status, created_at, updated_at
        "#
    )
    .bind(payload.title)
    .bind(payload.content)
    .bind(payload.author)
    .bind(payload.status)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => AppError::NotFound,
        _ => AppError::DatabaseError(e),
    })?;

    Ok(Json(post))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM posts WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
