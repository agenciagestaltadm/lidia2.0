# 🔐 Como Criar/Resetar o Usuário Admin LIDIA

## Erro "Failed to create user: Database error"

Isso acontece porque há uma **trigger** que automaticamente cria o perfil quando um usuário é criado, mas pode estar falhando se houver dados inconsistentes.

## ✅ SOLUÇÃO 1: Via SQL (Recomendada)

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- ============================================================
-- CRIAR USUÁRIO ADMIN - SEM PERMISSÕES ESPECIAIS
-- ============================================================

-- Passo 1: Limpar usuário antigo
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'adminlidia@superusuario.com.br';
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.profiles WHERE user_id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;
END $$;

-- Passo 2: Criar usuário (a trigger cria o perfil automaticamente)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, aud, role
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'adminlidia@superusuario.com.br',
        '$2a$10$QdXdvCFXgZ.N6E1.UJZxQOzYk1hCjCqWJHhYQ/XT/Z7JQY1EJQpC.',
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"SUPER_USER","full_name":"Super Administrador LIDIA"}',
        NOW(), NOW(),
        'authenticated', 'authenticated'
    )
    RETURNING id INTO v_user_id;
END $$;

-- Passo 3: Atualizar perfil criado pela trigger
UPDATE public.profiles 
SET role = 'SUPER_USER', full_name = 'Super Administrador LIDIA', is_active = true
WHERE email = 'adminlidia@superusuario.com.br';

-- Verificar
SELECT u.id, u.email, p.role, p.full_name 
FROM auth.users u 
JOIN public.profiles p ON p.user_id = u.id 
WHERE u.email = 'adminlidia@superusuario.com.br';
```

Ou execute o arquivo: [`supabase/fix-create-user-alternative.sql`](supabase/fix-create-user-alternative.sql)

## 🔑 Credenciais para Login

- **Email:** `adminlidia@superusuario.com.br`
- **Senha:** `123456Ag@`

## ⚠️ Se ainda der erro...

1. Verifique se a tabela `profiles` existe:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
   ```

2. Verifique se o enum `user_role` existe:
   ```sql
   SELECT * FROM pg_enum WHERE enumlabel LIKE 'SUPER_USER';
   ```

3. Verifique os logs do Supabase:
   - Vá em **Logs → Database** no painel do Supabase
   - Procure por erros ao executar o SQL

## Alternativa: Via Script Node.js

Se o SQL não funcionar, use: `scripts/reset-admin-password.js`

1. Configure a SERVICE_ROLE_KEY no script
2. Execute: `node scripts/reset-admin-password.js`
