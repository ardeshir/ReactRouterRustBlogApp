#!/bin/sh
set -e

# Create database location
mkdir -p /tmp
touch /tmp/blog.db
chmod 666 /tmp/blog.db

echo "Database file ready at /tmp/blog.db"

# Execute the main command
exec "$@"
