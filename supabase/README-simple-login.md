# Sistema de Login Simplificado - LIDIA

## Como funciona agora

O sistema foi simplificado para funcionar assim:

### 1. Criar Usuário
- Vá no painel do Supabase → **Authentication → Users**
- Clique em **"Add user"** → **"Create new user"**
- Digite o **email** e **senha**
- ✅ Marque **"Auto-confirm email"**
- Clique em **"Create user"**

### 2. Definir Perfil do Usuário
Após criar o usuário, você precisa criar o perfil dele. Execute no SQL Editor:

```sql
-- Substitua pelos dados do usuário criado
SELECT public.create_user_profile(
    'UUID-DO-USUARIO-AQUI',     -- UUID do usuário (veja no painel)
    'email@usuario.com',         -- email do usuário
    'Nome Completo',             -- nome do usuário
    'CLIENT_ADMIN'               -- role do usuário
);
```

### 3. Roles disponíveis

- `SUPER_USER` - Acesso total (pode gerenciar empresas e usuários)
- `CLIENT_ADMIN` - Administrador da empresa (pode gerenciar sua empresa)
- `CLIENT_AGENT` - Agente/operador (pode atender tickets)
- `CLIENT_VIEWER` - Somente visualização (pode ver dados mas não editar)

### 4. Login

Acesse a aplicação e faça login com:
- **Email:** email cadastrado
- **Senha:** senha definida no painel

---

## SQL de Configuração

Execute este SQL primeiro para preparar o sistema:

```sql
-- Arquivo: supabase/simplify-system.sql
-- (já criado no projeto)
```

## Exemplo completo

### Passo 1: Criar usuário no painel
Crie um usuário com:
- Email: `joao@empresa.com`
- Senha: `senha123`

Copie o UUID gerado (exemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Passo 2: Criar perfil
Execute no SQL Editor:

```sql
SELECT public.create_user_profile(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'joao@empresa.com',
    'João Silva',
    'CLIENT_ADMIN'
);
```

### Passo 3: Testar login
Acesse a aplicação e faça login com `joao@empresa.com` / `senha123`

---

## Gerenciamento no Dashboard

Futuramente você poderá criar uma página no dashboard para:
- Listar todos os usuários
- Criar novos usuários
- Alterar roles
- Desativar usuários

Por enquanto, use o SQL Editor para gerenciar.
