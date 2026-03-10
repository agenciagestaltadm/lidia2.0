# Plano: Sistema de Mensagens Rápidas (Quick Replies)

## Visão Geral
Substituir o popup atual de quick replies por um sistema completo com:
- Botão gerenciador entre (+) e emoji
- Interface CRUD para mensagens rápidas
- Sistema de comandos "/" com dropdown inteligente
- Persistência local

## Funcionalidades

### 1. Remover Quick Replies Atual
- Remover a seção de quick replies de [`ChatWindow.tsx`](lidia2.0/src/components/whatslidia/ChatWindow.tsx:354)

### 2. Novo Botão na MessageInput
**Local:** Entre botão (+) e botão emoji na [`MessageInput.tsx`](lidia2.0/src/components/whatslidia/MessageInput.tsx:302)

**Características:**
- Ícone: `Zap` (raio) ou `Clock` (relógio) do lucide-react
- Tooltip: "Mensagens Rápidas"
- Animação suave no hover
- Abre modal gerenciador ao clicar

### 3. Modal Gerenciador de Mensagens Rápidas
**Novo arquivo:** `QuickRepliesManagerModal.tsx`

**Interface:**
- Lista de mensagens rápidas cadastradas
- Cada item mostra: atalho (ex: /ola), título, preview do conteúdo
- Botões: Editar, Excluir
- Formulário para Criar/Editar:
  - Campo: Atalho (ex: "ola" → vira /ola)
  - Campo: Título (descrição curta)
  - Campo: Conteúdo (texto completo)

**Validações:**
- Atalho único (sem duplicatas)
- Campos obrigatórios
- Preview ao editar

### 4. Sistema de Comandos "/"
**Implementação no [`MessageInput.tsx`](lidia2.0/src/components/whatslidia/MessageInput.tsx:330):**

**Detecção:**
- Monitorar input para texto começando com "/"
- Extrair termo de busca após o "/"

**Dropdown de Sugestões:**
- Posicionamento: flutuante acima do cursor/input
- Z-index: z-[102] (acima de todos os modais)
- Estilo: semi-transparente, glassmorphism
- Animações: fade in/out suave

**Conteúdo do Dropdown:**
- Lista filtrada por termo de busca
- Cada item mostra: atalho destacado + título + preview
- Highlight no texto que corresponde à busca

**Navegação por Teclado:**
- `↓` / `↑`: Navegar entre opções
- `Enter` ou `Tab`: Selecionar opção destacada
- `Esc`: Fechar dropdown
- Digitar: Filtrar lista em tempo real

**Seleção:**
- Clique do mouse: seleciona
- Teclado: seleciona
- Substituição: remove "/" + termo e insere conteúdo completo

### 5. Auto-expansão no Envio
Se o usuário digitar exatamente um atalho existente (ex: "/saudacao") e enviar:
- Expandir para o conteúdo completo antes do envio
- Ou substituir no momento do envio

### 6. Persistência
**Storage:** localStorage
**Chave:** `lidia-quick-replies`
**Dados:** Array de objetos { id, shortcut, title, content, createdAt }
**Padrões iniciais:**
```json
[
  { "id": "1", "shortcut": "ola", "title": "Saudação", "content": "Olá! Como posso ajudar você hoje?" },
  { "id": "2", "shortcut": "aguarde", "title": "Aguardar", "content": "Só um momento, por favor. Estou verificando isso para você." },
  { "id": "3", "shortcut": "agrad", "title": "Agradecimento", "content": "Obrigado pelo contato! Tenha um ótimo dia." }
]
```

### 7. Hook Personalizado
**Novo arquivo:** `useQuickReplies.ts`

**Responsabilidades:**
- Carregar mensagens do localStorage
- Salvar mensagens no localStorage
- CRUD completo
- Busca/filtragem
- Validação de atalhos únicos

### 8. Componentes Novos

```
src/components/whatslidia/
├── modals/
│   └── QuickRepliesManagerModal.tsx  (Gerenciador CRUD)
├── QuickRepliesDropdown.tsx           (Dropdown de sugestões)
└── hooks/
    └── useQuickReplies.ts             (Hook de persistência)
```

## Estrutura de Dados

```typescript
interface QuickReply {
  id: string;
  shortcut: string;      // ex: "ola" (sem o /)
  title: string;         // ex: "Saudação"
  content: string;       // texto completo
  createdAt: Date;
  updatedAt?: Date;
}

interface UseQuickRepliesReturn {
  quickReplies: QuickReply[];
  addQuickReply: (data: Omit<QuickReply, 'id' | 'createdAt'>) => boolean;
  updateQuickReply: (id: string, data: Partial<QuickReply>) => boolean;
  deleteQuickReply: (id: string) => void;
  searchQuickReplies: (term: string) => QuickReply[];
  getByShortcut: (shortcut: string) => QuickReply | undefined;
}
```

## Checklist de Implementação

- [x] Criar hook `useQuickReplies.ts`
- [x] Criar modal `QuickRepliesManagerModal.tsx`
- [x] Criar componente `QuickRepliesDropdown.tsx`
- [x] Atualizar `MessageInput.tsx`:
  - [x] Adicionar botão de mensagens rápidas
  - [x] Implementar detecção de "/"
  - [x] Integrar dropdown
  - [x] Implementar auto-expansão no envio
- [x] Remover quick replies antigo de `ChatWindow.tsx`
- [x] Atualizar `modals/index.ts` para exportar novo modal
- [x] Testar persistência no localStorage
- [x] Testar navegação por teclado
- [x] Testar em modo claro/escuro

## Resumo das Implementações

### 1. Hook `useQuickReplies.ts` ✅
- Persistência no localStorage
- CRUD completo (Create, Read, Update, Delete)
- Validação de atalhos únicos
- Busca/filtragem
- Auto-expansão de atalhos
- Dados padrão pré-cadastrados: `/ola`, `/aguarde`, `/agrad`

### 2. Modal `QuickRepliesManagerModal.tsx` ✅
- Interface CRUD completa
- Formulário com validação
- Lista ordenada por atalho
- Preview do conteúdo
- Animações suaves
- Z-index z-[101]

### 3. Componente `QuickRepliesDropdown.tsx` ✅
- Posicionamento flutuante acima do input
- Filtragem em tempo real
- Navegação por teclado:
  - ↑↓: navegar entre opções
  - Enter/Tab: selecionar
  - Esc: fechar
- Highlight do texto buscado
- Z-index z-[102]

### 4. Atualizações no `MessageInput.tsx` ✅
- Novo botão com ícone Zap (raio) entre (+) e emoji
- Tooltip "Mensagens Rápidas"
- Detecção automática de "/"
- Substituição inteligente do texto
- Auto-expansão de atalhos no envio

### 5. Remoção do Quick Replies Antigo ✅
- Removido do `ChatWindow.tsx`

### Build ✅
- Compilação bem-sucedida sem erros!

## Design Visual

### Botão na Input Bar
- Posição: Entre (+) e emoji
- Ícone: Zap (tamanho 20px)
- Cor: text-[#aebac1] no dark, text-gray-600 no light
- Hover: bg-[#2a3942] no dark, bg-gray-100 no light
- Tooltip: "Mensagens Rápidas"

### Dropdown
- Largura: 320px
- Max-height: 280px (com scroll)
- Background: bg-[#1f2c33]/95 no dark, bg-white/95 no light
- Border: border border-[#2a2a2a] no dark, border-gray-200 no light
- Border-radius: rounded-xl
- Shadow: shadow-2xl
- Backdrop: backdrop-blur-md
- Z-index: z-[102]

### Item do Dropdown
- Padding: px-4 py-3
- Hover: bg-[#2a3942] no dark, bg-gray-100 no light
- Selecionado: bg-[#00a884]/20 border-l-2 border-[#00a884]
- Estrutura:
  - Título em negrito (text-sm)
  - Preview truncado (text-xs, opacity 70%)
  - Atalho destacado em cor primária

## Dependências
Nenhuma nova - usar React, Framer Motion (já instalado) e Lucide React.
