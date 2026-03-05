# Plano de Implementação: Dashboard LIDIA 2.0 - Separação por Papel

## Resumo da Estrutura Atual

O projeto já possui uma base sólida com:
- Esquema de cores verde/preto definido em `globals.css`
- Sistema de autenticação com roles (`use-auth.ts`)
- Layouts separados para super usuário (`/super/*`) e cliente (`/app/*`)
- Sidebars específicas para cada tipo de usuário

## Problemas Identificados

1. **Cores inconsistentes**: Várias páginas ainda usam ciano (`cyan`), violeta (`violet`) e fúcsia (`fuchsia`) em vez do verde
2. **Páginas faltantes**: Dashboard cliente precisa das páginas: `attendances`, `contacts`, `bulk`, `kanban`, `connection`
3. **Middleware**: Não diferencia redirecionamento por papel de usuário
4. **Super central**: Página `/super/central` existe mas não está no menu lateral

## Estrutura de Dashboards por Papel

```
Login
├── Super Usuário → /super/plans
│   ├── Planos do Super Usuário
│   ├── Empresas
│   ├── Usuários Cadastrados na Empresa
│   ├── API WABA Canal de Conexão
│   └── Configuração de Tudo
│
└── Admin/Manager/Agent → /app/central
    ├── Página Central
    ├── Atendimentos
    ├── Contatos
    ├── Disparo Bulk
    ├── Kanban
    ├── Canal de Conexão
    ├── Usuários
    └── Configurações
```

## Mapeamento de Cores (Verde/Preto)

| Elemento | Cor Atual | Nova Cor |
|----------|-----------|----------|
| Primária | cyan-400/500 | emerald-400/500 |
| Gradientes | violet/fuchsia/cyan | emerald/green shades |
| Hover/Active | cyan-500/20 | emerald-500/20 |
| Texto destacado | cyan-400 | emerald-400 |
| Glow effects | cyan/violet | emerald |

## Checklist de Implementação

### 1. Esquema de Cores
- [ ] Atualizar `src/app/(dashboard)/app/central/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/app/analytics/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/app/notifications/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/app/profile/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/app/settings/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/app/users/page.tsx`

### 2. Novas Páginas (Dashboard Cliente)
- [ ] Criar `src/app/(dashboard)/app/attendances/page.tsx` - Atendimentos
- [ ] Criar `src/app/(dashboard)/app/contacts/page.tsx` - Contatos
- [ ] Criar `src/app/(dashboard)/app/bulk/page.tsx` - Disparo Bulk
- [ ] Criar `src/app/(dashboard)/app/kanban/page.tsx` - Kanban
- [ ] Criar `src/app/(dashboard)/app/connection/page.tsx` - Canal de Conexão

### 3. Redirecionamento
- [ ] Atualizar `src/middleware.ts` - Adicionar lógica de role no redirecionamento

### 4. Componentes
- [ ] Atualizar `src/components/sidebar.tsx` - Menu do cliente
- [ ] Atualizar `src/components/super-sidebar.tsx` - Menu do super usuário
- [ ] Atualizar `src/components/header.tsx` - Header do cliente
- [ ] Atualizar `src/components/super-header.tsx` - Header do super usuário

## Menu Lateral Super Usuário

1. Planos do Super Usuário (`/super/plans`) - Ícone: CreditCard
2. Empresas (`/super/companies`) - Ícone: Building2
3. Usuários Cadastrados na Empresa (`/super/company-users`) - Ícone: Users
4. API WABA: Canal de Conexão (`/super/api-waba`) - Ícone: Webhook
5. Configuração de Tudo (`/super/settings`) - Ícone: Settings

## Menu Lateral Cliente

1. Página Central (`/app/central`) - Ícone: LayoutDashboard
2. Atendimentos (`/app/attendances`) - Ícone: MessageSquare
3. Contatos (`/app/contacts`) - Ícone: Contact
4. Disparo Bulk (`/app/bulk`) - Ícone: Send
5. Kanban (`/app/kanban`) - Ícone: Kanban
6. Canal de Conexão (`/app/connection`) - Ícone: Plug
7. Usuários (`/app/users`) - Ícone: Users
8. Configurações (`/app/settings`) - Ícone: Settings

## Próximos Passos

Após aprovação deste plano, implementar no modo Code seguindo a ordem:
1. Correção do esquema de cores nas páginas existentes
2. Criação das páginas faltantes
3. Atualização dos componentes de navegação
4. Configuração do middleware de redirecionamento
