-- ============================================================
-- Script de Diagnóstico e Correção de Problemas de Login
-- Execute este script para verificar e corrigir problemas comuns
-- ============================================================

-- 1. VERIFICAR SE O USUÁRIO EXISTE NO AUTH E NO PROFILES
-- Substitua 'email@exemplo.com' pelo seu email real
SELECT 
  au.id as auth_user_id,
  au.email,
  au.user_metadata,
  au.last_sign_in_at,
  p.id as profile_id,
  p.role,
  p.company_id,
  p.is_active,
  p.permissions,
  CASE 
    WHEN s.id IS NOT NULL THEN 'SUPER_USER'
    ELSE p.role::text
  END as effective_role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN super_users s ON au.id = s.id
WHERE au.email = 'email@exemplo.com';  -- <-- MUDE AQUI

-- 2. SE O USUÁRIO NÃO TIVER PROFILE, CRIE UM (para usuários de empresa)
-- INSERT INTO profiles (user_id, email, role, company_id, full_name)
-- VALUES (
--   'USER_ID_DO_AUTH',
--   'email@exemplo.com',
--   'CLIENT_ADMIN',
--   'COMPANY_ID_AQUI',
--   'Nome do Usuário'
-- );

-- 3. PARA TORNAR UM USUÁRIO EM SUPER USUÁRIO, execute:
-- DELETE FROM profiles WHERE user_id = 'USER_ID_DO_AUTH';  -- Remove da tabela profiles
-- INSERT INTO super_users (id, email, name, is_active)
-- VALUES (
--   'USER_ID_DO_AUTH',
--   'email@exemplo.com',
--   'Nome do Super Usuário',
--   true
-- );

-- 4. VERIFICAR TODOS OS USUÁRIOS E SUAS ROLES
SELECT 
  'SUPER USERS' as tipo,
  s.id,
  s.email,
  s.name,
  s.is_active,
  NULL as company_id
FROM super_users s
UNION ALL
SELECT 
  'PROFILES' as tipo,
  p.user_id,
  p.email,
  p.full_name as name,
  p.is_active,
  p.company_id::text
FROM profiles p
ORDER BY tipo, email;

-- 5. LIMPAR METADATA DO USUÁRIO (se necessário)
-- UPDATE auth.users 
-- SET user_metadata = '{}' 
-- WHERE email = 'email@exemplo.com';

-- 6. REPARAR PERMISSÕES AUSENTES
UPDATE profiles 
SET permissions = CASE role
  WHEN 'CLIENT_ADMIN' THEN '{
    "canViewCentral": true,
    "canViewAttendances": true,
    "canViewContacts": true,
    "canSendBulk": true,
    "canViewKanban": true,
    "canManageConnection": true,
    "canManageUsers": true,
    "canViewSettings": true
  }'::jsonb
  WHEN 'CLIENT_MANAGER' THEN '{
    "canViewCentral": true,
    "canViewAttendances": true,
    "canViewContacts": true,
    "canSendBulk": false,
    "canViewKanban": true,
    "canManageConnection": false,
    "canManageUsers": false,
    "canViewSettings": true
  }'::jsonb
  WHEN 'CLIENT_AGENT' THEN '{
    "canViewCentral": true,
    "canViewAttendances": true,
    "canViewContacts": true,
    "canSendBulk": false,
    "canViewKanban": false,
    "canManageConnection": false,
    "canManageUsers": false,
    "canViewSettings": true
  }'::jsonb
END
WHERE permissions IS NULL;

-- 7. VERIFICAR SE AS MIGRATIONS FORAM APLICADAS
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'permissions';

-- 8. VERIFICAR VALORES DO ENUM user_role
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
