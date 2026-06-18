-- 0001_init.down.sql — drop everything created in 0001_init.up.sql

DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS telegram_messages;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS tours;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS tg_kind;
DROP TYPE IF EXISTS tg_direction;
DROP TYPE IF EXISTS event_source;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS event_status;
DROP TYPE IF EXISTS event_type;
DROP TYPE IF EXISTS tour_status;
DROP TYPE IF EXISTS user_role;
