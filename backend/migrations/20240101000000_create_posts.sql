CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO posts (title, content, author) VALUES 
('Welcome to the Blog', 'This is the first post in our React Router v7 + Rust Axum blog!', 'Admin'),
('Getting Started', 'Learn how to build full-stack applications with Rust and React.', 'Admin');
