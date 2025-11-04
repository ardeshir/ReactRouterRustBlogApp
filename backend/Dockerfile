FROM rust:1.75-slim AS dev

WORKDIR /app

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-watch

COPY . .

EXPOSE 8000

CMD ["cargo", "watch", "-x", "run"]
