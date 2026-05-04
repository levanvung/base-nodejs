#!/bin/sh

set -e

handle_signal() {
    echo "Received signal, shutting down gracefully..."
    kill -TERM "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
    exit 0
}

trap 'handle_signal' SIGINT SIGTERM

if [ "$NODE_ENV" = "production" ]; then
    echo "[entrypoint] Running migrations..."
    npx prisma migrate deploy || echo "[entrypoint] Migration skipped or failed"
fi

# If no command provided, default to running the app server
if [ $# -eq 0 ]; then
    set -- node src/server.js
fi

echo "[entrypoint] Starting server with: $@"
exec "$@"