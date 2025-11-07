FROM rustlang/rust:nightly-slim AS dev

WORKDIR /app

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev sqlite3 && \
    rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-watch 
RUN cargo install sqlx-cli --no-default-features --features sqlite

# Copy only Cargo files first for better caching
COPY Cargo.toml Cargo.lock* ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build && \
    rm -rf src

# Now copy the real source
COPY . .

# Ensure the app directory has write permissions
RUN chmod -R 777 /app

EXPOSE 8000

CMD ["cargo", "watch", "-x", "run"]
