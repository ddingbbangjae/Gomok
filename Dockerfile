# Frontend build stage
FROM node:20 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Ensure devDependencies are installed even if NODE_ENV is set by the builder
RUN npm ci --include=dev
COPY frontend ./
RUN npm run build

# Backend stage
FROM python:3.12-slim AS backend
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./frontend/dist

ENV FRONTEND_DIST=/app/frontend/dist
ENV PYTHONPATH=/app/backend
ENV PORT=8080

WORKDIR /app/backend
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"]
