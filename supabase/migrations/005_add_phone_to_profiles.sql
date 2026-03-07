-- Migration: Add phone field to profiles table
-- Created: 2026-03-07
-- Description: Add optional phone field for 2FA WhatsApp integration

-- Add phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone IS 'Optional phone number for 2FA via WhatsApp';

-- Create index for phone lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
