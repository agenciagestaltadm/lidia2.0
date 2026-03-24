# Plano de Implementação Completa - Sistema Kanban

## Problemas Identificados
1. Interface vazia - apenas loading spinner
2. Falta botões de ação (criar/editar/deletar colunas e cards)
3. Falta botão de editar board
4. Falta botão de gerenciar membros
5. Drag-and-drop pode não estar funcional

## Objetivo
Criar uma interface Kanban 100% funcional com todas as operações de CRUD

## Arquivos a Modificar

### 1. KanbanBoard.tsx - Interface Principal
**Problema:** Loading infinito, falta funcionalidades
**Solução:**
- Adicionar timeout no loading para detectar erro
- Mostrar mensagem de erro se falhar
- Adicionar botão "Criar Primeira Coluna" quando não houver colunas
- Garantir que colunas e cards apareçam
- Adicionar botões de ação no header

### 2. BoardHeader.tsx - Header do Board
**Problema:** Botões não funcionais ou inexistentes
**Solução:**
- Botão "Editar Board" com modal
- Botão "Gerenciar Membros" com modal
- Botão "Adicionar Coluna"
- Mostrar informações do board (nome, descrição)

### 3. KanbanColumn.tsx - Colunas
**Problema:** Falta botões de ação
**Solução:**
- Menu de ações (editar, deletar)
- Botão "Adicionar Card"
- Mostrar contagem de cards
- Indicador de WIP limit

### 4. KanbanCard.tsx - Cards
**Problema:** Falta funcionalidades
**Solução:**
- Clique para abrir modal de detalhes
- Menu de ações (editar, deletar, mover)
- Mostrar labels, membros, due date
- Indicador de prioridade

### 5. Novos Componentes Necessários
- **EditBoardModal.tsx** - Editar nome/descrição do board
- **ManageMembersModal.tsx** - Adicionar/remover membros
- **EditColumnModal.tsx** - Editar nome/cor/WIP da coluna
- **CreateCardModal.tsx** - Criar novo card
- **EditCardModal.tsx** - Editar card existente

### 6. Hooks - Correções
- **use-kanban.ts:**
  - Adicionar logging de erro
  - Garantir que erros sejam propagados
  - Adicionar retry nas queries

## Fluxo de Funcionalidades

### Criar Board (já existe)
1. Página mostra "Criar primeiro quadro"
2. Usuário preenche nome/descrição
3. Clica em "Criar"
4. Board é criado e selecionado automaticamente

### Visualizar Board
1. Board é carregado
2. Colunas são carregadas
3. Cards são carregados
4. Interface mostra colunas com cards

### Criar Coluna
1. Usuário clica em "Adicionar Coluna"
2. Modal abre com campo nome
3. Clica em "Criar"
4. Coluna aparece no board

### Criar Card
1. Usuário clica em "Adicionar Card" na coluna
2. Modal abre com título/descrição
3. Clica em "Criar"
4. Card aparece na coluna

### Mover Card (Drag-and-Drop)
1. Usuário arrasta card
2. Visual feedback durante drag
3. Soltar em outra coluna move o card
4. Persistência automática

### Editar Board
1. Usuário clica em "Editar" no header
2. Modal abre com nome/descrição atuais
3. Usuário edita e salva
4. Board é atualizado

### Gerenciar Membros
1. Usuário clica em "Membros" no header
2. Modal mostra membros atuais
3. Pode adicionar/remover membros
4. Salvar atualiza permissões

## Design da Interface

### Header do Board
```
┌─────────────────────────────────────────────────────┐
│ [Trocar Quadro] NOME DO BOARD          [⚙️] [👥] [+]│
│ Descrição do board...                               │
└─────────────────────────────────────────────────────┘
```

### Colunas
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ A FAZER   [⋯]│ │ EM ANDAMENTO │ │ CONCLUÍDO    │
│ [+ Adicionar]│ │ [+ Adicionar]│ │ [+ Adicionar]│
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Card 1       │ │ Card 3       │ │ Card 5       │
│ Card 2       │ │ Card 4       │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
       [+ Adicionar Coluna]
```

### Cards
```
┌────────────────────┐
│ [Label] [Label]    │
│ Título do Card     │
│                    │
│ 👤 👤        📅    │
└────────────────────┘
```

## Implementação Passo a Passo

### Fase 1: Correção do Loading (Prioridade Alta)
1. Adicionar timeout de 10s no loading
2. Mostrar erro se não carregar
3. Adicionar botão "Tentar Novamente"

### Fase 2: Header Funcional (Prioridade Alta)
1. Criar EditBoardModal
2. Criar ManageMembersModal
3. Adicionar botões no BoardHeader

### Fase 3: Colunas Funcionais (Prioridade Alta)
1. Criar EditColumnModal
2. Adicionar menu de ações nas colunas
3. Botão "Adicionar Card" em cada coluna

### Fase 4: Cards Funcionais (Prioridade Alta)
1. Criar CreateCardModal
2. Criar EditCardModal
3. Implementar clique no card

### Fase 5: Drag-and-Drop (Prioridade Média)
1. Garantir que @dnd-kit está configurado
2. Implementar handlers de drag
3. Persistir mudanças no banco

### Fase 6: Polimente (Prioridade Baixa)
1. Adicionar animações
2. Melhorar feedback visual
3. Adicionar tooltips

## Testes Necessários

1. **Criar board**: Deve criar e redirecionar
2. **Visualizar board**: Deve mostrar colunas e cards
3. **Criar coluna**: Deve aparecer imediatamente
4. **Criar card**: Deve aparecer na coluna
5. **Mover card**: Deve persistir no banco
6. **Editar board**: Deve atualizar título
7. **Gerenciar membros**: Deve adicionar/remover

## Notas Importantes

- O loading infinito provavelmente é causado pelas políticas RLS que ainda não foram aplicadas
- As queries simplificadas devem resolver o problema de recursão
- É importante ter feedback visual claro para todas as ações
- O drag-and-drop deve ter preview visual
