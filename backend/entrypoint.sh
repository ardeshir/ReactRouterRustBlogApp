#!/bin/sh
set -e

# Ensure data directory exists with proper permissions
mkdir -p /app/data
chmod 777 /app/data

# Check if we can write to the directory
if [ ! -w /app/data ]; then
    echo "ERROR: Cannot write to /app/data"
    ls -la /app/
    exit 1
fi

echo "Data directory ready: /app/data"

# Execute the main command
exec "$@"
