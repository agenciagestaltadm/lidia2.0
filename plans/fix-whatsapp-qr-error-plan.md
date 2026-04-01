# Plano de Correção - Erro ao Gerar QR Code do WhatsApp

## Problema Identificado

Ocorrem dois erros principais ao tentar gerar o QR code do WhatsApp:

1. **Erro "Controller is already closed"** (backend)
   - O `setTimeout` na rota SSE tenta enviar dados através do controller, mas ele já foi fechado
   - Acontece quando a conexão é perdida ou o cliente desconecta antes do timeout

2. **Erro "Error data: {}"** (frontend)
   - O EventSource recebe um erro com dados vazios ou mal formatados
   - O usuário vê apenas "Erro desconhecido" sem detalhes

## Causa Raiz

No arquivo `src/app/api/whatsapp/sessions/[id]/qr/route.ts`:
- O timeout de 5 minutos não verifica se o controller ainda está aberto
- Não há cleanup do timeout quando a conexão é encerrada
- Os callbacks de erro não tratam exceções adequadamente

## Correções Necessárias

### 1. Corrigir Rota SSE (`route.ts`)

```typescript
// Adicionar controle de estado do controller
const stream = new ReadableStream({
  start(controller) {
    let isClosed = false;
    
    // Função helper para verificar antes de enqueue
    const safeEnqueue = (data: Uint8Array) => {
      if (!isClosed) {
        try {
          controller.enqueue(data);
        } catch (error) {
          console.log('[API QR] Controller already closed, skipping enqueue');
          isClosed = true;
        }
      }
    };
    
    // ... resto do código usando safeEnqueue
    
    // Timeout com verificação de estado
    const timeoutId = setTimeout(() => {
      if (!connectionEstablished && !isClosed) {
        safeEnqueue(
          encoder.encode(
            `event: timeout\ndata: ${JSON.stringify({
              status: 'timeout',
              message: 'Tempo expirado. Tente novamente.',
            })}\n\n`
          )
        );
        if (!isClosed) {
          controller.close();
          isClosed = true;
        }
      }
    }, 5 * 60 * 1000);
    
    // Cleanup ao fechar
    return () => {
      clearTimeout(timeoutId);
      isClosed = true;
    };
  },
});
```

### 2. Melhorar Tratamento de Erros no Hook (`use-whatsapp-qr.ts`)

```typescript
eventSource.addEventListener("error", (event) => {
  console.error("EventSource error:", event);
  let errorMessage = "Erro na conexão com o servidor";
  
  // Verificar se é erro de conexão ou dados
  if (!(event instanceof MessageEvent)) {
    errorMessage = "Erro de conexão. Verifique se o servidor está online.";
  } else {
    try {
      const data = JSON.parse(event.data || '{}');
      errorMessage = data.error || data.message || "Erro na conexão";
    } catch (e) {
      console.error("Failed to parse error data:", e);
    }
  }
  
  setState((prev) => ({
    ...prev,
    status: "error",
    loading: false,
  }));
  toast.error(errorMessage);
  eventSource.close();
});
```

### 3. Adicionar Try-Catch nos Callbacks do BaileysService

```typescript
// No baileys-service.ts, envolver callbacks em try-catch
if (qr && onQR) {
  try {
    onQR(qr);
    await supabase.from('whatsapp_qr_codes').insert({...});
  } catch (error) {
    console.error('[BaileysService] Error in QR callback:', error);
  }
}
```

## Checklist de Implementação

- [ ] Modificar `route.ts` para adicionar controle `isClosed`
- [ ] Substituir `controller.enqueue` por `safeEnqueue` com verificação
- [ ] Adicionar `clearTimeout` no cleanup da stream
- [ ] Melhorar tratamento de erro no `use-whatsapp-qr.ts`
- [ ] Adicionar try-catch nos callbacks do `baileys-service.ts`
- [ ] Testar cenário de timeout
- [ ] Testar cenário de desconexão do cliente
- [ ] Verificar logs no console

## Testes Sugeridos

1. **Teste de Timeout**: Deixar a página aberta por mais de 5 minutos sem escanear o QR
2. **Teste de Desconexão**: Fechar a aba do navegador enquanto o QR está sendo gerado
3. **Teste de Reconexão**: Tentar gerar QR code múltiplas vezes seguidas
4. **Teste de Erro**: Simular erro no BaileysService e verificar mensagem

## Notas

- O erro "Controller is already closed" é um erro interno do Node.js streams
- O erro não afeta a funcionalidade, mas polui os logs
- É importante garantir que o frontend mostre mensagens claras ao usuário
