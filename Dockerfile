# ===== Stage 1: Build =====
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_ vars are embedded at build time — pass them as Docker build args
# On App Platform: set these under "Build Arguments" in your app spec
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST

RUN npm run build

# ===== Stage 2: Serve =====
FROM nginx:alpine

# Copy built Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine automatically runs envsubst on files in /etc/nginx/templates/
# and writes the result to /etc/nginx/conf.d/ — no custom entrypoint needed.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default backend URL for standalone Docker / docker-compose.
# On App Platform with route-based splitting, this is never used (App Platform
# intercepts /api before it reaches nginx), but must be a valid value.
ENV BACKEND_URL=http://backend:3000

EXPOSE 80
