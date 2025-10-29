-- =============================================
-- MIGRATE users.status FROM VARCHAR TO ENUM
-- =============================================
-- This migration converts the users.status column from text/varchar to the UserStatus enum type
-- to match the Prisma schema and enable proper type safety in queries.

-- Step 1: Ensure the UserStatus enum exists (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');
        RAISE NOTICE 'Created UserStatus enum type';
    ELSE
        RAISE NOTICE 'UserStatus enum type already exists';
    END IF;
END $$;

-- Step 2: Update any invalid status values to 'active' (safety measure)
UPDATE users 
SET status = 'active' 
WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended', 'pending');

-- Step 3: Drop the default constraint first (it references the old VARCHAR type)
ALTER TABLE users 
ALTER COLUMN status DROP DEFAULT;

-- Step 4: Alter the column type from VARCHAR to UserStatus enum
-- Using USING clause to cast existing text values to the enum
ALTER TABLE users 
ALTER COLUMN status TYPE "UserStatus" 
USING status::"UserStatus";

-- Step 5: Re-add the default constraint with proper enum casting
ALTER TABLE users 
ALTER COLUMN status SET DEFAULT 'active'::"UserStatus";

-- Step 6: Verify the migration
DO $$ 
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'status';
    
    IF column_type = 'USER-DEFINED' THEN
        RAISE NOTICE 'Migration successful: users.status is now UserStatus enum';
    ELSE
        RAISE WARNING 'Migration may have failed: users.status type is %', column_type;
    END IF;
END $$;

-- Step 7: Show current status distribution
SELECT status, COUNT(*) as count
FROM users
GROUP BY status
ORDER BY count DESC;
