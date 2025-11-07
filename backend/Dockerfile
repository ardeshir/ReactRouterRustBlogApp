# Stage 1: Recipe planner
FROM rustlang/rust:nightly-slim As chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 2: Build dependencies (cached layer)
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json

# Build application
COPY . .
RUN cargo build --release --bin backend

# Stage 3: Runtime environment
FROM debian:bookworm-slim AS runtime

# Install ca-certificates for HTTPS
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 755 /app/data

# Copy binary and migrations
COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY migrations ./migrations

ENV DATABASE_URL=sqlite:///app/data/blog.db
ENV RUST_LOG=info
ENV PORT=3001

EXPOSE 3001

CMD ["/usr/local/bin/backend"]
