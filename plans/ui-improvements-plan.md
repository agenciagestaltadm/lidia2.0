# Plano de Melhorias UI

## 1. Corrigir Posicionamento do Dropdown de Atalhos

**Problema:** O dropdown está aparecendo em cima do chat
**Solução:** Reposicionar para aparecer acima do input de texto

**Arquivo:** `QuickRepliesDropdown.tsx`
- Ajustar cálculo de posição para `top: inputRect.top - dropdownHeight - 10`
- Adicionar verificação de borda da tela

## 2. Popup de Emojis

**Funcionalidade:** Ao clicar no botão de emoji, abrir um picker de emojis

**Novo arquivo:** `EmojiPicker.tsx` ou usar biblioteca
- Opção 1: Implementar picker próprio com categorias
- Opção 2: Usar `emoji-picker-react` (mais simples)

**Características:**
- Posicionamento: acima do botão de emoji
- Z-index: z-[102]
- Categorias: Smileys, Pessoas, Animais, Comidas, Atividades, Viagens, Objetos, Símbolos, Bandeiras
- Barra de busca
- Emoji recentes

## 3. Gravação de Áudio (Estilo WhatsApp)

**Design baseado na imagem:**
- Layout horizontal com:
  - Botão de lixeira (esquerda) - cancelar
  - Ponto vermelho pulsante + timer
  - Visualizador de ondas de áudio (barras animadas)
  - Botão de pausa/play
  - Botão de enviar (direita)

**Implementação:**
- Usar MediaRecorder API para gravação real
- Criar visualização de ondas com canvas ou barras animadas
- Timer funcionando
- Envio do áudio como mensagem

**Novo arquivo:** `AudioRecorder.tsx`
- Estados: idle, recording, paused, recorded
- Visualização de ondas em tempo real
- Controles: gravar, pausar, continuar, cancelar, enviar

**Integração com MessageInput:**
- Ao clicar no microfone, trocar para modo de gravação
- Esconder input de texto
- Mostrar interface de gravação
- Ao enviar, criar mensagem do tipo 'audio'

## Checklist

- [x] Corrigir posicionamento do QuickRepliesDropdown
- [x] Criar/install EmojiPicker
- [x] Integrar EmojiPicker no MessageInput
- [x] Criar componente AudioRecorder
- [x] Implementar MediaRecorder API
- [x] Criar visualização de ondas
- [x] Integrar AudioRecorder no MessageInput
- [x] Testar envio de áudio
- [x] Build e verificação

## Resumo das Implementações

### 1. Corrigido Posicionamento do Dropdown de Atalhos ✅
**Arquivo:** `QuickRepliesDropdown.tsx`
- Agora detecta espaço disponível na tela
- Se não houver espaço acima, mostra abaixo do input
- Animação ajustada conforme posição (acima/abaixo)
- Z-index z-[102]

### 2. Emoji Picker ✅
**Biblioteca:** `emoji-picker-react`
- Ao clicar no botão de emoji, abre picker
- Tema automático (dark/light)
- Dimensões: 350x400
- Ao selecionar emoji, insere no input
- Z-index z-[102]

### 3. Gravação de Áudio Estilo WhatsApp ✅
**Arquivo:** `AudioRecorder.tsx`
- Design igual à imagem de referência:
  - Botão lixeira (cancelar)
  - Ponto vermelho pulsando durante gravação
  - Timer MM:SS
  - Visualização de ondas animadas (40 barras)
  - Botão pausa/play
  - Botão enviar

**Funcionalidades:**
- Gravação real com MediaRecorder API
- Visualização em tempo real com AudioContext
- Pausar e continuar gravação
- Cancelar (descarta áudio)
- Enviar áudio como mensagem tipo 'audio'
- Formato: webm

### Arquivos Modificados/Criados:
- `lidia2.0/src/components/whatslidia/QuickRepliesDropdown.tsx`
- `lidia2.0/src/components/whatslidia/AudioRecorder.tsx` (novo)
- `lidia2.0/src/components/whatslidia/MessageInput.tsx`

### Build ✅
- Compilação bem-sucedida sem erros!
