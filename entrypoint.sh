#!/bin/sh

handle_signal() {
    echo "Received signal, shutting down gracefully..."
    kill -TERM "$child_pid" 2>/dev/null
    wait "$child_pid"
    exit 0
}

trap 'handle_signal' SIGINT SIGTERM

if [ "$NODE_ENV" = "production" ]; then
    npx prisma migrate deploy || echo "Migration skipped or failed"
fi

"$@" &
child_pid=$!

wait "$child_pid"