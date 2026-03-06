# Como Corrigir Problema de Loop no Login

## Problema
O usuário faz login mas fica em loop entre `/login` e `/app/central` ou `/super/plans`.

## Causas Comuns

1. **Usuário existe no auth.users mas não tem profile na tabela `profiles`**
2. **Campo `role` está NULL ou vazio no profile**
3. **User metadata não está atualizado**
4. **Middleware não consegue identificar o role**

## Passos para Diagnosticar e Corrigir

### Passo 1: Execute o Script de Diagnóstico

No SQL Editor do Supabase, execute: **`supabase/fix-login-issues.sql`**

**IMPORTANTE**: Mude `'email@exemplo.com'` para o seu email real na linha 16.

### Passo 2: Analise o Resultado

O script vai mostrar:
- Se você está em `auth.users` ✓
- Se você tem um profile em `profiles` ou `super_users` ✓
- Qual é o seu role atual ✓

### Passo 3: Corrija conforme o problema

#### Caso A: Usuário não tem profile (NULL em profile_id)

Execute:
```sql
-- Para ADMIN de empresa:
INSERT INTO profiles (user_id, email, role, company_id, full_name, is_active)
VALUES (
  'SEU_USER_ID_DO_AUTH',  -- ID do usuário na tabela auth.users
  'seu@email.com',
  'CLIENT_ADMIN',
  'COMPANY_ID_DA_EMPRESA', -- ID da empresa (ou NULL se não tiver)
  'Seu Nome',
  true
);
```

#### Caso B: Tornar Super Usuário

Execute:
```sql
-- 1. Remove da tabela profiles (se existir)
DELETE FROM profiles WHERE user_id = 'SEU_USER_ID_DO_AUTH';

-- 2. Adiciona à tabela super_users
INSERT INTO super_users (id, email, name, is_active)
VALUES (
  'SEU_USER_ID_DO_AUTH',
  'seu@email.com',
  'Seu Nome',
  true
);
```

#### Caso C: Role está NULL

Execute:
```sql
UPDATE profiles 
SET role = 'CLIENT_ADMIN',  -- ou 'CLIENT_MANAGER', 'CLIENT_AGENT'
    is_active = true
WHERE user_id = 'SEU_USER_ID_DO_AUTH';
```

### Passo 4: Limpar Cache do Navegador

1. Abra o DevTools (F12)
2. Vá em Application → Local Storage → Seu domínio
3. Delete todos os itens relacionados a `supabase`, `sb-`, ou `lidia`
4. Ou simplesmente: **Ctrl+Shift+Delete** → Limpar dados de navegação → "Cookies e outros dados de site"

### Passo 5: Verificar no Console do Navegador

Ao fazer login, abra o console (F12) e verifique se aparecem erros como:
- "Profile not found"
- "User role is undefined"
- "Cannot read properties of undefined"

### Passo 6: Testar Login

1. Faça logout
2. Limpe o cache
3. Faça login novamente

## Como Encontrar Seu User ID

Execute no SQL Editor:
```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'seu@email.com';
```

O valor na coluna `id` é o seu `USER_ID`.

## Verificação Rápida (Checklist)

- [ ] Usuário existe em `auth.users`?
- [ ] Usuário tem entrada em `profiles` OU `super_users`?
- [ ] Campo `role` está preenchido (não NULL)?
- [ ] Campo `is_active` é `true`?
- [ ] Cache do navegador foi limpo?
- [ ] Migrations foram executadas na ordem correta?

## Se Ainda Não Funcionar

Verifique se as migrations foram executadas:
```sql
-- Verificar se coluna permissions existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'permissions';

-- Verificar valores do enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
```

Se a coluna `permissions` não existir ou o enum não tiver `CLIENT_MANAGER`, execute as migrations na ordem:
1. `002_add_client_manager_enum.sql`
2. `003_add_user_permissions.sql`
