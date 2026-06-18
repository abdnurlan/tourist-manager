-- 0002_seed_admin.down.sql — remove the seeded admin user.

DELETE FROM users WHERE role = 'admin';
