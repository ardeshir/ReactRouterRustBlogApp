cat > backend/migrations/001_create_posts.sql << 'EOF'
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_posts_timestamp 
    AFTER UPDATE ON posts
    FOR EACH ROW
BEGIN
    UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Insert sample data
INSERT INTO posts (title, content, author, status) VALUES
('Welcome to Our Blog', 'This is our first blog post. Welcome to our new blog platform built with React Router v7 and Rust Axum!', 'Admin', 'published'),
('Getting Started with Rust', 'Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety.', 'John Doe', 'published'),
('React Router v7 Features', 'React Router v7 brings SSR capabilities from Remix into the React Router ecosystem. This is a game changer!', 'Jane Smith', 'draft');
EOF
