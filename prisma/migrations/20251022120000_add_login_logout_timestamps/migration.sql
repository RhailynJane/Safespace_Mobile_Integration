-- Alter users table to add login/logout timestamp columns
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_logout_at" TIMESTAMP(3);
