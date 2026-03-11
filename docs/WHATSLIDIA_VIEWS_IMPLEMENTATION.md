# WhatsLidia Views Implementation

## Resumo

Implementação das páginas de views para a WhatsLidia interface, substituindo os placeholders "Funcionalidade em desenvolvimento" por funcionalidades reais.

## Views Criadas

### 1. ContactsView (`src/components/whatslidia/views/ContactsView.tsx`)

**Funcionalidades:**
- Lista de contatos com busca por nome ou telefone
- Filtro por tags
- Avatar com iniciais ou foto
- Botão para iniciar conversa diretamente
- Animações de entrada com Framer Motion
- Design responsivo dark/light mode

**Props:**
```typescript
interface ContactsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
  onStartConversation?: (contactId: string) => void;
}
```

### 2. NotesView (`src/components/whatslidia/views/NotesView.tsx`)

**Funcionalidades:**
- CRUD completo de notas internas
- Fixar notas importantes
- Busca por conteúdo ou contato
- Data relativa ("há 2 horas")
- Interface tipo sticky notes
- Categorização por cor

**Props:**
```typescript
interface NotesViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}
```

### 3. TasksView (`src/components/whatslidia/views/TasksView.tsx`)

**Funcionalidades:**
- Criar tarefas com título, descrição, prioridade e data
- Filtrar por: Todas, Pendentes, Concluídas
- Checkboxes para marcar como concluída
- Cores de prioridade (vermelho=alta, amarelo=média, verde=baixa)
- Atribuição a usuários
- Vinculação a contatos

**Props:**
```typescript
interface TasksViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}
```

### 4. SettingsView (`src/components/whatslidia/views/SettingsView.tsx`)

**Funcionalidades:**
- Seção Notificações (push, sons)
- Seção Privacidade (confirmações de leitura, indicadores de digitação)
- Seção Aparência (modo escuro, visual compacto, download automático)
- Seção Idioma (pt-BR, EN, ES, FR)
- Seção Sobre (versão, copyright)
- Persistência no Supabase

**Props:**
```typescript
interface SettingsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}
```

## Integração

Os views foram integrados no `WhatsLidiaLayout.tsx` substituindo o placeholder:

```typescript
// Antes:
return (
  <div className="flex-1 flex items-center justify-center">
    <h2>Contatos Cadastrados</h2>
    <p>Funcionalidade em desenvolvimento</p>
  </div>
);

// Depois:
switch (currentView) {
  case "contacts":
    return <ContactsView isDarkMode={isDarkMode} onBack={() => setCurrentView("conversations")} />;
  case "notes":
    return <NotesView isDarkMode={isDarkMode} onBack={() => setCurrentView("conversations")} />;
  // ...
}
```

## Tabelas Necessárias no Supabase

### 1. contacts
```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  avatar text,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);
```

### 2. notes
```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  contact_id uuid references contacts(id) on delete set null,
  created_by uuid references auth.users(id),
  created_by_name text,
  pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### 3. tasks
```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date timestamp with time zone,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  assignee uuid references auth.users(id),
  assignee_name text,
  contact_id uuid references contacts(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### 4. user_settings (para SettingsView)
```sql
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean default true,
  sound_enabled boolean default true,
  dark_mode boolean default true,
  language text default 'pt-BR',
  read_receipts boolean default true,
  typing_indicators boolean default true,
  auto_download_media boolean default false,
  compact_view boolean default false,
  updated_at timestamp with time zone default now()
);
```

## Arquivos Criados/Modificados

### Novos Arquivos:
- `src/components/whatslidia/views/ContactsView.tsx`
- `src/components/whatslidia/views/NotesView.tsx`
- `src/components/whatslidia/views/TasksView.tsx`
- `src/components/whatslidia/views/SettingsView.tsx`
- `src/components/whatslidia/views/index.ts`

### Arquivos Modificados:
- `src/components/whatslidia/WhatsLidiaLayout.tsx` - Integração dos views

## Design System

Todos os views seguem o design system WhatsApp-style:
- Cores: `#0b141a` (dark bg), `#1f2c33` (dark header), `#00a884` (accent)
- Tipografia: font-sistema, tamanhos responsivos
- Espaçamento: padrões consistentes (p-4, gap-3, etc.)
- Animações: Framer Motion com transitions suaves
- Dark/Light mode: suporte completo via props

## Próximos Passos

1. Criar as tabelas no Supabase
2. Adicionar RLS policies para segurança
3. Criar índices para performance nas queries
4. Testar em dispositivos mobile
5. Adicionar cache com TanStack Query
