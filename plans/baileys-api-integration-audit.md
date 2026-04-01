# Plano de Auditoria e Integração Completa das APIs Baileys

## 📋 Objetivo
Pesquisar todas as APIs REST disponíveis no Baileys, integrar com a interface visual do WhatsLidia e validar a implementação no banco de dados.

---

## 🔍 Pesquisa de APIs Baileys Disponíveis

### 1. **Gerenciamento de Sessões**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions` | GET | Listar todas as sessões | ✅ Implementado |
| `/api/whatsapp/sessions` | POST | Criar nova sessão | ✅ Implementado |
| `/api/whatsapp/sessions/[id]` | GET | Obter detalhes da sessão | ✅ Implementado |
| `/api/whatsapp/sessions/[id]` | DELETE | Deletar sessão | ✅ Implementado |
| `/api/whatsapp/sessions/[id]/qr` | GET | Obter QR code | ✅ Implementado |

### 2. **Gerenciamento de Mensagens**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions/[id]/messages` | GET | Listar mensagens | ✅ Implementado |
| `/api/whatsapp/sessions/[id]/messages` | POST | Enviar mensagem | ✅ Implementado |
| `/api/whatsapp/sessions/[id]/messages/[msgId]` | DELETE | Deletar mensagem | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/messages/[msgId]/react` | POST | Reagir a mensagem | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/messages/[msgId]/forward` | POST | Encaminhar mensagem | ❌ Não Implementado |

### 3. **Gerenciamento de Contatos**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions/[id]/contacts` | GET | Listar contatos | ✅ Implementado |
| `/api/whatsapp/sessions/[id]/contacts` | POST | Adicionar contato | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/contacts/[phone]` | GET | Obter detalhes do contato | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/contacts/[phone]` | PUT | Atualizar contato | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/contacts/[phone]` | DELETE | Deletar contato | ❌ Não Implementado |

### 4. **Gerenciamento de Grupos**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions/[id]/groups` | GET | Listar grupos | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups` | POST | Criar grupo | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]` | GET | Obter detalhes do grupo | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]` | PUT | Atualizar grupo | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]` | DELETE | Deletar grupo | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]/members` | GET | Listar membros | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]/members` | POST | Adicionar membro | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/groups/[groupId]/members/[memberId]` | DELETE | Remover membro | ❌ Não Implementado |

### 5. **Status e Presença**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions/[id]/status` | GET | Obter status da sessão | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/presence` | GET | Obter presença do usuário | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/presence` | PUT | Atualizar presença | ❌ Não Implementado |

### 6. **Mídia e Arquivos**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/sessions/[id]/media/upload` | POST | Upload de mídia | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/media/[mediaId]` | GET | Download de mídia | ❌ Não Implementado |
| `/api/whatsapp/sessions/[id]/media/[mediaId]` | DELETE | Deletar mídia | ❌ Não Implementado |

### 7. **Webhooks e Eventos**
| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/whatsapp/webhooks` | GET | Listar webhooks | ❌ Não Implementado |
| `/api/whatsapp/webhooks` | POST | Registrar webhook | ❌ Não Implementado |
| `/api/whatsapp/webhooks/[id]` | DELETE | Remover webhook | ❌ Não Implementado |

---

## 🎯 Prioridades de Implementação

### **Fase 1: Crítica** (Funcionalidade Básica)
- [x] Gerenciamento de Sessões (QR, Criar, Listar, Deletar)
- [x] Envio e Recebimento de Mensagens
- [x] Listar Contatos
- [ ] Status de Mensagens (Entregue, Lido, Falha)
- [ ] Presença do Usuário (Online, Offline, Digitando)

### **Fase 2: Importante** (Funcionalidade Intermediária)
- [ ] Reações em Mensagens
- [ ] Encaminhar Mensagens
- [ ] Deletar Mensagens
- [ ] Gerenciamento de Grupos
- [ ] Upload/Download de Mídia

### **Fase 3: Desejável** (Funcionalidade Avançada)
- [ ] Webhooks
- [ ] Gerenciamento Avançado de Contatos
- [ ] Busca de Mensagens
- [ ] Arquivamento de Conversas

---

## 📊 Mapeamento de Banco de Dados

### Tabelas Necessárias

#### `whatsapp_sessions`
```sql
- id (UUID)
- user_id (UUID)
- company_id (UUID)
- phone (VARCHAR)
- status (ENUM: 'connecting', 'connected', 'disconnected', 'error')
- qr_code (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_activity (TIMESTAMP)
```

#### `whatsapp_contacts`
```sql
- id (UUID)
- session_id (UUID)
- phone (VARCHAR)
- name (VARCHAR)
- profile_picture (TEXT)
- status (ENUM: 'active', 'inactive')
- last_message_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `whatsapp_messages`
```sql
- id (UUID)
- session_id (UUID)
- contact_phone (VARCHAR)
- content (TEXT)
- type (ENUM: 'text', 'image', 'video', 'audio', 'document', 'sticker')
- direction (ENUM: 'incoming', 'outgoing')
- status (ENUM: 'sent', 'delivered', 'read', 'failed')
- message_id (VARCHAR) - ID do WhatsApp
- timestamp (TIMESTAMP)
- created_at (TIMESTAMP)
- metadata (JSONB)
```

#### `whatsapp_groups` (Nova)
```sql
- id (UUID)
- session_id (UUID)
- group_id (VARCHAR)
- name (VARCHAR)
- description (TEXT)
- profile_picture (TEXT)
- member_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `whatsapp_group_members` (Nova)
```sql
- id (UUID)
- group_id (UUID)
- contact_phone (VARCHAR)
- role (ENUM: 'admin', 'member')
- joined_at (TIMESTAMP)
```

#### `whatsapp_media` (Nova)
```sql
- id (UUID)
- session_id (UUID)
- message_id (UUID)
- file_name (VARCHAR)
- file_size (INTEGER)
- mime_type (VARCHAR)
- file_path (TEXT)
- url (TEXT)
- created_at (TIMESTAMP)
```

---

## 🔌 Integração Visual

### Componentes a Atualizar

#### 1. **ConversationList.tsx**
- [ ] Mostrar status de presença (Online/Offline)
- [ ] Indicador de digitação
- [ ] Último status de mensagem (✓, ✓✓, ✓✓ azul)
- [ ] Hora da última mensagem

#### 2. **ChatWindow.tsx**
- [ ] Mostrar status de presença do contato
- [ ] Indicador de digitação
- [ ] Status de cada mensagem
- [ ] Reações em mensagens
- [ ] Opção de encaminhar mensagem
- [ ] Opção de deletar mensagem

#### 3. **MessageBubble.tsx**
- [ ] Mostrar ícone de status (enviado, entregue, lido)
- [ ] Mostrar reações
- [ ] Menu de contexto (deletar, encaminhar, reagir)
- [ ] Timestamp preciso

#### 4. **Nova: GroupsView.tsx**
- [ ] Listar grupos
- [ ] Criar grupo
- [ ] Gerenciar membros
- [ ] Editar informações do grupo

#### 5. **Nova: MediaGallery.tsx**
- [ ] Galeria de mídia
- [ ] Download de arquivos
- [ ] Visualização de imagens/vídeos

---

## 🔄 Fluxo de Sincronização Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp (Baileys)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API REST (Next.js)                        │
│  - Sessions                                                 │
│  - Messages                                                 │
│  - Contacts                                                 │
│  - Groups                                                   │
│  - Media                                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                      │
│  - whatsapp_sessions                                        │
│  - whatsapp_contacts                                        │
│  - whatsapp_messages                                        │
│  - whatsapp_groups                                          │
│  - whatsapp_media                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Realtime Subscriptions (Supabase)              │
│  - Notificações de novas mensagens                          │
│  - Atualizações de status                                   │
│  - Mudanças em contatos                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Interface Visual (React)                   │
│  - ConversationList                                         │
│  - ChatWindow                                               │
│  - MessageBubble                                            │
│  - GroupsView                                               │
│  - MediaGallery                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Fase 1: Crítica
- [x] Sessões (Criar, Listar, Deletar, QR)
- [x] Mensagens (Enviar, Receber, Listar)
- [x] Contatos (Listar)
- [ ] Status de Mensagens (Implementar callbacks)
- [ ] Presença (Implementar indicadores)

### Fase 2: Importante
- [ ] Reações
- [ ] Encaminhar
- [ ] Deletar Mensagens
- [ ] Grupos (CRUD)
- [ ] Mídia (Upload/Download)

### Fase 3: Desejável
- [ ] Webhooks
- [ ] Busca
- [ ] Arquivamento
- [ ] Backup

---

## 📝 Próximos Passos

1. **Implementar Status de Mensagens**
   - Adicionar callbacks do Baileys
   - Atualizar banco de dados
   - Mostrar ícones na UI

2. **Implementar Presença**
   - Monitorar status online/offline
   - Mostrar indicador de digitação
   - Atualizar em tempo real

3. **Implementar Grupos**
   - Criar tabelas no banco
   - Implementar APIs
   - Criar interface visual

4. **Implementar Mídia**
   - Upload de arquivos
   - Download de mídia
   - Galeria de imagens

5. **Implementar Reações**
   - Adicionar reações a mensagens
   - Mostrar reações na UI
   - Sincronizar em tempo real

---

## 🎯 Resultado Esperado

Após implementação completa:
- ✅ Sistema totalmente sincronizado com WhatsApp
- ✅ Todas as funcionalidades do Baileys integradas
- ✅ Interface visual completa e responsiva
- ✅ Banco de dados normalizado e otimizado
- ✅ Sincronização em tempo real bidirecional
- ✅ Suporte a grupos, mídia e reações
