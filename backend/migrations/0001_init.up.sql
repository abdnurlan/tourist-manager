-- 0001_init.up.sql — enums, extensions, six tables + indexes (CONTRACT.md §4)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum types
DO $$ BEGIN CREATE TYPE user_role      AS ENUM ('admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tour_status    AS ENUM ('planned','active','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE event_type     AS ENUM ('transfer','hotel','restaurant','tour','flight','note','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE event_status   AS ENUM ('planned','done','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('unpaid','partial','paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE event_source   AS ENUM ('manual','telegram','ai'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tg_direction   AS ENUM ('in','out'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tg_kind        AS ENUM ('text','voice','photo','document','command'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- users
CREATE TABLE IF NOT EXISTS users (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      text        NOT NULL,
    password_hash text        NOT NULL,
    role          user_role   NOT NULL DEFAULT 'admin',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- tours
CREATE TABLE IF NOT EXISTS tours (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text        NOT NULL,
    start_date  date        NOT NULL,
    end_date    date        NOT NULL,
    description text,
    status      tour_status NOT NULL DEFAULT 'planned',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tours_status     ON tours (status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON tours (start_date);

-- events
CREATE TABLE IF NOT EXISTS events (
    id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id        uuid           NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    title          text           NOT NULL,
    type           event_type     NOT NULL DEFAULT 'other',
    date           date           NOT NULL,
    time           varchar(5),
    location       text,
    participants   text,
    phone          text,
    price          numeric(12,2),
    currency       varchar(8),
    payment_status payment_status,
    reminder_time  timestamptz,
    attachment     text,
    notes          text,
    status         event_status   NOT NULL DEFAULT 'planned',
    source         event_source   NOT NULL DEFAULT 'manual',
    created_at     timestamptz    NOT NULL DEFAULT now(),
    updated_at     timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_tour_id ON events (tour_id);
CREATE INDEX IF NOT EXISTS idx_events_date    ON events (date);
CREATE INDEX IF NOT EXISTS idx_events_type    ON events (type);
CREATE INDEX IF NOT EXISTS idx_events_status  ON events (status);

-- attachments
CREATE TABLE IF NOT EXISTS attachments (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url        text        NOT NULL,
    kind       text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_event_id ON attachments (event_id);

-- telegram_messages
CREATE TABLE IF NOT EXISTS telegram_messages (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id bigint       NOT NULL,
    direction        tg_direction NOT NULL,
    kind             tg_kind      NOT NULL,
    content          text,
    transcript       text,
    intent           text,
    raw_json         jsonb,
    created_at       timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tg_created_at ON telegram_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tg_user       ON telegram_messages (telegram_user_id);

-- reminders
CREATE TABLE IF NOT EXISTS reminders (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid        REFERENCES events(id) ON DELETE CASCADE,
    remind_at  timestamptz NOT NULL,
    message    text        NOT NULL,
    sent       boolean     NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders (remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_sent      ON reminders (sent);
