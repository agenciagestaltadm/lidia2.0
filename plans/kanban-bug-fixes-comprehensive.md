# Plano de Correção Completa - Bugs do Kanban

## Bugs Identificados pelo Usuário

### 1. ❌ Não consegue trocar de quadro nem visualizar todos
**Problema:** Após criar um board, não há como voltar à lista ou trocar
**Solução:** 
- Verificar se o botão "Trocar Quadro" está funcionando
- Garantir que a lista de boards apareça quando clicado

### 2. ❌ Sistema de lupa e filtros não funcionam
**Problema:** Filtros não aplicam aos cards
**Solução:**
- Implementar lógica de filtro no KanbanBoard
- Conectar filtros à visualização de cards

### 3. ❌ Botões "+" e configurações aparecem cortados
**Problema:** Modais aparecem dentro do elemento pai
**Solução:**
- Usar portal ou fixed positioning para modais
- Garantir z-index alto

### 4. ❌ Adicionar membro não mostra usuários da empresa
**Problema:** Tem que digitar email manualmente
**Solução:**
- Criar endpoint para listar usuários da empresa
- Usar dropdown/select ao invés de input

### 5. ❌ Menu dos 3 pontinhos da coluna não aparece
**Problema:** Menu de ações da coluna não funciona
**Solução:**
- Verificar KanbanColumn
- Implementar dropdown menu funcional

### 6. ❌ Erro ao criar card: company_id null
**Problema:** Hook useCard não passa company_id
**Solução:**
- Corrigir hook para incluir company_id
- Verificar mutation createCard

### 7. ❌ Elementos irresponsivos
**Problema:** Layout quebra em telas menores
**Solução:**
- Revisar CSS/tailwind classes
- Garantir scroll horizontal em mobile

## Tarefas de Correção

### Fase 1: Correções Críticas
- [ ] Corrigir erro company_id no createCard
- [ ] Corrigir menu dos 3 pontinhos da coluna
- [ ] Corrigir posicionamento dos modais
- [ ] Verificar botão "Trocar Quadro"

### Fase 2: Funcionalidades
- [ ] Implementar filtros funcionais
- [ ] Criar dropdown de usuários para membros
- [ ] Adicionar contatos aos cards

### Fase 3: Responsividade
- [ ] Revisar layout responsivo
- [ ] Testar em diferentes tamanhos de tela

## Arquivos para Modificar

1. `use-kanban.ts` - Corrigir createCard mutation
2. `KanbanColumn.tsx` - Menu de ações
3. `NewCardDialog.tsx` - Passar company_id
4. `ManageMembersModal.tsx` - Dropdown de usuários
5. `KanbanBoard.tsx` - Filtros e responsividade
6. `KanbanFilters.tsx` - Conectar aos cards

## Notas Técnicas

### Erro company_id
O hook useCard provavelmente não está passando company_id no insert. Precisa:
1. Adicionar company_id ao CreateCardInput
2. Passar company_id na mutation

### Menu de Coluna
Precisa verificar se o DropdownMenu do Radix está configurado corretamente no KanbanColumn.

### Modais Cortados
Usar `fixed` ao invés de `absolute` e garantir `z-50` ou maior.
