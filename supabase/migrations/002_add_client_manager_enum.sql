-- ============================================================
-- Migration Part 1: Add CLIENT_MANAGER to user_role enum
-- EXECUTE THIS FIRST
-- ============================================================

-- Add CLIENT_MANAGER to user_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CLIENT_MANAGER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'CLIENT_MANAGER';
  END IF;
END $$;

-- Verify the enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
