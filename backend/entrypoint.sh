#!/bin/sh
set -e

# Ensure data directory exists with proper permissions
mkdir -p /tmp
chmod 777 /tmp

# Check if we can write to the directory
if [ ! -w /tmp ]; then
    echo "ERROR: Cannot write to /tmp"
    ls -la /tmp/
    exit 1
fi

echo "Data directory ready: /tmp"

# Execute the main command
exec "$@"
