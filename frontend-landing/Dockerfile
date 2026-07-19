# ─────────────────────────────────────────────────────────────
# M4STrip landing (TanStack Start / Vite + Nitro) — PRODUCTION build.
# Nitro default target is cloudflare; override to node-server so the SSR
# app runs as a plain Node process inside Docker.
# ─────────────────────────────────────────────────────────────

# 1. Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# npm install (not ci) — the lockfile can drift; install reconciles it.
RUN npm install --no-audit --no-fund

# 2. Builder — build the Nitro node-server output
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# VITE_API_URL is baked into the browser bundle at build time.
ARG VITE_API_URL=https://m4strip.com/api
ENV VITE_API_URL=${VITE_API_URL}
# Force Nitro to emit a runnable Node server (not the cloudflare worker default).
ENV NITRO_PRESET=node-server
RUN npm run build

# 3. Runner — minimal Node runtime serving the SSR output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# SSR loaders run inside the container; reach the backend by service name.
ENV SSR_API_URL=http://backend:8080/api
# Nitro node-server output is fully self-contained under .output/.
COPY --from=builder /app/.output ./.output
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
