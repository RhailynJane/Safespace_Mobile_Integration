-- Add UNIQUE constraint to clerk_user_id in the users table
ALTER TABLE users
ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);
