# Plano de Correção - Bugs do WhatsApp Lidia

## Resumo dos Problemas

O sistema WhatsApp Lidia apresenta 3 problemas críticos que precisam ser corrigidos:

1. **Mensagens recentes não carregam** - O sistema não exibe as mensagens recentes do WhatsApp conectado, nem as mensagens enviadas são salvas
2. **Visto de mensagem incorreto** - O visto muda para azul (lido) automaticamente sem o contato realmente abrir a mensagem
3. **Áudio/Arquivo não é enviado** - Quando o usuário envia áudio ou arquivo, apenas um ícone + texto é exibido, não o arquivo real

---

## Problema 1: Mensagens Recentes Não Carregam

### Causa Raiz
- O hook `use-whatsapp-messages.ts` implementa cache de 5 minutos que pode estar impedindo o carregamento de mensagens recentes
- A função `fetchMessages()` não está sendo forçada a atualizar quando uma conversa é selecionada
- Falta sincronização em tempo real via Supabase para novas mensagens

### Solução
1. **Forçar refresh ao trocar de conversa**
   - Adicionar `forceRefresh = true` quando `selectedContactPhone` muda
   - Limpar cache imediatamente ao selecionar nova conversa

2. **Implementar sincronização em tempo real**
   - Melhorar subscription do Supabase em `use-whatsapp-messages.ts`
   - Garantir que novas mensagens aparecem instantaneamente

3. **Melhorar carregamento inicial**
   - Aumentar limite de mensagens carregadas (de 50 para 100)
   - Implementar paginação infinita ao scroll para cima

### Arquivos a Modificar
- `src/hooks/use-whatsapp-messages.ts` - Melhorar cache e sincronização
- `src/components/whatslidia/WhatsLidiaRealLayout.tsx` - Forçar refresh ao trocar conversa
- `src/app/api/whatsapp/sessions/[id]/messages/route.ts` - Melhorar query de mensagens

---

## Problema 2: Visto de Mensagem Vai Direto para Azul

### Causa Raiz
- Em `ChatWindow.tsx` (linhas 88-100), o status é atualizado automaticamente com `setTimeout` sem confirmação real do WhatsApp
- Não há sincronização com o status real do Baileys
- O sistema simula o status em vez de receber confirmação real

### Solução
1. **Remover simulação de status**
   - Remover os `setTimeout` que atualizam status automaticamente
   - Manter apenas status "sent" até confirmação real

2. **Sincronizar com Baileys**
   - Implementar webhook/callback para receber confirmação de entrega
   - Implementar webhook/callback para receber confirmação de leitura
   - Atualizar status no banco apenas quando confirmado

3. **Melhorar API de envio**
   - Retornar status real da mensagem após envio
   - Implementar polling para atualizar status de mensagens antigas

### Arquivos a Modificar
- `src/components/whatslidia/ChatWindow.tsx` - Remover simulação de status
- `src/lib/whatsapp/baileys-service.ts` - Implementar callbacks de status
- `src/app/api/whatsapp/sessions/[id]/messages/route.ts` - Retornar status real

---

## Problema 3: Áudio/Arquivo Não é Enviado Corretamente

### Causa Raiz
- `AudioRecorder.tsx` cria um blob de áudio, mas não o envia realmente
- `MessageInput.tsx` não implementa envio de arquivo via API
- `MessageBubble.tsx` tenta renderizar áudio sem URL real
- Falta implementação de upload de arquivo para storage

### Solução
1. **Implementar envio real de áudio**
   - Converter blob de áudio para formato suportado (MP3/OGG)
   - Enviar arquivo via API com multipart/form-data
   - Armazenar arquivo no Supabase Storage ou servidor

2. **Melhorar API de envio de mídia**
   - Implementar endpoint para upload de arquivo
   - Retornar URL do arquivo armazenado
   - Salvar URL no banco de dados

3. **Melhorar renderização de áudio**
   - Usar URL real do arquivo em vez de blob
   - Implementar player de áudio funcional
   - Exibir waveform real do áudio

### Arquivos a Modificar
- `src/components/whatslidia/AudioRecorder.tsx` - Melhorar captura de áudio
- `src/components/whatslidia/MessageInput.tsx` - Implementar envio de arquivo
- `src/app/api/whatsapp/sessions/[id]/messages/route.ts` - Implementar upload
- `src/components/whatslidia/MessageBubble.tsx` - Usar URL real

---

## Fluxo de Implementação

### Fase 1: Corrigir Carregamento de Mensagens
1. Modificar `use-whatsapp-messages.ts` para forçar refresh
2. Melhorar sincronização em tempo real
3. Testar carregamento de mensagens recentes

### Fase 2: Corrigir Status de Mensagens
1. Remover simulação de status em `ChatWindow.tsx`
2. Implementar callbacks de status em `baileys-service.ts`
3. Sincronizar status com WhatsApp real

### Fase 3: Implementar Envio Real de Áudio/Arquivo
1. Melhorar `AudioRecorder.tsx` para captura correta
2. Implementar upload de arquivo na API
3. Melhorar renderização em `MessageBubble.tsx`

---

## Diagrama de Fluxo

```
Usuário seleciona conversa
    ↓
[PROBLEMA 1] Mensagens não carregam
    ↓
Usuário envia mensagem
    ↓
[PROBLEMA 2] Visto vai direto para azul
    ↓
Usuário envia áudio/arquivo
    ↓
[PROBLEMA 3] Apenas ícone é exibido
```

---

## Checklist de Implementação

- [ ] Fase 1: Carregamento de mensagens
  - [ ] Forçar refresh ao trocar conversa
  - [ ] Melhorar sincronização em tempo real
  - [ ] Testar carregamento

- [ ] Fase 2: Status de mensagens
  - [ ] Remover simulação de status
  - [ ] Implementar callbacks de status
  - [ ] Sincronizar com WhatsApp

- [ ] Fase 3: Áudio/Arquivo
  - [ ] Melhorar captura de áudio
  - [ ] Implementar upload
  - [ ] Melhorar renderização

- [ ] Testes finais
  - [ ] Testar carregamento de mensagens
  - [ ] Testar status de mensagens
  - [ ] Testar envio de áudio/arquivo
