# Sistema de Autenticação Baseado em Roles - Documentação de Uso

## Visão Geral

O sistema de autenticação do LIDIA 2.0 agora possui suporte completo a roles e permissões granulares, permitindo:

- **Super Usuários**: Acesso global a todas as empresas e configurações
- **Administradores de Empresa**: Acesso total à sua empresa e gerenciamento de usuários
- **Gerentes**: Acesso parcial com permissões configuráveis
- **Agentes**: Acesso limitado com permissões definidas pelo administrador

## Estrutura de Roles

```
SUPER_USER
└── Acesso a todas as empresas
└── Visibilidade global
└── Gerenciamento de planos e configurações

CLIENT_ADMIN (Administrador da Empresa)
└── Acesso total aos dados da empresa
└── Gerenciamento de usuários
└── Configuração de permissões

CLIENT_MANAGER (Gerente)
└── Acesso parcial baseado em permissões
└── Pode gerenciar usuários (se permitido)

CLIENT_AGENT (Agente)
└── Acesso limitado baseado em permissões
└── Geralmente: Central, Atendimentos, Contatos
```

## Fluxo de Login e Redirecionamento

Ao fazer login, o sistema identifica automaticamente o tipo de usuário e redireciona:

1. **Super Usuário** → `/super/plans`
2. **Usuário de Empresa** → `/app/central`

O middleware protege as rotas automaticamente:
- Rotas `/super/*` são acessíveis apenas por SUPER_USER
- Rotas `/app/*` são acessíveis apenas por usuários de empresa
- Super usuários são redirecionados para `/super/*` se tentarem acessar `/app/*`

## Permissões Disponíveis

| Permissão | Descrição | Padrão Admin | Padrão Gerente | Padrão Agente |
|-----------|-----------|--------------|----------------|---------------|
| `canViewCentral` | Página Central | ✅ | ✅ | ✅ |
| `canViewAttendances` | Atendimentos | ✅ | ✅ | ✅ |
| `canViewContacts` | Contatos | ✅ | ✅ | ✅ |
| `canSendBulk` | Disparo em Bulk | ✅ | ❌ | ❌ |
| `canViewKanban` | Kanban | ✅ | ✅ | ❌ |
| `canManageConnection` | Canal de Conexão | ✅ | ❌ | ❌ |
| `canManageUsers` | Gerenciar Usuários | ✅ | ❌ | ❌ |
| `canViewSettings` | Configurações | ✅ | ✅ | ✅ |

## Como Usar no Código

### Hook useAuth

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isSuperUser, hasPermission, canManageUsers } = useAuth();

  // Verificar se é super usuário
  if (isSuperUser()) {
    // Mostrar funcionalidades de super usuário
  }

  // Verificar permissão específica
  if (hasPermission("canSendBulk")) {
    // Mostrar botão de disparo em massa
  }

  // Verificar se pode gerenciar usuários
  if (canManageUsers()) {
    // Mostrar opções de gerenciamento
  }
}
```

### Hook usePermissions

```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { 
    userRole, 
    isCompanyAdmin, 
    canAccessRoute, 
    permissions,
    getRoleDisplayName 
  } = usePermissions();

  // Verificar role do usuário
  console.log(userRole); // "CLIENT_ADMIN", "CLIENT_MANAGER", etc.

  // Verificar se é admin da empresa
  if (isCompanyAdmin()) {
    // Mostrar opções de admin
  }

  // Verificar acesso a rota
  if (canAccessRoute("canViewKanban")) {
    // Permitir acesso
  }

  // Obter todas as permissões
  console.log(permissions.canSendBulk);

  // Mostrar nome do role
  console.log(getRoleDisplayName()); // "Administrador"
}
```

### Componente ProtectedRoute

Para proteger componentes ou páginas inteiras:

```typescript
import { ProtectedRoute } from "@/components/protected-route";

function BulkMessagingPage() {
  return (
    <ProtectedRoute requiredPermission="canSendBulk">
      <BulkMessagingContent />
    </ProtectedRoute>
  );
}

// Ou proteger por role
function AdminOnlyPage() {
  return (
    <ProtectedRoute requiredRoles={["SUPER_USER", "CLIENT_ADMIN"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Sidebar com Filtro Automático

A sidebar do cliente (`src/components/sidebar.tsx`) já filtra automaticamente os itens baseado nas permissões do usuário logado. Os itens são mostrados apenas se o usuário tiver a permissão correspondente.

## Gerenciamento de Permissões

### Para Administradores

A página `/app/users` permite que administradores:

1. Visualizem todos os usuários da empresa
2. Editem permissões individuais de cada usuário
3. Usem templates rápidos (Administrador, Gerente, Agente)
4. Ativem/desativem permissões específicas

### Templates de Permissões

- **Administrador (Tudo)**: Todas as permissões ativadas
- **Gerente (Padrão)**: Central, Atendimentos, Contatos, Kanban, Configurações
- **Agente (Básico)**: Central, Atendimentos, Contatos, Configurações

## Navegação

### Super Usuário

| Menu | Rota | Descrição |
|------|------|-----------|
| Planos | `/super/plans` | Gerenciar planos do sistema |
| Empresas | `/super/companies` | Gerenciar empresas cadastradas |
| Usuários Cadastrados das Empresas | `/super/company-users` | Ver todos os usuários de todas as empresas |
| Canal de Conexão | `/super/api-waba` | Configurar API WABA |
| Configurações | `/super/settings` | Configurações globais |

### Cliente (Empresa)

| Menu | Rota | Permissão Necessária |
|------|------|---------------------|
| Página Central | `/app/central` | `canViewCentral` |
| Atendimentos | `/app/attendances` | `canViewAttendances` |
| Contatos | `/app/contacts` | `canViewContacts` |
| Disparo em Bulk | `/app/bulk` | `canSendBulk` |
| Kanban | `/app/kanban` | `canViewKanban` |
| Canal de Conexão | `/app/connection` | `canManageConnection` |
| Usuários | `/app/users` | `canManageUsers` |
| Configurações | `/app/settings` | `canViewSettings` |

## Banco de Dados

### Coluna permissions

A tabela `profiles` possui uma coluna `permissions` do tipo JSONB:

```json
{
  "canViewCentral": true,
  "canViewAttendances": true,
  "canViewContacts": true,
  "canSendBulk": false,
  "canViewKanban": false,
  "canManageConnection": false,
  "canManageUsers": false,
  "canViewSettings": true
}
```

### Auditoria

Todas as alterações de permissões são registradas na tabela `permission_audit_logs` com:
- ID do usuário afetado
- ID do usuário que fez a alteração
- Permissões antigas e novas
- Data/hora da alteração

## Segurança

### Row Level Security (RLS)

- Usuários só podem ver dados da própria empresa
- Administradores podem gerenciar usuários da mesma empresa
- Super usuários têm acesso global
- As políticas RLS garantem isolamento de dados

### Middleware

O middleware em `src/middleware.ts` garante:
- Redirecionamento correto baseado no role
- Proteção de rotas `/super/*` para super usuários
- Proteção de rotas `/app/*` para usuários de empresa
- Atualização automática de `user_metadata` com o role

## Troubleshooting

### Usuário sendo redirecionado incorretamente

1. Verifique se a coluna `role` está correta no banco de dados
2. Verifique se o `user_metadata` foi atualizado no Supabase Auth
3. Faça logout e login novamente para atualizar a sessão

### Permissões não estão sendo aplicadas

1. Verifique se a coluna `permissions` existe na tabela `profiles`
2. Verifique se as permissões estão no formato JSON válido
3. Execute a migration SQL: `002_add_user_permissions.sql`

### Usuário não consegue ver menu na sidebar

1. Verifique as permissões do usuário no banco de dados
2. Verifique se o usuário tem a permissão correspondente ao menu
3. Verifique os logs do console para erros

## Migração de Dados

Para aplicar as mudanças no banco de dados existente:

```bash
# Aplicar migration
psql -d sua_database -f supabase/migrations/002_add_user_permissions.sql
```

Ou execute manualmente no SQL Editor do Supabase Dashboard.

## Próximos Passos

1. Testar login com diferentes tipos de usuários
2. Verificar redirecionamentos
3. Testar gerenciamento de permissões
4. Validar isolamento de dados entre empresas
