-- 0002_seed_admin.up.sql — optional admin seed.
-- NOTE: the PRIMARY seed path is code in internal/database/migrate.go (SeedAdmin),
-- which bcrypt-hashes ADMIN_PASSWORD at boot. This file is a no-op placeholder so the
-- migration pair exists; password hashing cannot be done portably in pure SQL.
-- Intentionally left without an INSERT to avoid storing a plaintext/!invalid hash.

SELECT 1;
