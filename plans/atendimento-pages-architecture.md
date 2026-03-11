# Arquitetura das Páginas de Atendimento

## Visão Geral
Implementação de 4 páginas adicionais no menu lateral da interface WhatsLidia:
1. Funil de Vendas (`/app/atendimento/funil`)
2. Protocolos (`/app/atendimento/protocolos`)
3. Avaliações (`/app/atendimento/avaliacoes`)
4. Notas (`/app/atendimento/notas`)

## Estrutura de Arquivos

```
src/
├── app/(dashboard)/app/atendimento/
│   ├── layout.tsx              # Layout compartilhado com tabs
│   ├── funil/
│   │   ├── page.tsx            # Server Component (fetch inicial)
│   │   └── components/
│   │       ├── SalesFunnelClient.tsx    # Client Component (interatividade)
│   │       ├── FunnelStageCard.tsx      # Card de estágio do funil
│   │       └── DealList.tsx             # Lista de negócios
│   ├── protocolos/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── ProtocolsClient.tsx
│   │       ├── ProtocolCard.tsx
│   │       └── ProtocolFilters.tsx
│   ├── avaliacoes/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── RatingsClient.tsx
│   │       ├── RatingStats.tsx
│   │       └── RatingList.tsx
│   └── notas/
│       ├── page.tsx
│       └── components/
│           ├── NotesClient.tsx
│           ├── NoteCard.tsx
│           └── NoteEditor.tsx
├── hooks/
│   ├── use-sales-funnel.ts     # TanStack Query hook
│   ├── use-protocols.ts
│   ├── use-ratings.ts
│   └── use-notes.ts
├── types/
│   └── atendimento.ts          # Tipos específicos
└── components/ui/
    ├── loading-skeleton.tsx    # Skeleton components
    └── error-boundary.tsx      # Error boundary com retry
```

## Tipos TypeScript

```typescript
// types/atendimento.ts

export interface SalesFunnelDeal {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  estimated_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  assigned_name?: string;
}

export interface Protocol {
  id: string;
  code: string;
  conversation_id: string;
  contact_name: string;
  contact_phone: string;
  message: string;
  sent_by: string;
  sent_at: string;
  created_at: string;
}

export interface Rating {
  id: string;
  conversation_id: string;
  contact_name: string;
  contact_phone: string;
  type: 'nps' | 'stars';
  score: number;
  feedback?: string;
  requested_at: string;
  responded_at?: string;
  created_at: string;
}

export interface Note {
  id: string;
  contact_id: string;
  contact_name: string;
  content: string;
  category: 'general' | 'important' | 'followup' | 'complaint';
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

## Hooks TanStack Query

### useSalesFunnel
- `useSalesFunnel(deps)` - Busca deals do funil
- `useCreateDeal()` - Mutation para criar deal
- `useUpdateDeal()` - Mutation para atualizar deal
- `useDeleteDeal()` - Mutation para deletar deal
- Realtime subscription para atualizações

### useProtocols
- `useProtocols(deps)` - Busca protocolos
- `useCreateProtocol()` - Mutation para criar
- Realtime subscription

### useRatings
- `useRatings(deps)` - Busca avaliações
- `useRequestRating()` - Mutation para solicitar
- Realtime subscription

### useNotes
- `useNotes(deps)` - Busca notas
- `useCreateNote()` - Mutation para criar
- `useUpdateNote()` - Mutation para atualizar
- `useDeleteNote()` - Mutation para deletar
- Realtime subscription

## Componentes Server vs Client

### Server Components (page.tsx)
- Fetch inicial de dados via Supabase SSR
- Passa dados para Client Components
- Metadata dinâmica

### Client Components (*Client.tsx)
- Interatividade (filtros, busca, paginação)
- TanStack Query para mutations
- Estado local para UI
- Realtime subscriptions

## Sidebar Atualização

```typescript
// Submenu Atendimento
{
  label: "Atendimento",
  icon: MessageSquare,
  children: [
    { href: "/app/attendances", label: "Conversas" },
    { href: "/app/atendimento/funil", label: "Funil de Vendas", badge: "funnelCount" },
    { href: "/app/atendimento/protocolos", label: "Protocolos", badge: "protocolCount" },
    { href: "/app/atendimento/avaliacoes", label: "Avaliações", badge: "ratingCount" },
    { href: "/app/atendimento/notas", label: "Notas", badge: "noteCount" },
  ]
}
```

## Features Específicas

### Funil de Vendas
- Visualização em kanban por estágio
- Cards arrastáveis (drag & drop)
- Estatísticas de conversão
- Filtros por data, valor, responsável

### Protocolos
- Lista com busca por código
- Filtros por data, status
- Geração de novo protocolo
- Histórico de protocolos enviados

### Avaliações
- Dashboard com métricas NPS
- Lista de avaliações pendentes/respondidas
- Filtros por tipo (NPS/estrelas)
- Estatísticas de resposta

### Notas
- Lista de notas por contato
- Editor markdown
- Categorias com cores
- Busca em conteúdo

## Design System

### Cores
- Primary: emerald-500 (#10b981)
- Background: slate-950 (dark) / white (light)
- Surface: slate-900 (dark) / slate-50 (light)
- Text: slate-100 (dark) / slate-900 (light)
- Muted: slate-400

### Animações
- Framer Motion para transições
- Stagger children: 0.05s
- Spring: stiffness 380, damping 30
- Fade: duration 0.2s

### Componentes UI
- shadcn/ui: Button, Card, Dialog, Input, Select
- Custom: GlassCard, GlowBadge, AnimatedInput
- Skeleton: Pulse animations

## Integração Supabase Realtime

```typescript
// Subscription para atualizações em tempo real
const subscription = supabase
  .channel('table_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_funnel' }, callback)
  .subscribe()
```

## Error Boundaries

```typescript
// error-boundary.tsx
<ErrorBoundary 
  fallback={<ErrorFallback onRetry={refetch} />}
>
  {children}
</ErrorBoundary>
```

## Cache Invalidation

- TanStack Query staleTime: 5 minutos
- Mutation onSuccess: invalidateQueries
- Realtime updates: refetch automático
