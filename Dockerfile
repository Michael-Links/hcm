# ============================================
# ECM Phase 1 - Multi-stage Docker Build
# ============================================

# Stage 1: Build Frontend
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends nginx curl && \
    rm -rf /var/lib/apt/lists/*

# Copy backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Copy frontend build
COPY --from=frontend-build /build/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Data volume for SQLite
VOLUME ["/app/data"]
ENV DATABASE_URL=sqlite:////app/data/ecm.db

EXPOSE 80

CMD ["/app/start.sh"]
