# Guia de Integração: 7 Funcionalidades do ContactInfoModal

## Resumo

Foram criados 5 novos modais e 2 componentes para expandir as funcionalidades de informações do contato. Este guia documenta como integrá-los ao ContactInfoModal e ChatHeader.

## Arquivos Criados

### Modais (src/components/whatslidia/modals/)
1. **SalesFunnelModal.tsx** - Funil de vendas com pipeline
2. **ProtocolModal.tsx** - Geração e envio de protocolo
3. **RatingModal.tsx** - Avaliação NPS/Estrelas
4. **NotesModal.tsx** - CRUD de notas com markdown
5. **ExportChatModal.tsx** - Exportação para PDF

### Componentes (src/components/whatslidia/components/)
1. **KanbanIntegration.tsx** - Dropdown de colunas Kanban
2. **TagsManager.tsx** - Gerenciamento de etiquetas coloridas

## Integração no ContactInfoModal

### 1. Adicionar Imports

```typescript
import { useState } from "react";
import {
  TrendingUp,
  FileCheck,
  Star,
  StickyNote,
  FileDown,
  LayoutGrid,
  Tag,
} from "lucide-react";
import {
  SalesFunnelModal,
  ProtocolModal,
  RatingModal,
  NotesModal,
  ExportChatModal,
} from "./";
import { KanbanIntegration, TagsManager } from "../components";
```

### 2. Adicionar Estados

```typescript
const [isSalesFunnelOpen, setIsSalesFunnelOpen] = useState(false);
const [isProtocolOpen, setIsProtocolOpen] = useState(false);
const [isRatingOpen, setIsRatingOpen] = useState(false);
const [isNotesOpen, setIsNotesOpen] = useState(false);
const [isExportOpen, setIsExportOpen] = useState(false);
```

### 3. Adicionar Seções no JSX (após a seção de Contato)

```typescript
{/* Funil de Vendas */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => setIsSalesFunnelOpen(true)}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
      isDarkMode
        ? "bg-[#2a3942] hover:bg-[#374045]"
        : "bg-gray-50 hover:bg-gray-100"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-blue-400" />
      </div>
      <div className="text-left">
        <p className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
        )}>
          Funil de Vendas
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          Gerenciar pipeline comercial
        </p>
      </div>
    </div>
    <ChevronRight className={cn(
      "w-5 h-5",
      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
    )} />
  </motion.button>
</div>

{/* Protocolo */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => setIsProtocolOpen(true)}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
      isDarkMode
        ? "bg-[#2a3942] hover:bg-[#374045]"
        : "bg-gray-50 hover:bg-gray-100"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
        <FileCheck className="w-5 h-5 text-green-400" />
      </div>
      <div className="text-left">
        <p className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
        )}>
          Gerar Protocolo
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          Criar código de atendimento
        </p>
      </div>
    </div>
    <ChevronRight className={cn(
      "w-5 h-5",
      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
    )} />
  </motion.button>
</div>

{/* Avaliação */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => setIsRatingOpen(true)}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
      isDarkMode
        ? "bg-[#2a3942] hover:bg-[#374045]"
        : "bg-gray-50 hover:bg-gray-100"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
        <Star className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="text-left">
        <p className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
        )}>
          Solicitar Avaliação
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          NPS ou avaliação por estrelas
        </p>
      </div>
    </div>
    <ChevronRight className={cn(
      "w-5 h-5",
      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
    )} />
  </motion.button>
</div>

{/* Notas */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => setIsNotesOpen(true)}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
      isDarkMode
        ? "bg-[#2a3942] hover:bg-[#374045]"
        : "bg-gray-50 hover:bg-gray-100"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
        <StickyNote className="w-5 h-5 text-amber-400" />
      </div>
      <div className="text-left">
        <p className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
        )}>
          Notas
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          Anotações internas
        </p>
      </div>
    </div>
    <ChevronRight className={cn(
      "w-5 h-5",
      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
    )} />
  </motion.button>
</div>

{/* Exportar Conversa */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => setIsExportOpen(true)}
    className={cn(
      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
      isDarkMode
        ? "bg-[#2a3942] hover:bg-[#374045]"
        : "bg-gray-50 hover:bg-gray-100"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <FileDown className="w-5 h-5 text-purple-400" />
      </div>
      <div className="text-left">
        <p className={cn(
          "font-medium text-sm",
          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
        )}>
          Exportar Conversa
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          Gerar PDF do histórico
        </p>
      </div>
    </div>
    <ChevronRight className={cn(
      "w-5 h-5",
      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
    )} />
  </motion.button>
</div>

{/* Integração Kanban */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <KanbanIntegration
    contactId={contact.id}
    currentColumn="in_progress"
    isDarkMode={isDarkMode}
    onMove={(columnId, columnLabel) => {
      console.log(`Moved to ${columnLabel}`);
    }}
  />
</div>

{/* Gerenciamento de Tags */}
<div className={cn(
  "p-4 border-b",
  isDarkMode
    ? "bg-[#1f2c33] border-[#2a2a2a]"
    : "bg-white border-gray-200"
)}>
  <TagsManager
    contactId={contact.id}
    existingTags={contact.tags || []}
    isDarkMode={isDarkMode}
    onUpdateTags={async (tags) => {
      console.log("Updated tags:", tags);
    }}
  />
</div>
```

### 4. Adicionar Modais no Final

```typescript
{/* Sales Funnel Modal */}
<SalesFunnelModal
  isOpen={isSalesFunnelOpen}
  onClose={() => setIsSalesFunnelOpen(false)}
  contactId={contact.id}
  contactName={contact.name}
  isDarkMode={isDarkMode}
  onUpdatePipeline={async (data) => {
    console.log("Pipeline updated:", data);
  }}
/>

{/* Protocol Modal */}
<ProtocolModal
  isOpen={isProtocolOpen}
  onClose={() => setIsProtocolOpen(false)}
  conversationId={conversation.id}
  contactName={contact.name}
  isDarkMode={isDarkMode}
  onSendProtocol={async (protocol, message) => {
    console.log("Protocol sent:", protocol);
  }}
/>

{/* Rating Modal */}
<RatingModal
  isOpen={isRatingOpen}
  onClose={() => setIsRatingOpen(false)}
  conversationId={conversation.id}
  contactName={contact.name}
  isDarkMode={isDarkMode}
  onRequestRating={async (type, message) => {
    console.log("Rating requested:", type);
  }}
/>

{/* Notes Modal */}
<NotesModal
  isOpen={isNotesOpen}
  onClose={() => setIsNotesOpen(false)}
  contactId={contact.id}
  contactName={contact.name}
  isDarkMode={isDarkMode}
/>

{/* Export Chat Modal */}
<ExportChatModal
  isOpen={isExportOpen}
  onClose={() => setIsExportOpen(false)}
  conversationId={conversation.id}
  contactName={contact.name}
  contact={contact}
  messages={[]} // Pass actual messages
  isDarkMode={isDarkMode}
/>
```

## Integração no ChatHeader Menu

### Adicionar Imports

```typescript
import {
  TrendingUp,
  FileCheck,
  Star,
  StickyNote,
  FileDown,
  LayoutGrid,
  Tag,
} from "lucide-react";
```

### Adicionar aos menuOptions

```typescript
const menuOptions: MenuOption[] = [
  // ... existing options ...
  
  // Nova seção - Gestão do Cliente
  { 
    label: "Funil de Vendas", 
    icon: TrendingUp, 
    onClick: () => { setIsSalesFunnelOpen(true); setShowMenu(false); },
    variant: "info",
    separator: true 
  },
  { 
    label: "Gerar Protocolo", 
    icon: FileCheck, 
    onClick: () => { setIsProtocolOpen(true); setShowMenu(false); },
    variant: "default"
  },
  { 
    label: "Solicitar Avaliação", 
    icon: Star, 
    onClick: () => { setIsRatingOpen(true); setShowMenu(false); },
    variant: "success"
  },
  { 
    label: "Notas", 
    icon: StickyNote, 
    onClick: () => { setIsNotesOpen(true); setShowMenu(false); },
    variant: "default"
  },
  { 
    label: "Exportar Conversa", 
    icon: FileDown, 
    onClick: () => { setIsExportOpen(true); setShowMenu(false); },
    variant: "default"
  },
  { 
    label: "Mover no Kanban", 
    icon: LayoutGrid, 
    onClick: () => { setIsKanbanOpen(true); setShowMenu(false); },
    variant: "warning"
  },
  { 
    label: "Gerenciar Etiquetas", 
    icon: Tag, 
    onClick: () => { setIsTagsOpen(true); setShowMenu(false); },
    variant: "default",
    separator: true 
  },
  
  // ... existing danger options ...
];
```

### Adicionar Estados e Modais no ChatHeader

```typescript
// Add states
const [isSalesFunnelOpen, setIsSalesFunnelOpen] = useState(false);
const [isProtocolOpen, setIsProtocolOpen] = useState(false);
const [isRatingOpen, setIsRatingOpen] = useState(false);
const [isNotesOpen, setIsNotesOpen] = useState(false);
const [isExportOpen, setIsExportOpen] = useState(false);

// Add modals at the end of the component
<SalesFunnelModal
  isOpen={isSalesFunnelOpen}
  onClose={() => setIsSalesFunnelOpen(false)}
  contactId={conversation?.contact.id || ""}
  contactName={conversation?.contact.name || ""}
  isDarkMode={isDarkMode}
/>

<ProtocolModal
  isOpen={isProtocolOpen}
  onClose={() => setIsProtocolOpen(false)}
  conversationId={conversation?.id || ""}
  contactName={conversation?.contact.name || ""}
  isDarkMode={isDarkMode}
/>

<RatingModal
  isOpen={isRatingOpen}
  onClose={() => setIsRatingOpen(false)}
  conversationId={conversation?.id || ""}
  contactName={conversation?.contact.name || ""}
  isDarkMode={isDarkMode}
/>

<NotesModal
  isOpen={isNotesOpen}
  onClose={() => setIsNotesOpen(false)}
  contactId={conversation?.contact.id || ""}
  contactName={conversation?.contact.name || ""}
  isDarkMode={isDarkMode}
/>

<ExportChatModal
  isOpen={isExportOpen}
  onClose={() => setIsExportOpen(false)}
  conversationId={conversation?.id || ""}
  contactName={conversation?.contact.name || ""}
  contact={conversation?.contact}
  messages={[]} // Pass actual messages from conversation
  isDarkMode={isDarkMode}
/>
```

## Configuração do Sonner Toast

Adicionar o componente Toaster no layout raiz (layout.tsx):

```typescript
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2c33',
              color: '#e9edef',
              border: '1px solid #374045',
            },
          }}
        />
      </body>
    </html>
  );
}
```

## API Hooks (Opcional)

Criar arquivo src/hooks/use-contact-features.ts:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useContactFeatures(contactId: string) {
  const queryClient = useQueryClient();

  // Pipeline
  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", contactId],
    queryFn: () => fetchPipeline(contactId),
    enabled: !!contactId,
  });

  const updatePipeline = useMutation({
    mutationFn: (data: PipelineData) => updatePipelineApi(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", contactId] });
      toast.success("Funil atualizado!");
    },
  });

  // Notes
  const { data: notes } = useQuery({
    queryKey: ["notes", contactId],
    queryFn: () => fetchNotes(contactId),
    enabled: !!contactId,
  });

  const addNote = useMutation({
    mutationFn: (data: NoteData) => addNoteApi(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", contactId] });
      toast.success("Nota adicionada!");
    },
  });

  // Tags
  const { data: tags } = useQuery({
    queryKey: ["tags", contactId],
    queryFn: () => fetchTags(contactId),
    enabled: !!contactId,
  });

  const updateTags = useMutation({
    mutationFn: (tags: string[]) => updateTagsApi(contactId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", contactId] });
      toast.success("Tags atualizadas!");
    },
  });

  return {
    pipeline,
    notes,
    tags,
    updatePipeline,
    addNote,
    updateTags,
  };
}
```

## Testes

Verificar TypeScript:
```bash
npx tsc --noEmit
```

Verificar ESLint:
```bash
npm run lint
```

## Troubleshooting

1. **Erro Zod**: Certifique-se de usar `result.error.issues` em vez de `result.error.errors`
2. **Erro jsPDF**: Instalar `@types/jspdf` se necessário
3. **Sonner não aparece**: Verificar se o componente Toaster está no layout
