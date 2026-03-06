-- ============================================================
-- Migration Part 2: Add User Permissions Column
-- EXECUTE THIS AFTER 002_add_client_manager_enum.sql
-- ============================================================

-- Add permissions column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "canViewCentral": true,
  "canViewAttendances": true,
  "canViewContacts": true,
  "canSendBulk": false,
  "canViewKanban": false,
  "canManageConnection": false,
  "canManageUsers": false,
  "canViewSettings": true
}'::jsonb;

-- Create index on permissions for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles USING GIN (permissions);

-- ============================================================
-- Functions for Permission Management
-- ============================================================

-- Function to check if current user is admin of the same company
CREATE OR REPLACE FUNCTION is_company_admin(p_target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_company_id UUID;
  v_target_user_company_id UUID;
  v_current_user_role user_role;
BEGIN
  -- Get current user's info
  SELECT company_id, role INTO v_current_user_company_id, v_current_user_role
  FROM profiles WHERE user_id = auth.uid();
  
  -- Super users can manage anyone
  IF v_current_user_role = 'SUPER_USER' THEN
    RETURN true;
  END IF;
  
  -- Only admins can manage permissions
  IF v_current_user_role != 'CLIENT_ADMIN' THEN
    RETURN false;
  END IF;
  
  -- Get target user's company
  SELECT company_id INTO v_target_user_company_id
  FROM profiles WHERE id = p_target_user_id;
  
  -- Must be same company
  RETURN v_current_user_company_id = v_target_user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user permissions (only admin or super user)
CREATE OR REPLACE FUNCTION update_user_permissions(
  p_user_id UUID,
  p_permissions JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has permission to update
  IF NOT is_company_admin(p_user_id) THEN
    RETURN false;
  END IF;
  
  -- Update permissions
  UPDATE profiles 
  SET permissions = p_permissions,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update RLS Policies
-- ============================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can update profiles in their company" ON profiles;

-- New policy: Allow admins to update any profile in their company
DROP POLICY IF EXISTS "Admins can manage profiles in their company" ON profiles;

CREATE POLICY "Admins can manage profiles in their company" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'SUPER_USER'
    )
    OR 
    (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'CLIENT_ADMIN'
        AND p.company_id = profiles.company_id
      )
      AND profiles.role != 'SUPER_USER'
    )
    OR profiles.user_id = auth.uid()
  );

-- Policy: Users can view profiles in their company (drop and recreate)
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;

CREATE POLICY "Users can view profiles in their company" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = profiles.company_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'SUPER_USER'
    )
  );

-- ============================================================
-- Update Existing Profiles with Default Permissions
-- ============================================================

-- Set default permissions based on role for existing users
UPDATE profiles 
SET permissions = '{
  "canViewCentral": true,
  "canViewAttendances": true,
  "canViewContacts": true,
  "canSendBulk": true,
  "canViewKanban": true,
  "canManageConnection": true,
  "canManageUsers": true,
  "canViewSettings": true
}'::jsonb
WHERE role = 'CLIENT_ADMIN' AND (permissions IS NULL OR permissions = '{}');

UPDATE profiles 
SET permissions = '{
  "canViewCentral": true,
  "canViewAttendances": true,
  "canViewContacts": true,
  "canSendBulk": false,
  "canViewKanban": true,
  "canManageConnection": false,
  "canManageUsers": false,
  "canViewSettings": true
}'::jsonb
WHERE role = 'CLIENT_MANAGER' AND (permissions IS NULL OR permissions = '{}');

UPDATE profiles 
SET permissions = '{
  "canViewCentral": true,
  "canViewAttendances": true,
  "canViewContacts": true,
  "canSendBulk": false,
  "canViewKanban": false,
  "canManageConnection": false,
  "canManageUsers": false,
  "canViewSettings": true
}'::jsonb
WHERE role = 'CLIENT_AGENT' AND (permissions IS NULL OR permissions = '{}');

-- ============================================================
-- Audit Log for Permission Changes
-- ============================================================

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_permissions JSONB,
  new_permissions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only company admins can view audit logs
DROP POLICY IF EXISTS "Company admins can view permission audit logs" ON permission_audit_logs;

CREATE POLICY "Company admins can view permission audit logs" ON permission_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND (
        p.role = 'SUPER_USER' 
        OR (p.role = 'CLIENT_ADMIN' AND p.company_id = (
          SELECT company_id FROM profiles WHERE id = permission_audit_logs.user_id
        ))
      )
    )
  );

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_created_at ON permission_audit_logs(created_at);

-- Function to log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.permissions IS DISTINCT FROM NEW.permissions THEN
    INSERT INTO permission_audit_logs (user_id, changed_by, old_permissions, new_permissions)
    VALUES (NEW.id, auth.uid(), OLD.permissions, NEW.permissions);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for permission audit
DROP TRIGGER IF EXISTS on_permission_change ON profiles;
CREATE TRIGGER on_permission_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.permissions IS DISTINCT FROM NEW.permissions)
  EXECUTE FUNCTION log_permission_change();
