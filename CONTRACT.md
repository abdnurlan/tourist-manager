# Tur Planlayıcı — CONTRACT (Single Source of Truth)

> This document is the **authoritative, self-contained contract** for the project.
> Every builder (backend, frontend, Telegram/AI) reads ONLY this file. If it is not
> written here, it is not part of the product. When in doubt, this document wins.

---

## 0. Product Summary

**Tur Planlayıcı** is a **personal AI Tour Planner for a single tour guide**.
It is **NOT** a CRM and **NOT** multi-company / multi-user. One guide manages daily
tours, hotels, transfers, restaurants, flights, and a daily schedule.

- The **primary operational surface is a Telegram AI bot** (reduce typing).
- The **web app is the management surface**: dashboard, calendar, timeline, manual
  editing, statistics, search, AI history, settings.
- **Core model:** `Tour → Date Range → Daily Timeline → Events`.
- **There are NO tourist profiles.** Participant names are **OPTIONAL** everywhere.
  The product MUST work perfectly with zero participant names.

### Language Rule (non-negotiable)
- **100% of user-facing text is AZERBAIJANI** — buttons, menus, errors, notifications,
  calendar, dashboard, search, settings, login, AI/Telegram replies, empty states,
  toasts, onboarding. It must read like a **native** Azerbaijani product.
- **English stays only in:** code identifiers, DB column names, API routes, enum
  *values* (e.g. `planned`, `transfer`), JSON keys. Enum values are mapped to
  Azerbaijani **labels** in the frontend dictionary (`lib/i18n/az.ts`) and in bot replies.

---

## 1. Locked Tech Stack

### Backend
- **Go 1.26** + **Fiber v2** + **GORM** + **PostgreSQL**.
- JWT via **github.com/golang-jwt/jwt/v5**.
- Password hashing via **golang.org/x/crypto/bcrypt**.
- Clean Architecture: repository pattern + service layer + middleware + validation +
  structured logging + structured errors.
- Dockerized; SQL migrations + env-driven config.
- Fiber middleware: `cors`, `logger`, `recover`, plus custom `AuthRequired` (JWT).
- All errors emitted in the Azerbaijani JSON error shape (§5).

### Frontend
- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **TailwindCSS**.
- **shadcn/ui** components, **hand-written** (Radix primitives), not generated blindly.
- **Framer Motion** (animation), **lucide-react** (icons).
- **React Hook Form** + **Zod** (forms + validation).
- **TanStack Query** (server state) wrapping a single **Axios** instance (the HTTP client).
- Single Azerbaijani dictionary: `lib/i18n/az.ts`.
- Auth: React context + `localStorage` token + route protection.

### Cross-cutting
- **API prefix:** `/api`.
- **Frontend → backend base URL:** `NEXT_PUBLIC_API_URL=http://localhost:8080/api`.
- **No pagination** for MVP (return full lists).

---

## 2. Conventions (READ FIRST — FE & BE MUST match exactly)

### 2.1 JSON key casing
- **All JSON keys are `snake_case`** (request bodies AND responses). e.g.
  `start_date`, `payment_status`, `today_events`, `telegram_user_id`.
- TypeScript interfaces on the frontend mirror these keys verbatim (`snake_case` in types).

### 2.2 Response envelope convention
| Shape | When | Body |
|---|---|---|
| **Item** | single resource (GET/POST/PATCH of one object) | the object **bare at top level** — e.g. `GET /tours/:id` → `{ "id": "...", "title": "..." }` |
| **List** | any collection endpoint | wrapped: `{ "data": [ ... ] }` |
| **Composite** | dashboard / structured aggregate | a named object whose fields are themselves items/lists — e.g. `{ "today_events": [...], "active_tours": [...] }` |
| **Action** | login, logout, ai/chat, etc. | a flat purpose-specific object — e.g. `{ "token": "...", "user": {...} }` |
| **Error** | any non-2xx | `{ "error": { "code": "...", "message": "<Azerbaijani>" } }` |

Rules:
- Lists are **always** `{ "data": [...] }` (never a bare array). This holds for
  `/tours`, `/tours/:id/events`, `/calendar/events`, `/search` (its `data` arrays), `/ai/history`.
- Single items are returned **bare** (no `{ "data": {...} }` wrapper). This keeps
  `useQuery` selectors trivial and consistent.
- `DELETE` returns `200` with `{ "success": true }`.

### 2.3 Dates, times, timestamps
- **Date:** `YYYY-MM-DD` (string). DB type `date`.
- **Time of day:** `HH:mm` 24-hour (string, e.g. `"09:00"`). DB type `text`/`varchar(5)`.
- **Timestamps** (`created_at`, `updated_at`, `reminder_time`, `remind_at`): **RFC3339**
  string in JSON (`2026-06-18T09:00:00Z`); DB type `timestamptz`.
- Timezone: store UTC; display in Asia/Baku (UTC+4) client-side.

### 2.4 Day-section computation (tour detail)
- Day sections in the tour detail timeline are computed **CLIENT-SIDE** from
  `start_date`/`end_date`. Label format: `"{n}-ci gün — {gün} {AyAdı}"`
  (e.g. `"1-ci gün — 18 İyun"`). The ordinal suffix follows Azerbaijani vowel harmony;
  the dictionary provides a helper map (§9.10). Events are bucketed into a day by `event.date`.

### 2.5 IDs
- All primary keys are **UUID v4** strings.

### 2.6 Auth transport
- `Authorization: Bearer <jwt>` header on every protected request.

---

## 3. Folder Trees

### 3.1 Backend (`/backend`)
```
backend/
├── Dockerfile
├── .env                       # (gitignored) copied from .env.example
├── .env.example
├── go.mod
├── go.sum
├── cmd/
│   └── server/
│       └── main.go            # entrypoint: load config, connect db, migrate, seed, wire router, start bot
├── internal/
│   ├── config/
│   │   └── config.go          # env parsing into Config struct
│   ├── database/
│   │   ├── database.go        # GORM connect + pool
│   │   └── migrate.go         # run migrations/*.sql + GORM AutoMigrate fallback + seed admin
│   ├── models/
│   │   ├── user.go
│   │   ├── tour.go
│   │   ├── event.go
│   │   ├── attachment.go
│   │   ├── telegram_message.go
│   │   └── reminder.go
│   ├── repository/
│   │   ├── user_repository.go
│   │   ├── tour_repository.go
│   │   ├── event_repository.go
│   │   ├── attachment_repository.go
│   │   ├── telegram_repository.go
│   │   └── reminder_repository.go
│   ├── service/
│   │   ├── auth_service.go
│   │   ├── tour_service.go
│   │   ├── event_service.go
│   │   ├── dashboard_service.go
│   │   ├── calendar_service.go
│   │   ├── search_service.go
│   │   └── ai_service.go      # OpenAI client wrapper (placeholder pipeline)
│   ├── handler/
│   │   ├── auth_handler.go
│   │   ├── tour_handler.go
│   │   ├── event_handler.go
│   │   ├── dashboard_handler.go
│   │   ├── calendar_handler.go
│   │   ├── search_handler.go
│   │   ├── ai_handler.go
│   │   └── telegram_handler.go
│   ├── middleware/
│   │   ├── auth.go            # AuthRequired (JWT)
│   │   ├── error.go           # central error -> Azerbaijani JSON
│   │   └── logging.go         # structured request logging (optional thin wrapper over Fiber logger)
│   ├── router/
│   │   └── router.go          # mounts /api groups + middleware
│   ├── ai/
│   │   ├── client.go          # ChatGPT call [PLACEHOLDER boundary]
│   │   ├── whisper.go         # voice transcription [PLACEHOLDER boundary]
│   │   └── intent.go          # intent detection + action mapping [PLACEHOLDER boundary]
│   └── telegram/
│       ├── bot.go             # bot init, mode switch (webhook|polling)
│       ├── poller.go          # long-polling goroutine
│       ├── webhook.go         # webhook update parsing
│       ├── security.go        # TELEGRAM_ALLOWED_USER_ID enforcement
│       ├── commands.go        # /start /help /today /tomorrow /tours /active
│       └── dispatcher.go      # update -> command/free-text/voice routing + logging
├── pkg/
│   └── apperror/
│       └── apperror.go        # structured error type with code + Azerbaijani message
└── migrations/
    ├── 0001_init.sql          # users, tours, events, attachments, telegram_messages, reminders + indexes + enums
    └── 0002_seed_admin.sql    # (optional) admin seed; primary seed path is code in migrate.go
```

### 3.2 Frontend (`/frontend`)
```
frontend/
├── Dockerfile
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json            # shadcn config
├── public/
│   └── (icons, og image)
└── src/
    ├── app/
    │   ├── layout.tsx          # root: fonts, Providers, <body> tokens
    │   ├── globals.css         # Tailwind layers + CSS variables (design tokens §8)
    │   ├── providers.tsx       # QueryClientProvider + AuthProvider + Toaster
    │   ├── loading.tsx         # global loading screen
    │   ├── not-found.tsx       # Azerbaijani 404
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx     # Giriş
    │   └── (app)/              # protected group (route guard in layout)
    │       ├── layout.tsx       # shell: desktop sidebar / mobile bottom-nav + FAB
    │       ├── page.tsx         # Ana səhifə (dashboard) — route "/"
    │       ├── tours/
    │       │   ├── page.tsx         # Turlar (list)
    │       │   ├── new/page.tsx     # Yeni tur
    │       │   └── [id]/page.tsx    # Tur təfərrüatı (timeline + day sections)
    │       ├── calendar/page.tsx    # Təqvim
    │       ├── search/page.tsx      # Axtarış
    │       ├── ai/page.tsx          # AI Köməkçi (chat + history)
    │       └── settings/page.tsx    # Tənzimləmələr
    ├── components/
    │   ├── ui/                  # hand-written shadcn primitives
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── textarea.tsx
    │   │   ├── select.tsx
    │   │   ├── dialog.tsx
    │   │   ├── sheet.tsx        # bottom sheet (mobile create/edit)
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── toast.tsx / toaster.tsx
    │   │   ├── tabs.tsx
    │   │   ├── calendar.tsx
    │   │   └── empty-state.tsx
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   ├── bottom-nav.tsx
    │   │   ├── fab.tsx
    │   │   └── topbar.tsx       # glass sticky header
    │   ├── tours/
    │   │   ├── tour-card.tsx
    │   │   ├── tour-form.tsx
    │   │   └── tour-status-badge.tsx
    │   ├── events/
    │   │   ├── event-item.tsx
    │   │   ├── event-form.tsx
    │   │   ├── event-type-icon.tsx
    │   │   └── timeline.tsx
    │   ├── dashboard/
    │   │   ├── stat-card.tsx
    │   │   ├── today-list.tsx
    │   │   └── telegram-status.tsx
    │   └── motion/
    │       └── page-transition.tsx
    ├── lib/
    │   ├── api/
    │   │   ├── axios.ts         # Axios instance (baseURL = NEXT_PUBLIC_API_URL, token interceptor)
    │   │   ├── auth.ts
    │   │   ├── tours.ts
    │   │   ├── events.ts
    │   │   ├── dashboard.ts
    │   │   ├── calendar.ts
    │   │   ├── search.ts
    │   │   └── ai.ts
    │   ├── hooks/               # TanStack Query hooks (useTours, useTour, useDashboard, ...)
    │   ├── i18n/
    │   │   └── az.ts            # THE Azerbaijani dictionary (§9)
    │   ├── auth/
    │   │   └── auth-context.tsx
    │   ├── utils/
    │   │   ├── cn.ts
    │   │   ├── date.ts          # day-section + Azerbaijani month/weekday formatting
    │   │   └── format.ts        # price/currency/status mapping helpers
    │   └── types/
    │       └── index.ts         # snake_case TS interfaces mirroring API
    └── styles/                  # (if any extra) — tokens live in globals.css
```

---

## 4. Database Schema (PostgreSQL)

Enums are implemented as **Postgres ENUM types** (preferred) OR `varchar` + `CHECK`
constraint — builders MUST use ENUM types named below. UUIDs default via
`gen_random_uuid()` (enable `pgcrypto`). All `created_at`/`updated_at` default `now()`.

### 4.1 Enum types
```sql
CREATE TYPE user_role        AS ENUM ('admin');
CREATE TYPE tour_status      AS ENUM ('planned','active','completed','cancelled');
CREATE TYPE event_type       AS ENUM ('transfer','hotel','restaurant','tour','flight','note','other');
CREATE TYPE event_status     AS ENUM ('planned','done','cancelled');
CREATE TYPE payment_status   AS ENUM ('unpaid','partial','paid');
CREATE TYPE event_source     AS ENUM ('manual','telegram','ai');
CREATE TYPE tg_direction     AS ENUM ('in','out');
CREATE TYPE tg_kind          AS ENUM ('text','voice','photo','document','command');
```

### 4.2 `users`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| username | text | NO | — | **UNIQUE** |
| password_hash | text | NO | — | bcrypt |
| role | user_role | NO | 'admin' | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

Indexes: `UNIQUE(username)`.

### 4.3 `tours`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| title | text | NO | — | |
| start_date | date | NO | — | |
| end_date | date | NO | — | `>= start_date` |
| description | text | YES | NULL | |
| status | tour_status | NO | 'planned' | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

Indexes: `idx_tours_status(status)`, `idx_tours_start_date(start_date)`.

### 4.4 `events`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| tour_id | uuid | NO | — | FK → tours(id) ON DELETE CASCADE |
| title | text | NO | — | |
| type | event_type | NO | 'other' | |
| date | date | NO | — | |
| time | varchar(5) | YES | NULL | `HH:mm` |
| location | text | YES | NULL | |
| participants | text | YES | NULL | free text / names (OPTIONAL) |
| phone | text | YES | NULL | |
| price | numeric(12,2) | YES | NULL | |
| currency | varchar(8) | YES | NULL | e.g. `AZN`, `USD`, `EUR` |
| payment_status | payment_status | YES | NULL | |
| reminder_time | timestamptz | YES | NULL | |
| attachment | text | YES | NULL | quick url/text field (mirrors attachments) |
| notes | text | YES | NULL | |
| status | event_status | NO | 'planned' | |
| source | event_source | NO | 'manual' | manual\|telegram\|ai |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

Indexes: `idx_events_tour_id(tour_id)`, `idx_events_date(date)`,
`idx_events_type(type)`, `idx_events_status(status)`.

### 4.5 `attachments`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| event_id | uuid | NO | — | FK → events(id) ON DELETE CASCADE |
| url | text | NO | — | path or url |
| kind | text | YES | NULL | e.g. `image`,`document`,`voice` |
| created_at | timestamptz | NO | now() | |

Indexes: `idx_attachments_event_id(event_id)`.

### 4.6 `telegram_messages`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| telegram_user_id | bigint | NO | — | sender/recipient TG id |
| direction | tg_direction | NO | — | in\|out |
| kind | tg_kind | NO | — | text\|voice\|photo\|document\|command |
| content | text | YES | NULL | message text/command |
| transcript | text | YES | NULL | voice transcription (Whisper) |
| intent | text | YES | NULL | detected intent label |
| raw_json | jsonb | YES | NULL | full Telegram Update / API payload |
| created_at | timestamptz | NO | now() | |

Indexes: `idx_tg_created_at(created_at DESC)`, `idx_tg_user(telegram_user_id)`.
Powers the web **AI history** view.

### 4.7 `reminders`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| event_id | uuid | YES | NULL | FK → events(id) ON DELETE CASCADE (nullable) |
| remind_at | timestamptz | NO | — | |
| message | text | NO | — | Azerbaijani reminder text |
| sent | boolean | NO | false | |
| created_at | timestamptz | NO | now() | |

Indexes: `idx_reminders_remind_at(remind_at)`, `idx_reminders_sent(sent)`.

---

## 5. Error Shape & Codes

All non-2xx responses:
```json
{ "error": { "code": "STRING_CODE", "message": "Azərbaycanca mesaj" } }
```

| HTTP | code | message (AZ) |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `Daxil edilən məlumat yanlışdır.` |
| 400 | `BAD_REQUEST` | `Sorğu yanlışdır.` |
| 401 | `UNAUTHORIZED` | `Giriş tələb olunur.` |
| 401 | `INVALID_CREDENTIALS` | `İstifadəçi adı və ya şifrə yanlışdır.` |
| 401 | `TOKEN_EXPIRED` | `Sessiyanın vaxtı bitib. Yenidən daxil olun.` |
| 403 | `FORBIDDEN` | `Bu əməliyyata icazəniz yoxdur.` |
| 403 | `TELEGRAM_NOT_ALLOWED` | `Bu bota yalnız sahib istifadə edə bilər.` |
| 404 | `NOT_FOUND` | `Tapılmadı.` |
| 404 | `TOUR_NOT_FOUND` | `Tur tapılmadı.` |
| 404 | `EVENT_NOT_FOUND` | `Event tapılmadı.` |
| 409 | `CONFLICT` | `Məlumat artıq mövcuddur.` |
| 422 | `UNPROCESSABLE` | `Məlumat emal edilə bilmədi.` |
| 500 | `INTERNAL_ERROR` | `Daxili xəta baş verdi. Bir az sonra yenidən cəhd edin.` |

Validation errors MAY include a `fields` array inside `error`:
`{"error":{"code":"VALIDATION_ERROR","message":"...","fields":[{"field":"title","message":"Başlıq tələb olunur."}]}}`.

---

## 6. API Reference (all under `/api`)

> All `created_at`/`updated_at` are RFC3339 strings. Optional fields may be `null`.
> Protected = requires `Authorization: Bearer <token>`. Telegram webhook is unauthenticated
> by JWT but protected by `TELEGRAM_ALLOWED_USER_ID`.

### 6.1 Auth

#### POST `/auth/login` — public
Request:
```json
{ "username": "admin", "password": "admin123" }
```
Response `200`:
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "uuid", "username": "admin", "role": "admin",
            "created_at": "2026-06-18T08:00:00Z", "updated_at": "2026-06-18T08:00:00Z" }
}
```
Errors: `401 INVALID_CREDENTIALS`, `400 VALIDATION_ERROR`.

#### GET `/auth/me` — protected
Response `200`: the `user` object (bare, same shape as above, no `password_hash`).

#### POST `/auth/logout` — protected
Response `200`: `{ "success": true }`. (Stateless JWT; client discards token.)

---

### 6.2 Dashboard

#### GET `/dashboard` — protected
Composite response `200`:
```json
{
  "today_events": [ { /* Event */ } ],
  "upcoming_events": [ { /* Event */ } ],
  "upcoming_tours": [ { /* Tour */ } ],
  "active_tours": [ { /* Tour */ } ],
  "total_active_tours": 2,
  "events_waiting_today": 3,
  "today_reminders": [
    { "id": "uuid", "event_id": "uuid", "remind_at": "2026-06-18T07:00:00Z",
      "message": "Hilton transferi 1 saata", "sent": false,
      "created_at": "2026-06-17T20:00:00Z" }
  ],
  "recent_activity": [
    { "id": "uuid", "kind": "event_created", "source": "telegram",
      "title": "Transfer əlavə edildi", "ref_id": "uuid",
      "created_at": "2026-06-18T06:30:00Z" }
  ],
  "telegram_status": {
    "connected": true,
    "mode": "polling",
    "allowed_user_configured": true,
    "last_message_at": "2026-06-18T06:30:00Z"
  },
  "weather": {
    "available": false,
    "location": "Bakı",
    "temp_c": null,
    "condition": null,
    "note": "Hava məlumatı tezliklə əlavə olunacaq."
  }
}
```
Field semantics:
- `today_events`: events where `date == today` (guide's local date), ordered by `time`.
- `upcoming_events`: next events with `date > today`, soonest first (cap ~10).
- `upcoming_tours`: tours with `start_date >= today` not yet active, soonest first.
- `active_tours`: tours with `status == 'active'`.
- `total_active_tours`: integer count of active tours.
- `events_waiting_today`: count of today's events with `status == 'planned'`.
- `recent_activity[].kind`: one of `event_created|event_updated|tour_created|telegram_message|ai_message`.
- `weather`: **placeholder** — always `available:false` for MVP.

---

### 6.3 Tours

Tour object:
```json
{
  "id": "uuid",
  "title": "Bakı turu",
  "start_date": "2026-06-18",
  "end_date": "2026-06-22",
  "description": "5 günlük şəhər turu",
  "status": "planned",
  "events_count": 12,
  "created_at": "2026-06-10T10:00:00Z",
  "updated_at": "2026-06-10T10:00:00Z"
}
```
`events_count` is a computed convenience field (integer; `0` if none). `description` may be `null`.

#### GET `/tours?status=&q=` — protected
- `status` (optional): one of tour_status values; filters.
- `q` (optional): case-insensitive match on `title`/`description`.
- Response `200`: `{ "data": [ { /* Tour */ } ] }` (ordered by `start_date` desc).

#### POST `/tours` — protected
Request:
```json
{ "title": "Bakı turu", "start_date": "2026-06-18", "end_date": "2026-06-22",
  "description": "5 günlük şəhər turu", "status": "planned" }
```
- Required: `title`, `start_date`, `end_date`. `status` defaults `planned`. `description` optional.
- Response `201`: the created Tour (bare).

#### GET `/tours/:id` — protected
- Response `200`: Tour (bare). `404 TOUR_NOT_FOUND` if missing.

#### PATCH `/tours/:id` — protected
- Partial body; any subset of `title,start_date,end_date,description,status`.
- Response `200`: updated Tour (bare).

#### DELETE `/tours/:id` — protected
- Cascades to events/attachments. Response `200`: `{ "success": true }`.

---

### 6.4 Events

Event object (matches §4.4 columns, snake_case):
```json
{
  "id": "uuid",
  "tour_id": "uuid",
  "title": "Hava limanı transferi",
  "type": "transfer",
  "date": "2026-06-18",
  "time": "09:00",
  "location": "Heydər Əliyev Hava Limanı",
  "participants": null,
  "phone": "+994501234567",
  "price": 40.00,
  "currency": "AZN",
  "payment_status": "unpaid",
  "reminder_time": "2026-06-18T07:00:00Z",
  "attachment": null,
  "notes": null,
  "status": "planned",
  "source": "manual",
  "created_at": "2026-06-10T10:05:00Z",
  "updated_at": "2026-06-10T10:05:00Z"
}
```

#### GET `/tours/:id/events` — protected
- Response `200`: `{ "data": [ { /* Event */ } ] }`, ordered by `date` then `time`.

#### POST `/tours/:id/events` — protected
Request (only `title`, `type`, `date` required; everything else optional/nullable):
```json
{ "title": "Hava limanı transferi", "type": "transfer", "date": "2026-06-18",
  "time": "09:00", "location": "Hava Limanı", "participants": null, "phone": "+994...",
  "price": 40, "currency": "AZN", "payment_status": "unpaid",
  "reminder_time": "2026-06-18T07:00:00Z", "attachment": null, "notes": null,
  "status": "planned" }
```
- `source` is set server-side (`manual` for web). Response `201`: created Event (bare).

#### GET `/events/:id` — protected
- Response `200`: Event (bare). `404 EVENT_NOT_FOUND`.

#### PATCH `/events/:id` — protected
- Partial body (any subset of editable fields). Response `200`: updated Event (bare).

#### DELETE `/events/:id` — protected
- Response `200`: `{ "success": true }`.

---

### 6.5 Calendar

#### GET `/calendar/events?from=&to=&type=` — protected
- `from`,`to`: `YYYY-MM-DD` (inclusive range; both optional — default current month).
- `type` (optional): event_type filter.
- Response `200`: `{ "data": [ { /* Event */, "tour_title": "Bakı turu" } ] }`.
  Each calendar event includes the parent `tour_title` for display.

---

### 6.6 Search

#### GET `/search?q=` — protected
- `q` required (min 1 char). Case-insensitive match across:
  tour `title`; event `title`, `location`, `participants`, `phone`, `notes`.
- Response `200`:
```json
{
  "data": {
    "tours": [ { /* Tour */ } ],
    "events": [ { /* Event */, "tour_title": "Bakı turu" } ]
  },
  "query": "hilton"
}
```

---

### 6.7 AI

#### POST `/ai/chat` — protected
Request: `{ "message": "Bu gün planım nədir?" }`
Response `200`:
```json
{ "reply": "Bu gün 3 eventiniz var: 09:00 transfer, 13:00 restoran, 19:00 otel qeydiyyatı.",
  "intent": "today_plan",
  "source": "ai" }
```
- For MVP the AI service returns an **Azerbaijani placeholder** reply. It reads
  `OPENAI_API_KEY` from env; if unset, returns a graceful Azerbaijani fallback:
  `"AI hələ konfiqurasiya olunmayıb."` Both inbound and outbound are logged to
  `telegram_messages` (direction `in`/`out`, kind `text`, with `intent`) so the web
  AI history shows web-chat too. (telegram_user_id `0` denotes the web app.)

#### GET `/ai/history` — protected
- Response `200`: `{ "data": [ { /* telegram_message */ } ] }`, newest first (cap ~50).
  Item shape:
```json
{ "id": "uuid", "telegram_user_id": 0, "direction": "in", "kind": "text",
  "content": "Bu gün planım nədir?", "transcript": null, "intent": "today_plan",
  "created_at": "2026-06-18T06:30:00Z" }
```
(`raw_json` is NOT exposed in this view.)

---

### 6.8 Telegram

#### POST `/telegram/webhook` — public route, internally guarded
- Body: a raw **Telegram Update** object (see Telegram Bot API). Minimal accepted shape:
```json
{
  "update_id": 123456,
  "message": {
    "message_id": 10,
    "from": { "id": 555000111, "is_bot": false, "first_name": "Amin" },
    "chat": { "id": 555000111, "type": "private" },
    "date": 1718690000,
    "text": "Bu gün planım nədir?"
  }
}
```
  Voice updates carry `message.voice = { file_id, duration, mime_type }`;
  documents `message.document`; photos `message.photo[]`.
- **Security:** the handler extracts `message.from.id` and compares to
  `TELEGRAM_ALLOWED_USER_ID`. If it does not match, the bot replies politely in
  Azerbaijani (`"Bu bota yalnız sahib istifadə edə bilər."`) and the update is ignored.
- Always responds `200 { "ok": true }` to Telegram quickly (even on rejection) to avoid retries.
- Every inbound update and every outbound reply is logged to `telegram_messages`.

---

## 7. GORM Models (field lists + tags)

> Decisions: `json` keys are snake_case; primary keys are `string` UUIDs with
> `gorm:"type:uuid;default:gen_random_uuid()"`. Use pointers for nullable scalars so
> JSON emits `null` (not zero values). Timestamps are `time.Time`.

### 7.1 User (`internal/models/user.go`)
```go
type User struct {
    ID           string    `json:"id"            gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    Username     string    `json:"username"      gorm:"type:text;uniqueIndex;not null"`
    PasswordHash string    `json:"-"             gorm:"type:text;not null"`
    Role         string    `json:"role"          gorm:"type:user_role;default:'admin';not null"`
    CreatedAt    time.Time `json:"created_at"    gorm:"autoCreateTime"`
    UpdatedAt    time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}
```

### 7.2 Tour (`internal/models/tour.go`)
```go
type Tour struct {
    ID          string    `json:"id"            gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    Title       string    `json:"title"         gorm:"type:text;not null"`
    StartDate   string    `json:"start_date"    gorm:"type:date;not null"`   // YYYY-MM-DD
    EndDate     string    `json:"end_date"      gorm:"type:date;not null"`   // YYYY-MM-DD
    Description *string    `json:"description"   gorm:"type:text"`
    Status      string    `json:"status"        gorm:"type:tour_status;default:'planned';not null"`
    Events      []Event   `json:"-"             gorm:"foreignKey:TourID;constraint:OnDelete:CASCADE"`
    EventsCount int64     `json:"events_count"  gorm:"-"`                     // computed, not stored
    CreatedAt   time.Time `json:"created_at"    gorm:"autoCreateTime"`
    UpdatedAt   time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}
```
> Note: `start_date`/`end_date` are stored as Go `string` to guarantee the exact
> `YYYY-MM-DD` wire format with no timezone drift. Builders MUST validate the format.

### 7.3 Event (`internal/models/event.go`)
```go
type Event struct {
    ID            string     `json:"id"             gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    TourID        string     `json:"tour_id"        gorm:"type:uuid;not null;index"`
    Title         string     `json:"title"          gorm:"type:text;not null"`
    Type          string     `json:"type"           gorm:"type:event_type;default:'other';not null"`
    Date          string     `json:"date"           gorm:"type:date;not null;index"`  // YYYY-MM-DD
    Time          *string    `json:"time"           gorm:"type:varchar(5)"`           // HH:mm
    Location      *string    `json:"location"       gorm:"type:text"`
    Participants  *string    `json:"participants"   gorm:"type:text"`
    Phone         *string    `json:"phone"          gorm:"type:text"`
    Price         *float64   `json:"price"          gorm:"type:numeric(12,2)"`
    Currency      *string    `json:"currency"       gorm:"type:varchar(8)"`
    PaymentStatus *string    `json:"payment_status" gorm:"type:payment_status"`
    ReminderTime  *time.Time `json:"reminder_time"  gorm:"type:timestamptz"`
    Attachment    *string    `json:"attachment"     gorm:"type:text"`
    Notes         *string    `json:"notes"          gorm:"type:text"`
    Status        string     `json:"status"         gorm:"type:event_status;default:'planned';not null"`
    Source        string     `json:"source"         gorm:"type:event_source;default:'manual';not null"`
    CreatedAt     time.Time  `json:"created_at"     gorm:"autoCreateTime"`
    UpdatedAt     time.Time  `json:"updated_at"     gorm:"autoUpdateTime"`
}
```
> `tour_title` (calendar/search) is added at the handler/DTO layer, not on the model.

### 7.4 Attachment (`internal/models/attachment.go`)
```go
type Attachment struct {
    ID        string    `json:"id"         gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    EventID   string    `json:"event_id"   gorm:"type:uuid;not null;index"`
    URL       string    `json:"url"        gorm:"type:text;not null"`
    Kind      *string   `json:"kind"       gorm:"type:text"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
```

### 7.5 TelegramMessage (`internal/models/telegram_message.go`)
```go
type TelegramMessage struct {
    ID             string          `json:"id"               gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    TelegramUserID int64           `json:"telegram_user_id" gorm:"not null;index"`
    Direction      string          `json:"direction"        gorm:"type:tg_direction;not null"`
    Kind           string          `json:"kind"             gorm:"type:tg_kind;not null"`
    Content        *string         `json:"content"          gorm:"type:text"`
    Transcript     *string         `json:"transcript"       gorm:"type:text"`
    Intent         *string         `json:"intent"           gorm:"type:text"`
    RawJSON        json.RawMessage `json:"raw_json,omitempty" gorm:"type:jsonb"`
    CreatedAt      time.Time       `json:"created_at"       gorm:"autoCreateTime;index"`
}
```
> In `/ai/history` the DTO omits `raw_json`.

### 7.6 Reminder (`internal/models/reminder.go`)
```go
type Reminder struct {
    ID        string    `json:"id"         gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    EventID   *string   `json:"event_id"   gorm:"type:uuid;index"`
    RemindAt  time.Time `json:"remind_at"  gorm:"type:timestamptz;not null;index"`
    Message   string    `json:"message"    gorm:"type:text;not null"`
    Sent      bool      `json:"sent"       gorm:"default:false;not null"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
```

---

## 8. Authentication Flow

1. App boots → `migrate.go` runs migrations, then **seeds admin**: if no user with
   `ADMIN_USERNAME` exists, insert one with `password_hash = bcrypt(ADMIN_PASSWORD)`,
   `role='admin'`. This makes real auth a drop-in replacement later (no rework).
2. Client `POST /auth/login` → backend verifies bcrypt → issues **JWT** (HS256) signed
   with `JWT_SECRET`. Claims: `{ "sub": <user_id>, "username": ..., "role": "admin",
   "iat": ..., "exp": ... }`. Expiry: 7 days.
3. Frontend stores token in `localStorage` (`tp_token`) and user in AuthContext.
   Axios request interceptor attaches `Authorization: Bearer <token>`.
4. `AuthRequired` middleware validates the token, loads claims into `c.Locals("user")`.
   Failure → `401 UNAUTHORIZED` (or `TOKEN_EXPIRED`). Axios response interceptor on `401`
   clears token and redirects to `/login`.
5. `POST /auth/logout` is a client-side discard (stateless). `GET /auth/me` re-hydrates user.
6. Route protection: `(app)` route-group layout redirects to `/login` when no valid token.

---

## 9. Azerbaijani String Inventory (`lib/i18n/az.ts`)

> EXHAUSTIVE. The dictionary MUST contain at least all of the following. No English may
> leak to the user. Structure suggestion: a single nested `const az = { ... } as const`.

### 9.1 App / brand
- `app.name`: **"Tur Planlayıcı"**
- `app.tagline`: **"Şəxsi tur planlayıcınız"**

### 9.2 Navigation (sidebar / bottom-nav)
| key | AZ |
|---|---|
| `nav.dashboard` | Ana səhifə |
| `nav.tours` | Turlar |
| `nav.calendar` | Təqvim |
| `nav.search` | Axtarış |
| `nav.ai` | AI Köməkçi |
| `nav.settings` | Tənzimləmələr |

### 9.3 Screen titles
| key | AZ |
|---|---|
| `screen.login` | Giriş |
| `screen.dashboard` | Ana səhifə |
| `screen.tours` | Turlar |
| `screen.tour_new` | Yeni tur |
| `screen.tour_detail` | Tur təfərrüatı |
| `screen.event_new` | Yeni event |
| `screen.event_edit` | Eventi redaktə et |
| `screen.calendar` | Təqvim |
| `screen.search` | Axtarış |
| `screen.ai` | AI Köməkçi |
| `screen.settings` | Tənzimləmələr |

### 9.4 Common actions / buttons
| key | AZ |
|---|---|
| `action.save` | Yadda saxla |
| `action.cancel` | Ləğv et |
| `action.delete` | Sil |
| `action.edit` | Redaktə et |
| `action.create` | Yarat |
| `action.add` | Əlavə et |
| `action.back` | Geri |
| `action.close` | Bağla |
| `action.confirm` | Təsdiqlə |
| `action.search` | Axtar |
| `action.login` | Daxil ol |
| `action.logout` | Çıxış |
| `action.add_tour` | Tur əlavə et |
| `action.add_event` | Event əlavə et |
| `action.view_all` | Hamısına bax |
| `action.send` | Göndər |
| `action.retry` | Yenidən cəhd et |
| `action.today` | Bu gün |
| `action.filter` | Filtr |
| `action.clear` | Təmizlə |

### 9.5 Auth / login
| key | AZ |
|---|---|
| `auth.title` | Xoş gəlmisiniz |
| `auth.subtitle` | Davam etmək üçün daxil olun |
| `auth.username` | İstifadəçi adı |
| `auth.password` | Şifrə |
| `auth.username_placeholder` | İstifadəçi adınızı daxil edin |
| `auth.password_placeholder` | Şifrənizi daxil edin |
| `auth.submit` | Daxil ol |
| `auth.logging_in` | Daxil olunur... |
| `auth.logout_confirm` | Çıxış etmək istədiyinizə əminsiniz? |

### 9.6 Field labels (tours + events)
| key | AZ |
|---|---|
| `field.title` | Başlıq |
| `field.description` | Təsvir |
| `field.start_date` | Başlama tarixi |
| `field.end_date` | Bitmə tarixi |
| `field.date` | Tarix |
| `field.time` | Saat |
| `field.type` | Növ |
| `field.location` | Məkan |
| `field.participants` | İştirakçılar |
| `field.phone` | Telefon |
| `field.price` | Qiymət |
| `field.currency` | Valyuta |
| `field.payment_status` | Ödəniş statusu |
| `field.reminder_time` | Xatırlatma vaxtı |
| `field.attachment` | Əlavə |
| `field.notes` | Qeydlər |
| `field.status` | Status |
| `field.source` | Mənbə |
| `field.optional` | (istəyə bağlı) |

### 9.7 Validation messages
| key | AZ |
|---|---|
| `validation.required` | Bu sahə tələb olunur. |
| `validation.title_required` | Başlıq tələb olunur. |
| `validation.date_required` | Tarix tələb olunur. |
| `validation.start_required` | Başlama tarixi tələb olunur. |
| `validation.end_required` | Bitmə tarixi tələb olunur. |
| `validation.end_after_start` | Bitmə tarixi başlama tarixindən sonra olmalıdır. |
| `validation.invalid_date` | Tarix formatı yanlışdır. |
| `validation.invalid_time` | Saat formatı yanlışdır (SS:DD). |
| `validation.invalid_price` | Qiymət düzgün rəqəm olmalıdır. |
| `validation.min_chars` | Ən azı {n} simvol olmalıdır. |
| `validation.username_required` | İstifadəçi adı tələb olunur. |
| `validation.password_required` | Şifrə tələb olunur. |

### 9.8 Empty states
| key | AZ |
|---|---|
| `empty.tours.title` | Hələ tur yoxdur |
| `empty.tours.subtitle` | İlk turunuzu yaradın və ya Telegram bot vasitəsilə əlavə edin. |
| `empty.events.title` | Bu turda event yoxdur |
| `empty.events.subtitle` | İlk eventi əlavə edin. |
| `empty.today.title` | Bu gün üçün plan yoxdur |
| `empty.today.subtitle` | Bu gün heç bir eventiniz yoxdur. Dincəlin! |
| `empty.calendar.title` | Bu aralıqda event yoxdur |
| `empty.calendar.subtitle` | Başqa tarix aralığı seçin. |
| `empty.search.title` | Nəticə tapılmadı |
| `empty.search.subtitle` | Başqa açar söz ilə yenidən axtarın. |
| `empty.search.idle` | Axtarışa başlamaq üçün yazın. |
| `empty.ai.title` | Söhbət hələ başlamayıb |
| `empty.ai.subtitle` | Aşağıdan sual yazın, məsələn: "Bu gün planım nədir?" |
| `empty.reminders.title` | Xatırlatma yoxdur |
| `empty.activity.title` | Fəaliyyət yoxdur |

### 9.9 Toasts / notifications
| key | AZ |
|---|---|
| `toast.tour_created` | Tur yaradıldı. |
| `toast.tour_updated` | Tur yeniləndi. |
| `toast.tour_deleted` | Tur silindi. |
| `toast.event_created` | Event əlavə edildi. |
| `toast.event_updated` | Event yeniləndi. |
| `toast.event_deleted` | Event silindi. |
| `toast.saved` | Yadda saxlanıldı. |
| `toast.deleted` | Silindi. |
| `toast.error` | Xəta baş verdi. |
| `toast.network_error` | Şəbəkə xətası. İnternet bağlantısını yoxlayın. |
| `toast.login_success` | Xoş gəldiniz! |
| `toast.logout_success` | Çıxış edildi. |
| `toast.copied` | Kopyalandı. |
| `toast.delete_confirm` | Silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz. |

### 9.10 Dashboard
| key | AZ |
|---|---|
| `dashboard.greeting_morning` | Sabahınız xeyir |
| `dashboard.greeting_day` | Salam |
| `dashboard.greeting_evening` | Axşamınız xeyir |
| `dashboard.today_plan` | Bugünkü plan |
| `dashboard.upcoming_events` | Yaxın eventlər |
| `dashboard.upcoming_tours` | Yaxın turlar |
| `dashboard.active_tours` | Aktiv turlar |
| `dashboard.stat_active_tours` | Aktiv turlar |
| `dashboard.stat_today_events` | Bugünkü eventlər |
| `dashboard.stat_waiting` | Gözləyən |
| `dashboard.reminders` | Xatırlatmalar |
| `dashboard.recent_activity` | Son fəaliyyət |
| `dashboard.telegram` | Telegram |
| `dashboard.weather` | Hava |
| `dashboard.weather_soon` | Hava məlumatı tezliklə əlavə olunacaq. |

### 9.11 Telegram status labels
| key | AZ |
|---|---|
| `telegram.connected` | Qoşulub |
| `telegram.disconnected` | Qoşulmayıb |
| `telegram.mode_webhook` | Webhook rejimi |
| `telegram.mode_polling` | Sorğu (polling) rejimi |
| `telegram.last_message` | Son mesaj |

### 9.12 Event type labels + icons (Lucide)
| value | label | icon |
|---|---|---|
| `transfer` | Transfer | `Car` |
| `hotel` | Otel | `BedDouble` |
| `restaurant` | Restoran | `UtensilsCrossed` |
| `tour` | Tur | `Map` |
| `flight` | Uçuş | `Plane` |
| `note` | Qeyd | `StickyNote` |
| `other` | Digər | `CircleEllipsis` |

(dictionary key form: `eventType.transfer = "Transfer"`, …; icon map lives in `event-type-icon.tsx`.)

### 9.13 Event status labels
| value | AZ |
|---|---|
| `planned` | Planlaşdırılıb |
| `done` | Tamamlanıb |
| `cancelled` | Ləğv edilib |

(keys: `eventStatus.planned` etc.)

### 9.14 Tour status labels
| value | AZ |
|---|---|
| `planned` | Planlaşdırılıb |
| `active` | Aktiv |
| `completed` | Tamamlanıb |
| `cancelled` | Ləğv edilib |

(keys: `tourStatus.planned` etc.)

### 9.15 Payment status labels
| value | AZ |
|---|---|
| `unpaid` | Ödənilməyib |
| `partial` | Qismən |
| `paid` | Ödənilib |

(keys: `payment.unpaid` etc.)

### 9.16 Source labels
| value | AZ |
|---|---|
| `manual` | Əl ilə |
| `telegram` | Telegram |
| `ai` | AI |

(keys: `source.manual` etc.)

### 9.17 Calendar — month names (`calendar.months[0..11]`)
`Yanvar, Fevral, Mart, Aprel, May, İyun, İyul, Avqust, Sentyabr, Oktyabr, Noyabr, Dekabr`

Short months (`calendar.monthsShort`): `Yan, Fev, Mar, Apr, May, İyn, İyl, Avq, Sen, Okt, Noy, Dek`

### 9.18 Calendar — weekday names (week starts **Monday**)
Full (`calendar.weekdays[0..6]`):
`Bazar ertəsi, Çərşənbə axşamı, Çərşənbə, Cümə axşamı, Cümə, Şənbə, Bazar`

Short (`calendar.weekdaysShort[0..6]`): `B.e, Ç.a, Ç, C.a, C, Ş, B`

### 9.19 Calendar misc
| key | AZ |
|---|---|
| `calendar.today` | Bu gün |
| `calendar.month` | Ay |
| `calendar.week` | Həftə |
| `calendar.day` | Gün |
| `calendar.next` | Növbəti |
| `calendar.prev` | Əvvəlki |
| `calendar.no_events` | Event yoxdur |

### 9.20 Day-section ordinal (tour detail)
- Format helper `daySectionLabel(n, date)` → `"{n}-{suffix} gün — {d} {AyAdı}"`.
- Azerbaijani ordinal suffixes follow vowel harmony; provide map for 1..31:
  most common forms: 1→`ci`, 2→`ci`, 3→`cü`, 4→`cü`, 5→`ci`, 6→`cı`, 7→`ci`, 8→`ci`,
  9→`cu`, 10→`cu`, 20→`ci`, 30→`cu`. Builders implement a small rule/table; key
  `tour.day_word` = "gün". Example output: `"1-ci gün — 18 İyun"`.

### 9.21 Settings
| key | AZ |
|---|---|
| `settings.account` | Hesab |
| `settings.username` | İstifadəçi adı |
| `settings.role` | Rol |
| `settings.telegram` | Telegram bot |
| `settings.telegram_status` | Bot statusu |
| `settings.about` | Haqqında |
| `settings.version` | Versiya |
| `settings.logout` | Çıxış |
| `settings.language` | Dil |
| `settings.language_value` | Azərbaycan dili |
| `settings.appearance` | Görünüş |
| `settings.theme_light` | İşıqlı |
| `settings.theme_dark` | Qaranlıq |

### 9.22 AI assistant
| key | AZ |
|---|---|
| `ai.title` | AI Köməkçi |
| `ai.placeholder` | Sualınızı yazın... |
| `ai.thinking` | Düşünür... |
| `ai.history` | Tarixçə |
| `ai.not_configured` | AI hələ konfiqurasiya olunmayıb. |
| `ai.example_1` | Bu gün planım nədir? |
| `ai.example_2` | Sabah nə işlərim var? |
| `ai.example_3` | Bakı turunun proqramını göstər. |

### 9.23 Misc / status / loading
| key | AZ |
|---|---|
| `common.loading` | Yüklənir... |
| `common.error_title` | Nə isə səhv getdi |
| `common.error_subtitle` | Xəta baş verdi. Yenidən cəhd edin. |
| `common.not_found_title` | Səhifə tapılmadı |
| `common.not_found_subtitle` | Axtardığınız səhifə mövcud deyil. |
| `common.go_home` | Ana səhifəyə qayıt |
| `common.yes` | Bəli |
| `common.no` | Xeyr |
| `common.all` | Hamısı |
| `common.none` | Yoxdur |
| `common.days` | gün |
| `common.event` | event |
| `common.events` | event |

---

## 10. Telegram Bot Architecture

### 10.1 Security (every update)
1. Extract `from.id` from the incoming update.
2. Compare to `TELEGRAM_ALLOWED_USER_ID`. If unequal → reply politely in Azerbaijani
   (`"Bu bota yalnız sahib istifadə edə bilər."`), log inbound (and the rejection reply)
   to `telegram_messages`, then stop.
3. Only the single allowed user proceeds.

### 10.2 Modes
- `TELEGRAM_MODE=webhook` → Telegram POSTs to `/api/telegram/webhook`; handler parses
  the Update and hands it to `dispatcher`.
- `TELEGRAM_MODE=polling` → `main.go` starts a goroutine (`poller.go`) calling
  `getUpdates` in a loop, feeding the same `dispatcher`.
- Both paths share `dispatcher.Dispatch(update)`. Default local default = `polling`.

### 10.3 Commands (query the real DB; reply in Azerbaijani)
| command | behavior |
|---|---|
| `/start` | Welcome + short capability list. |
| `/help` | List of commands + free-text examples. |
| `/today` | Today's events (ordered by time) → "Bugünkü plan". |
| `/tomorrow` | Tomorrow's events → "Sabahkı plan". |
| `/tours` | All tours with status + date range. |
| `/active` | Active tours only. |

### 10.4 Message logging
Every inbound update AND every outbound reply is persisted to `telegram_messages`
(`direction`, `kind`, `content`, `transcript?`, `intent?`, `raw_json`). This feeds the
web **AI history** view (`GET /ai/history`).

### 10.5 Free-text + voice pipeline (architecture-complete; placeholders marked)
```
Telegram update
   │
   ├─ command?  → commands.go (real DB query) → Azerbaijani reply
   │
   ├─ voice?    → download file
   │               → [PLACEHOLDER] ai/whisper.go: Whisper transcription → transcript
   │
   └─ text/transcript
         → [PLACEHOLDER] ai/client.go: ChatGPT call (reads OPENAI_API_KEY)
         → ai/intent.go: intent detection
               intents: create_tour | add_event | today_plan | tomorrow_plan |
                        list_tours | list_active | filter_events | show_tour_program |
                        find_event | set_event_price | unknown
         → if intent is AMBIGUOUS or required fields missing:
               ASK a clarification question (Azerbaijani). NEVER guess.
         → else: perform backend action via services
               (tours/events created here get source = "telegram" for bot,
                or "ai" when the AI agent itself initiates) 
         → Azerbaijani confirmation reply
```
Placeholder boundaries (MVP returns deterministic Azerbaijani text, no external calls if
keys are absent): `ai/whisper.go`, `ai/client.go`. Intent detection may be a simple
keyword matcher for MVP but lives behind the `ai/intent.go` interface so it can be
swapped for an LLM later with no caller change.

### 10.6 Source attribution
- Web creates → `source = "manual"`.
- Telegram command/free-text creates → `source = "telegram"`.
- AI-agent-initiated creates → `source = "ai"`.

### 10.7 Example intents to support (reference)
- "18-22 iyun üçün Bakı turu yarat." → `create_tour`
- "Sabah saat 9-da transfer əlavə et." → `add_event` (asks which tour if ambiguous)
- "Bu gün planım nədir?" → `today_plan`
- "Sabah nə işlərim var?" → `tomorrow_plan`
- "Bu həftə restoran eventlərini göstər." → `filter_events` (type=restaurant, week range)
- "Bakı turunun proqramını göstər." → `show_tour_program`
- "Hilton harda keçir?" → `find_event`
- "20 iyun restoran 120 manat oldu." → `set_event_price` / update

---

## 11. Design System

### 11.1 Direction
Premium commercial SaaS / iOS feel (Linear, Notion, Arc, Apple, Airbnb). NOT an admin
panel, NOT Bootstrap/Material. Generous whitespace, confident typography, restrained
palette with ONE strong accent, soft layered shadows (not heavy borders), large radii,
glass only on sticky headers/nav, smooth fast motion.

### 11.2 Palette — "Deep Ocean Teal" (the committed accent)
**Accent (primary): `#0E7C86`** (deep ocean teal). Accent hover `#0A5F67`, accent
subtle bg `#E6F4F4`.

Light theme tokens (CSS variables, HSL or hex; hex listed for clarity):
| token | hex | use |
|---|---|---|
| `--background` | `#FAFAF7` | warm near-white app bg |
| `--surface` | `#FFFFFF` | cards/sheets |
| `--surface-muted` | `#F4F4F0` | subtle fills |
| `--foreground` (ink) | `#16181D` | primary text |
| `--muted-foreground` | `#5B616E` | secondary text |
| `--border` | `#E7E7E2` | hairline borders |
| `--accent` | `#0E7C86` | primary actions, links, active |
| `--accent-foreground` | `#FFFFFF` | text on accent |
| `--accent-hover` | `#0A5F67` | accent hover |
| `--accent-subtle` | `#E6F4F4` | accent tint bg |
| `--success` | `#1E9E6A` | paid/done |
| `--warning` | `#C98A00` | partial/waiting |
| `--danger` | `#D14343` | cancelled/delete |
| `--info` | `#2F6FED` | info |
| `--ring` | `#0E7C86` | focus ring |

Dark-mode-ready token names (same variable names, dark values applied under
`.dark` / `[data-theme="dark"]`):
| token | dark hex |
|---|---|
| `--background` | `#0C0E12` |
| `--surface` | `#14171D` |
| `--surface-muted` | `#1B1F27` |
| `--foreground` | `#F2F3F5` |
| `--muted-foreground` | `#9AA2B1` |
| `--border` | `#262B34` |
| `--accent` | `#2BB6BE` |
| `--accent-foreground` | `#06262A` |
| `--accent-hover` | `#46C7CE` |
| `--accent-subtle` | `#0E2B2E` |

Status → token mapping: tour/event `done`/`completed`/`paid` → success;
`planned` → muted/accent-subtle; `partial`/waiting → warning; `cancelled`/`unpaid`→danger.

### 11.3 Typography
- Font stack: **Geist** (preferred) with fallback to **Inter**, then system:
  `var(--font-geist), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Headings: tight tracking (`letter-spacing: -0.02em` on h1/h2).
- Type scale (rem / px @16):
| token | size | line-height | weight | use |
|---|---|---|---|---|
| `text-display` | 2.5rem/40 | 1.1 | 700 | hero/login title |
| `text-h1` | 2rem/32 | 1.15 | 700 | screen title |
| `text-h2` | 1.5rem/24 | 1.2 | 600 | section |
| `text-h3` | 1.25rem/20 | 1.3 | 600 | card title |
| `text-body` | 1rem/16 | 1.5 | 400 | body |
| `text-sm` | 0.875rem/14 | 1.45 | 400 | secondary |
| `text-xs` | 0.75rem/12 | 1.4 | 500 | labels/badges |

### 11.4 Spacing scale (Tailwind-aligned, base 4px)
`0, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80`.
Default page padding: 16 mobile / 24–32 desktop. Card padding: 20–24.

### 11.5 Radius scale
| token | value | use |
|---|---|---|
| `--radius-sm` | 8px | badges, small chips |
| `--radius-md` (xl) | 12px | inputs, buttons, controls |
| `--radius-lg` (2xl) | 16px | cards, sheets |
| `--radius-xl` | 24px | large feature cards / modals |
| `--radius-full` | 9999px | pills, avatars, FAB |

Controls = `rounded-xl` (12). Cards = `rounded-2xl` (16).

### 11.6 Elevation / shadow scale (soft, layered — light theme)
| token | value |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(16,24,40,0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)` |
| `--shadow-md` | `0 4px 12px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.04)` |
| `--shadow-lg` | `0 12px 28px rgba(16,24,40,0.12), 0 4px 8px rgba(16,24,40,0.06)` |
| `--shadow-glass` | `0 8px 32px rgba(16,24,40,0.10)` + `backdrop-filter: blur(12px)` |

Cards default `--shadow-sm`, hover lift → `--shadow-md` (desktop only). Sheets/modals `--shadow-lg`.

### 11.7 Motion (durations + easings)
| token | value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | 150ms (taps, hovers, button press) |
| `--dur-base` | 220ms (most transitions, page fades) |
| `--dur-slow` | 320ms (sheets, modals) |
| spring (sheets) | Framer `{ type: "spring", stiffness: 380, damping: 32 }` |
| list stagger | 40ms per item, reveal `opacity 0→1, y 8→0` over base |

Micro-interactions:
- Button press: `scale: 0.97` over fast.
- Card hover (desktop): `y: -2px` + shadow-sm→md over base.
- Tap feedback (mobile): subtle `scale: 0.98` + opacity.
- Skeletons everywhere during fetch; page transitions via Framer Motion fade/slide.
- Tasteful full-screen loading screen with brand mark on first load.

### 11.8 Button hierarchy & component variants
Button variants:
| variant | look |
|---|---|
| `primary` | accent bg, white text, shadow-xs, hover accent-hover |
| `secondary` | surface bg, border, ink text, hover surface-muted |
| `ghost` | transparent, ink text, hover surface-muted |
| `destructive` | danger bg/white text (or danger text ghost for soft) |
| `link` | accent text, underline on hover |
Sizes: `sm` (h-9), `md` (h-10, default), `lg` (h-12), `icon` (square). All `rounded-xl`.

Other component variants:
- **Card**: `rounded-2xl`, surface bg, border hairline, shadow-sm.
- **Badge**: `rounded-full`, `text-xs`, status-colored (subtle bg + colored text).
- **Input/Select/Textarea**: `rounded-xl`, border, focus ring accent, h-10.
- **Sheet** (mobile): bottom, spring in, drag-handle, `rounded-t-2xl`.
- **Dialog** (desktop): centered, `rounded-2xl`, shadow-lg, backdrop blur.
- **EmptyState**: centered icon (muted), AZ title + subtitle + optional action.
- **Skeleton**: `surface-muted` shimmer, matches the shape it replaces.

### 11.9 Layout
- **Desktop**: fixed left **sidebar** (nav §9.2), glass sticky **topbar**, content max-width
  ~`1200px`, two-column / split timeline on tour detail, large professional calendar.
- **Mobile**: **bottom navigation** (5 items), **floating action button** (FAB) for quick
  create, **bottom sheets** for create/edit, large touch targets (min 44px), swipe affordances.

---

## 12. Frontend Route Map (App Router)

| Path | Screen (AZ) | Notes |
|---|---|---|
| `/login` | Giriş | public; redirect to `/` if already authed |
| `/` | Ana səhifə | dashboard; protected |
| `/tours` | Turlar | list + status filter + search |
| `/tours/new` | Yeni tur | create form (sheet on mobile) |
| `/tours/[id]` | Tur təfərrüatı | timeline w/ client-side day sections |
| `/calendar` | Təqvim | month calendar + type filter |
| `/search` | Axtarış | global search |
| `/ai` | AI Köməkçi | chat + history (`/ai/history`) |
| `/settings` | Tənzimləmələr | account, telegram status, theme, logout |

All `(app)` routes are guarded by the auth layout; unauthenticated → `/login`.

---

## 13. Build / Run

- `docker compose up --build` → db (5432), backend (8080), frontend (3000).
- Backend reads `backend/.env`; frontend reads `frontend/.env`.
- First boot: migrations run, admin (`admin`/`admin123`) seeded.
- Health: backend exposes `GET /api/health` → `{ "status": "ok" }` (add to router).

---

## 14. Definition of Done (per builder)

- All JSON keys snake_case; lists wrapped in `{ "data": [...] }`; items bare; errors in
  the AZ error shape.
- Zero English in any user-facing string (web + bot). Dictionary §9 fully populated.
- Optional/nullable fields emit `null`, never zero values.
- Telegram bot enforces `TELEGRAM_ALLOWED_USER_ID` on every update and logs all messages.
- Design tokens (§11) implemented as CSS variables; components consume tokens (no hardcoded hex in components).
- Works perfectly with zero participant names.
