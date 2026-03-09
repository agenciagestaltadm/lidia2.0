# Plano: Ícones de Ação e Correção de Tema na Página de Atendimentos

## Visão Geral

Este plano detalha as alterações necessárias para adicionar ícones de ação nas conversas e corrigir o modo claro/escuro na página de atendimentos.

---

## 1. Pacotes de Ícones a Instalar

Serão instalados os seguintes pacotes para enriquecer o design:

```bash
npm install @heroicons/react@2 @radix-ui/react-icons phosphor-react
```

**Ícones a serem utilizados:**
- **lucide-react** (já instalado): X, Eye, ExternalLink, Power, XCircle
- **@heroicons/react**: Alternativa rica em ícones
- **phosphor-react**: Ícones modernos e customizáveis

---

## 2. Correção do Modo Claro/Escuro

### Problema Identificado
O modo escuro/claro na página de atendimentos usa um estado local `isDarkMode` em vez de integrar com o sistema de tema global do projeto.

### Solução
Integrar o WhatsLidiaLayout com o ThemeProvider existente usando CSS variables e classe `.dark` no documentElement.

### Alterações no globals.css

```css
/* Adicionar ao final do arquivo */
.dark .logo-image {
  filter: brightness(0) invert(1);
}

.dark .whatslidia-logo {
  filter: brightness(0) invert(1);
}
```

---

## 3. Arquitetura dos Componentes

### Fluxo de Dados

```mermaid
flowchart TD
    A[WhatsLidiaLayout] --> B[ConversationList]
    B --> C[ConversationItem]
    
    B --> D[activeTab: open|pending|resolved]
    
    D --> E{Aba Open}
    D --> F{Aba Pending}
    
    E --> G[Ícone: Fechamento Forçado<br/>XCircle ou Power]
    F --> H[Ícone: Espiar<br/>Eye]
    F --> I[Ícone: Abrir Conversa<br/>ExternalLink]
    
    G --> J[onForceClose: status→resolved]
    H --> K[onPreview: visualizar sem marcar lido]
    I --> L[onOpenConversation: status→open]
```

---

## 4. Alterações por Componente

### 4.1 ConversationItem.tsx

**Novas Props:**
```typescript
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
  activeTab?: 'open' | 'pending' | 'resolved';  // NOVO
  onForceClose?: (id: string) => void;          // NOVO - apenas aba open
  onPreview?: (id: string) => void;             // NOVO - apenas aba pending
  onOpenConversation?: (id: string) => void;    // NOVO - apenas aba pending
}
```

**Layout dos Ícones:**
- Posicionados à direita do item da conversa
- Aparecem no hover da conversa
- Aba "Abertos": 1 ícone (fechamento forçado)
- Aba "Pendentes": 2 ícones (espiar, abrir)
- Aba "Resolvidas": nenhum ícone (apenas visualização)

### 4.2 ConversationList.tsx

**Novas Props:**
```typescript
interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  wabaStatus: "connected" | "disconnected" | "connecting";
  onForceClose?: (id: string) => void;       // NOVO
  onPreview?: (id: string) => void;          // NOVO
  onOpenConversation?: (id: string) => void; // NOVO
}
```

**Alteração:**
- Passar `activeTab` para cada `ConversationItem`
- Repassar handlers para `ConversationItem`

### 4.3 WhatsLidiaLayout.tsx

**Novas Funções:**
```typescript
// Fechar conversa forçadamente (move para resolvidas)
const handleForceClose = (id: string) => {
  setConversations(prev => 
    prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c)
  );
};

// Espiar conversa (apenas visualiza, não marca como lida)
const handlePreview = (id: string) => {
  setSelectedConversationId(id);
  // NÃO zerar unreadCount
};

// Abrir conversa (move de pendente para aberta)
const handleOpenConversation = (id: string) => {
  setConversations(prev => 
    prev.map(c => c.id === id ? { ...c, status: 'open', unreadCount: 0 } : c)
  );
  setSelectedConversationId(id);
};
```

---

## 5. Design dos Ícones

### Aba "Abertos" - Ícone de Fechamento Forçado

```tsx
// Tooltip: "Fechar conversa"
<button
  onClick={(e) => {
    e.stopPropagation();
    onForceClose?.(conversation.id);
  }}
  className="p-1.5 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
  title="Fechar conversa"
>
  <XCircle className="w-4 h-4" />
</button>
```

### Aba "Pendentes" - Ícones de Espiar e Abrir

```tsx
// Container de ícones (visível no hover)
<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  {/* Espiar */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onPreview?.(conversation.id);
    }}
    className="p-1.5 rounded-full hover:bg-blue-500/20 text-blue-500 transition-colors"
    title="Espiar conversa"
  >
    <Eye className="w-4 h-4" />
  </button>
  
  {/* Abrir */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onOpenConversation?.(conversation.id);
    }}
    className="p-1.5 rounded-full hover:bg-emerald-500/20 text-emerald-500 transition-colors"
    title="Abrir conversa"
  >
    <ExternalLink className="w-4 h-4" />
  </button>
</div>
```

---

## 6. Correção do Tema Escuro na Logo

### Alteração em globals.css

```css
/* Já existe a classe .dark no CSS, adicionar: */
.dark .logo-image,
.dark [alt*="Curionópolis"] {
  filter: brightness(0) invert(1);
}
```

### Alteração em ConversationList.tsx

```tsx
// Adicionar classe para permitir inversão no dark mode
<Image
  src="/Curionópolis - Logo 2021.pdf.png"
  alt="Curionópolis"
  fill
  className="object-contain logo-image"
  priority
/>
```

---

## 7. Resumo das Alterações

| Arquivo | Alterações |
|---------|------------|
| `package.json` | Adicionar @heroicons/react, @radix-ui/react-icons, phosphor-react |
| `src/app/globals.css` | Adicionar filtros CSS para logo no dark mode |
| `src/components/whatslidia/ConversationItem.tsx` | Adicionar props activeTab, onForceClose, onPreview, onOpenConversation; renderizar ícones condicionalmente |
| `src/components/whatslidia/ConversationList.tsx` | Adicionar props dos handlers; passar activeTab e handlers para ConversationItem |
| `src/components/whatslidia/WhatsLidiaLayout.tsx` | Implementar handlers de gerenciamento de estado; passar props para ConversationList |

---

## 8. Comportamento Esperado

### Aba "Abertos"
- Cada conversa mostra um ícone de ❌ (XCircle) no hover
- Clique move a conversa para "Resolvidas"
- Tooltip: "Fechar conversa"

### Aba "Pendentes"
- Cada conversa mostra dois ícones no hover:
  - 👁️ (Eye): "Espiar" - abre conversa sem marcar como lida
  - ↗️ (ExternalLink): "Abrir" - move para abertos e marca como lida
- Ícones azul (espiar) e verde (abrir)

### Tema Escuro
- Logo fica branca automaticamente via CSS filter
- Toda a página responde ao toggle de tema
- Consistência visual entre todos os componentes
