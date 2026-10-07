# Built from the repo root (see docker-compose.yml) so it can reach the Caddyfile.

# Build: the static app in dist/
FROM node:24-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Vite bakes these into the app at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_API_URL=/api
RUN npm run build

# Serve: Caddy hosts the app and proxies /api to the backend
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
