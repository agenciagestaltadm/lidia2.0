# LIDIA 2.0 - CRM Multi-Tenant

CRM completo para gestão de atendimentos, contatos e vendas com arquitetura multi-tenant.

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização com tema verde + dark mode
- **Supabase** - Banco de dados PostgreSQL, Auth e RLS
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🛠️ Configuração

### 1. Clone o repositório

```bash
git clone <repo-url>
cd lidia2.0
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `supabase/schema.sql` no SQL Editor
3. Configure as políticas de RLS
4. Copie as credenciais do projeto

### 4. Configure as variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

### 5. Crie o superusuário

No Supabase SQL Editor, execute:

```sql
-- Crie um usuário via Auth UI do Supabase
-- Depois atualize o role para SUPER_USER:
UPDATE profiles 
SET role = 'SUPER_USER', company_id = NULL 
WHERE email = 'seu-email@exemplo.com';
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Rotas agrupadas
│   │   ├── app/           # Dashboard Cliente
│   │   └── super/         # Dashboard Superusuário
│   ├── login/             # Página de login
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI (shadcn)
│   ├── sidebar.tsx       # Sidebar de navegação
│   ├── header.tsx        # Cabeçalho
│   └── theme-provider.tsx # Provider de tema
├── lib/                  # Utilitários
│   ├── supabase/        # Clientes Supabase
│   └── utils.ts         # Funções utilitárias
├── types/               # Tipagens TypeScript
└── middleware.ts        # Middleware de autenticação
```

### Fluxo de Autenticação

1. Usuário acessa `/login`
2. Após login bem-sucedido, verifica-se o `role` no `profiles`
3. Redirecionamento:
   - `SUPER_USER` → `/super/central`
   - `CLIENT_*` → `/app/central`

### Papéis (RBAC)

- **SUPER_USER**: Acesso global ao sistema
- **CLIENT_ADMIN**: Admin da empresa
- **CLIENT_AGENT**: Operador/atendente
- **CLIENT_VIEWER**: Somente leitura

## 🎨 Design System

### Paleta de Cores

- **Primária (verde)**: Emerald para botões e destaques
- **Neutros**: Branco/cinzas claros (light), quase-preto (dark)
- **Acentos**: Azul (info), Amarelo (alerta), Vermelho (erro)

### Modo Escuro

Toggle automático com `prefers-color-scheme` ou manual via UI.

## 📚 Módulos

### Superusuário
- Central (visão geral)
- Planos (gestão de planos)
- Empresas (tenants)
- Usuários (por empresa)
- Canais (integrações)
- Configurações

### Cliente
- Central (resumo do dia)
- Atendimentos
- Contatos
- Disparo em Bulk
- Kanban
- Funil de Vendas
- Canais
- Usuários
- Configurações

## 🔒 Segurança

- **RLS (Row Level Security)**: Isolamento por tenant
- **Middleware**: Verificação de sessão e roles
- **Captcha**: Verificação humana no login
- **Senhas**: Política mínima no Supabase Auth

## 📝 Licença

MIT
