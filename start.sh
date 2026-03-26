#!/bin/sh
set -e

echo "=== ECM Startup ==="

# Run seed (creates tables + default data if needed)
cd /app/backend
python seed.py

# Start Uvicorn in background
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &
UVICORN_PID=$!
echo "Uvicorn started (PID: $UVICORN_PID)"

# Wait for backend to be ready
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
        echo "Backend is ready."
        break
    fi
    sleep 1
done

# Start Nginx in foreground
echo "Starting Nginx..."
exec nginx -g "daemon off;"
