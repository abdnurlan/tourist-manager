# Tur Planlayıcı — Personal AI Tour Planner

A personal, single-guide AI tour planner. One tour guide manages daily tours, hotels,
transfers, restaurants, flights and a daily timeline. The **primary operational surface
is a Telegram AI bot** (to reduce typing), and the **web app is the management surface**:
dashboard, calendar, timeline, manual editing, search, AI history and settings.

The entire user-facing product is in **Azerbaijani** (web + bot). It is intentionally
**not** a CRM and **not** multi-user — there are no tourist profiles, and participant
names are optional everywhere.

Core model: `Tour → Date Range → Daily Timeline → Events`.

---

## Table of Contents

1. [Overview & Features](#1-overview--features)
2. [Local Setup Without Docker](#2-local-setup-without-docker)
3. [Docker Setup](#3-docker-setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Migrations](#5-database-migrations)
6. [Telegram Bot Setup](#6-telegram-bot-setup)
7. [Production VPS Deployment (Docker Compose)](#7-production-vps-deployment-docker-compose)
8. [Nginx Reverse Proxy](#8-nginx-reverse-proxy)
9. [SSL with Certbot](#9-ssl-with-certbot)
10. [Updating](#10-updating)
11. [Logs](#11-logs)
12. [PostgreSQL Backups](#12-postgresql-backups)

---

## 1. Overview & Features

### Features

- **Tours & timeline** — create tours with a date range; events are bucketed into
  per-day sections (`1-ci gün — 18 İyun`) computed client-side.
- **Events** — transfer, hotel, restaurant, tour, flight, note, other. Each event holds
  time, location, optional participants/phone, price + currency, payment status,
  reminder time, notes and an attachment. Works perfectly with zero participant names.
- **Dashboard** — today's plan, upcoming events/tours, active tours, reminders, recent
  activity, Telegram status, and a weather placeholder.
- **Calendar** — month view with type filter; each event shows its parent tour title.
- **Search** — global, case-insensitive search across tours and events.
- **Telegram AI bot** — the main input surface. Commands (`/start`, `/help`, `/today`,
  `/tomorrow`, `/tours`, `/active`) query the real database and reply in Azerbaijani.
  Free-text and voice messages flow through an AI pipeline (intent detection → backend
  action → Azerbaijani confirmation). The bot is locked to a single allowed Telegram
  user id; every other sender is politely rejected. Runs in **polling** (local) or
  **webhook** (production) mode.
- **AI assistant (web)** — chat plus history. Inbound/outbound messages are logged to
  `telegram_messages`, so the web "AI history" view shows both bot and web-chat activity.
  When `OPENAI_API_KEY` is unset, the AI returns a graceful Azerbaijani fallback.
- **Auth** — fixed login (see below), JWT (HS256), 7-day expiry, route-guarded web app.

### Fixed login

The app seeds an admin user on first boot. Default credentials:

```
username: admin
password: admin123
```

These come from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`. The password is
bcrypt-hashed into the `users` table on first boot. **Change them for production.**

### Tech stack

- **Backend:** Go 1.26, Fiber v2, GORM, PostgreSQL, JWT, bcrypt.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui,
  Framer Motion, TanStack Query + Axios, React Hook Form + Zod.
- **Infra:** Docker + Docker Compose, Nginx reverse proxy, Certbot/Let's Encrypt SSL.

### Screenshots

> _Placeholder — add screenshots here._

| Dashboard | Tour detail | Calendar |
|---|---|---|
| _`docs/screenshots/dashboard.png`_ | _`docs/screenshots/tour-detail.png`_ | _`docs/screenshots/calendar.png`_ |

| AI assistant | Telegram bot |
|---|---|
| _`docs/screenshots/ai.png`_ | _`docs/screenshots/telegram.png`_ |

---

## 2. Local Setup Without Docker

Prerequisites: **Go 1.26+**, **Node.js 20+** & npm, **PostgreSQL 16+**.

### 2.1 PostgreSQL

Create the database and enable `pgcrypto` (used for `gen_random_uuid()`):

```bash
createdb tourist_manager
psql -d tourist_manager -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
```

(If your local Postgres uses different credentials, adjust `DATABASE_URL` below.)

### 2.2 Backend (Go)

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL to the LOCALHOST form, e.g.
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/tourist_manager?sslmode=disable

go mod download
go run ./cmd/server
```

On first boot the server runs migrations and seeds the admin user. It listens on
`http://localhost:8080`; the API is under `/api` (health check: `GET /api/health`).

> **Migrations:** the server applies SQL migrations from `backend/migrations/` on boot,
> with a GORM `AutoMigrate` fallback for the schema. You can also run migrations manually
> with `golang-migrate` — see [section 5](#5-database-migrations).

### 2.3 Frontend (Next.js)

In a second terminal:

```bash
cd frontend
cp .env.example .env
# Ensure NEXT_PUBLIC_API_URL points at the backend, reachable from your browser:
#   NEXT_PUBLIC_API_URL=http://localhost:8080/api

npm install
npm run dev
```

Open `http://localhost:3000` and log in with `admin` / `admin123`.

> **Note:** `NEXT_PUBLIC_API_URL` is read by the browser, so it must be a URL the browser
> can reach (`http://localhost:8080/api` locally), **not** an internal Docker host.

---

## 3. Docker Setup

Prerequisites: **Docker** + **Docker Compose v2**.

```bash
# From the repo root:
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

This starts three services:

| Service    | Container                | Port (host → container) |
|------------|--------------------------|-------------------------|
| `db`       | `turplanlayici_db`       | `5432 → 5432`           |
| `backend`  | `turplanlayici_backend`  | `8080 → 8080`           |
| `frontend` | `turplanlayici_frontend` | `3000 → 3000`           |

Then open:

- Web app: `http://localhost:3000`
- API: `http://localhost:8080/api`

Compose handles ordering: `backend` waits for `db` to be **healthy** (Postgres
healthcheck), and `frontend` waits for `backend`. On first boot the backend runs
migrations and seeds `admin` / `admin123`.

> **About `NEXT_PUBLIC_API_URL` in Docker:** this value is **baked into the frontend
> bundle at build time** and is used by the **browser**, so it must point at a
> browser-reachable address. Locally that is `http://localhost:8080/api` (the default,
> passed both as a Docker **build arg** and a runtime env var in `docker-compose.yml`).
> In production set it to your public HTTPS API URL (e.g. `https://your-domain.com/api`)
> and rebuild the frontend. Do **not** use the internal Docker hostname `backend:8080`
> here — the browser cannot resolve it.

To run detached and stop:

```bash
docker compose up --build -d
docker compose down            # stop (keeps the pgdata volume)
docker compose down -v         # stop AND delete the database volume
```

---

## 4. Environment Variables

Two `.env` files drive the app. Copy each example and edit:

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Both `.env` files are gitignored. Docker Compose loads them via `env_file`.

### Backend (`backend/.env`)

| Variable | Meaning | Example | File |
|---|---|---|---|
| `PORT` | HTTP port the Fiber server listens on. | `8080` | `backend/.env` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins. Add your production domain. | `http://localhost:3000,https://your-domain.com` | `backend/.env` |
| `DATABASE_URL` | PostgreSQL connection string. Use `db` host in Docker, `localhost` locally. | `postgres://postgres:postgres@db:5432/tourist_manager?sslmode=disable` | `backend/.env` |
| `JWT_SECRET` | HS256 signing secret for JWTs. Use a long random string in prod (`openssl rand -base64 48`). | `a-long-random-secret` | `backend/.env` |
| `ADMIN_USERNAME` | Seed admin username (created on first boot). | `admin` | `backend/.env` |
| `ADMIN_PASSWORD` | Seed admin password (bcrypt-hashed on first boot). | `admin123` | `backend/.env` |
| `OPENAI_API_KEY` | OpenAI key for the AI pipeline. If empty, AI returns an Azerbaijani fallback. | `sk-...` | `backend/.env` |
| `TELEGRAM_MODE` | Bot mode: `polling` (local) or `webhook` (production). | `polling` | `backend/.env` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather. Empty = bot disabled. | `123456789:AAH...` | `backend/.env` |
| `TELEGRAM_ALLOWED_USER_ID` | The ONLY Telegram numeric user id allowed to use the bot. | `555000111` | `backend/.env` |

> In `docker-compose.yml`, `DATABASE_URL` and `PORT` are **overridden** for the backend
> service so the DB host is always the compose service name `db`. Everything else is read
> from `backend/.env`.

### Frontend (`frontend/.env`)

| Variable | Meaning | Example | File |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL **including `/api`**. Baked at build time; must be **browser-reachable**. | `http://localhost:8080/api` (local) / `https://your-domain.com/api` (prod) | `frontend/.env` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js anonymous telemetry (optional). | `1` | `frontend/.env` |

---

## 5. Database Migrations

The backend applies migrations automatically on boot. SQL migration files live in
`backend/migrations/`:

```
0001_init.up.sql / .down.sql          # enums, tables, indexes
0002_seed_admin.up.sql / .down.sql    # optional admin seed (primary seed is in code)
```

### GORM AutoMigrate

On startup `internal/database/migrate.go` runs the SQL migrations and then performs a
**GORM `AutoMigrate`** pass as a safety net to keep the schema in sync with the model
structs, before seeding the admin user. For normal operation you do **not** need to run
anything by hand — just start the backend.

### Running migrations manually with golang-migrate

If you want to control migrations explicitly, install
[golang-migrate](https://github.com/golang-migrate/migrate):

```bash
# macOS
brew install golang-migrate
# or Go install
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

Then, from the repo root (adjust the URL for local vs Docker):

```bash
# Apply all up migrations
migrate -path backend/migrations \
  -database "postgres://postgres:postgres@localhost:5432/tourist_manager?sslmode=disable" up

# Roll back the most recent migration
migrate -path backend/migrations \
  -database "postgres://postgres:postgres@localhost:5432/tourist_manager?sslmode=disable" down 1

# Check current version
migrate -path backend/migrations \
  -database "postgres://postgres:postgres@localhost:5432/tourist_manager?sslmode=disable" version
```

Inside Docker you can run migrate against the running DB by exec-ing into a tooling
container or pointing `-database` at `localhost:5432` (the `db` port is published to the
host).

---

## 6. Telegram Bot Setup

### 6.1 Create the bot & get a token

1. In Telegram, open **@BotFather**.
2. Send `/newbot`, choose a name and a username ending in `bot`.
3. BotFather returns a **token** like `123456789:AAH...`. Put it in
   `backend/.env` as `TELEGRAM_BOT_TOKEN`.

### 6.2 Find your allowed user id

The bot only responds to one person. Get your numeric Telegram user id from
**@userinfobot** or **@RawDataBot** (send them any message). Put that number in
`backend/.env` as `TELEGRAM_ALLOWED_USER_ID`. Any update from a different id is logged
and politely rejected (`Bu bota yalnız sahib istifadə edə bilər.`).

### 6.3 Webhook vs polling

- **Polling** (`TELEGRAM_MODE=polling`) — the backend long-polls `getUpdates`. No public
  URL required. **Best for local development.**
- **Webhook** (`TELEGRAM_MODE=webhook`) — Telegram POSTs updates to
  `/api/telegram/webhook`. **Best for production.** The webhook URL must be **publicly
  reachable over HTTPS** (Telegram only calls `https://` on ports 443/80/88/8443), so it
  requires a domain + valid TLS certificate (see [Nginx](#8-nginx-reverse-proxy) and
  [Certbot](#9-ssl-with-certbot)). Behind the reverse proxy the public path is
  `https://your-domain.com/api/telegram/webhook` → proxied to `backend:8080`.

### 6.4 Registering the webhook (production)

Once your domain has HTTPS, register the webhook with Telegram:

```bash
curl -F "url=https://your-domain.com/api/telegram/webhook" \
  "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook"
```

Verify / remove:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook"   # to switch back to polling
```

> Use **either** webhook **or** polling at a time. Delete the webhook before switching to
> polling, otherwise `getUpdates` will return an error.

### 6.5 Commands

`/start`, `/help`, `/today`, `/tomorrow`, `/tours`, `/active` — all query the real
database and reply in Azerbaijani. Free-text and voice messages go through the AI
pipeline (intent detection → backend action → confirmation).

---

## 7. Production VPS Deployment (Docker Compose)

On an Ubuntu/Debian VPS:

```bash
# 1. Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # re-login afterwards

# 2. Clone the repo
git clone <your-repo-url> tour-planner
cd tour-planner

# 3. Configure environment
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Edit production values:

- `backend/.env`: strong `JWT_SECRET`, changed `ADMIN_PASSWORD`, your `OPENAI_API_KEY`,
  `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USER_ID`, `TELEGRAM_MODE=webhook`, and add your
  domain to `CORS_ORIGINS` (e.g. `https://your-domain.com`).
- `frontend/.env`: set `NEXT_PUBLIC_API_URL=https://your-domain.com/api`.
- `docker-compose.yml`: update the frontend `build.args.NEXT_PUBLIC_API_URL` to the same
  public HTTPS URL (it is baked at build time), then rebuild.

Then build and start detached:

```bash
docker compose up --build -d
docker compose ps
```

The services listen on `127.0.0.1:3000` (frontend) and `127.0.0.1:8080` (backend). Put
**Nginx in front** for the public domain and TLS (next two sections). For better security
you may restrict the published ports to localhost (e.g. map `"127.0.0.1:8080:8080"`) so
only Nginx is exposed publicly. The Postgres port (`5432`) should **not** be exposed to
the internet — bind it to localhost or remove the published mapping in production.

---

## 8. Nginx Reverse Proxy

A ready-to-use server block is provided at [`nginx/tour-planner.conf`](nginx/tour-planner.conf).
It proxies:

- `/`    → frontend `127.0.0.1:3000`
- `/api` → backend  `127.0.0.1:8080` (this includes the Telegram webhook path
  `/api/telegram/webhook`)

Install it:

```bash
sudo apt-get install -y nginx
sudo cp nginx/tour-planner.conf /etc/nginx/sites-available/tour-planner.conf
# Edit the file and replace your-domain.com with your real domain.
sudo ln -s /etc/nginx/sites-available/tour-planner.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The provided server block (summary):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 25m;

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Telegram webhook reachability:** the webhook is a normal `/api` route, so it is
> proxied to the backend automatically. For `TELEGRAM_MODE=webhook` it must be reachable
> from Telegram's servers at `https://your-domain.com/api/telegram/webhook` over **valid
> HTTPS** — finish the SSL step below first, then run `setWebhook`
> ([section 6.4](#64-registering-the-webhook-production)).

---

## 9. SSL with Certbot

Use Let's Encrypt via Certbot to add HTTPS to the Nginx server block:

```bash
# Install Certbot + the Nginx plugin
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain + install a certificate (Certbot edits your Nginx config and adds the
# 443 server block + HTTP->HTTPS redirect automatically)
sudo certbot --nginx -d your-domain.com

# Verify automatic renewal (Certbot installs a systemd timer / cron job)
sudo certbot renew --dry-run
```

Certbot renews certificates automatically (twice-daily timer; it only renews when within
30 days of expiry) and reloads Nginx. After HTTPS is live, set
`NEXT_PUBLIC_API_URL=https://your-domain.com/api`, rebuild the frontend
(`docker compose up --build -d frontend`), and register the Telegram webhook
([section 6.4](#64-registering-the-webhook-production)).

---

## 10. Updating

To deploy new code:

```bash
cd tour-planner
git pull
docker compose up -d --build
```

This rebuilds changed images and recreates the affected containers. The `pgdata` volume
persists, so your database is preserved. If you changed `NEXT_PUBLIC_API_URL` or any
build arg, the frontend image rebuilds to bake in the new value.

To clean up old dangling images afterwards:

```bash
docker image prune -f
```

---

## 11. Logs

Stream container logs with Docker Compose:

```bash
docker compose logs -f backend      # follow backend logs
docker compose logs -f frontend     # follow frontend logs
docker compose logs -f db           # follow database logs
docker compose logs -f              # all services together

docker compose logs --tail=200 backend   # last 200 lines
```

---

## 12. PostgreSQL Backups

The database lives in the `pgdata` Docker volume. Use `pg_dump` / `pg_restore` via the
`db` container.

### Backup

```bash
# Plain-SQL dump to a timestamped file on the host
docker compose exec -T db \
  pg_dump -U postgres -d tourist_manager \
  > "backup_tourist_manager_$(date +%Y%m%d_%H%M%S).sql"

# Or a compressed custom-format dump (recommended; supports selective restore)
docker compose exec -T db \
  pg_dump -U postgres -d tourist_manager -F c \
  > "backup_tourist_manager_$(date +%Y%m%d_%H%M%S).dump"
```

### Restore

```bash
# From a plain-SQL dump
cat backup_tourist_manager_YYYYMMDD_HHMMSS.sql | \
  docker compose exec -T db psql -U postgres -d tourist_manager

# From a custom-format dump (drop + recreate objects as needed)
cat backup_tourist_manager_YYYYMMDD_HHMMSS.dump | \
  docker compose exec -T db pg_restore -U postgres -d tourist_manager --clean --if-exists
```

### Backing up the raw volume

To snapshot the entire data directory (e.g. before a major upgrade):

```bash
docker run --rm \
  -v tourist-manager_pgdata:/data \
  -v "$PWD":/backup alpine \
  tar czf /backup/pgdata_$(date +%Y%m%d).tar.gz -C /data .
```

> The volume name is `<project>_pgdata` (the project name is the repo directory, so
> usually `tourist-manager_pgdata`). Confirm with `docker volume ls`.

Automate backups with a daily cron job that runs the `pg_dump` command above and rotates
old files (e.g. keep the last 7–30 days).

---

## License

Personal project. Use at your own discretion.
