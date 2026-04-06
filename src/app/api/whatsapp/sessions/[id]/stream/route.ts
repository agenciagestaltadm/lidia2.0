import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Mapa global de listeners por sessão
const messageListeners = new Map<string, Set<(message: any) => void>>();
const contactListeners = new Map<string, Set<(contact: any) => void>>();

// Função para notificar listeners de mensagens
export function notifyMessageListeners(sessionId: string, message: any) {
  const listeners = messageListeners.get(sessionId);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[Stream] Error notifying message listener:', error);
      }
    });
  }
}

// Função para notificar listeners de contatos
export function notifyContactListeners(sessionId: string, contact: any) {
  const listeners = contactListeners.get(sessionId);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(contact);
      } catch (error) {
        console.error('[Stream] Error notifying contact listener:', error);
      }
    });
  }
}

// GET /api/whatsapp/sessions/[id]/stream - SSE para mensagens e contatos em tempo real
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log(`[API Stream] Starting SSE stream for session: ${id}, phone: ${phone}`);

    const supabase = await createClient();

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obtém perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verifica sessão
    const session = await BaileysService.getSessionById(id, profile.company_id);
    if (!session) {
      console.error(`[API Stream] Session not found: ${id}`);
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    // Verifica se está ativa ou conectando (estados válidos para SSE)
    const validStatuses = ['active', 'connecting'];
    if (!validStatuses.includes(session.status)) {
      console.warn(`[API Stream] Session ${id} not in valid state for SSE. Status: ${session.status}`);
      return NextResponse.json(
        { error: 'Sessão não está ativa', status: session.status },
        { status: 400 }
      );
    }

    console.log(`[API Stream] Starting SSE stream for session: ${id}, phone: ${phone}, status: ${session.status}`);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch (error) {
              isClosed = true;
            }
          }
        };

        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch (error) {}
          }
        };

        // Registra listeners
        const messageCallback = (message: any) => {
          // Se phone foi especificado, filtra por contato
          if (phone && message.contact_phone !== phone) return;
          
          safeEnqueue(encoder.encode(
            `event: message\ndata: ${JSON.stringify(message)}\n\n`
          ));
        };

        const contactCallback = (contact: any) => {
          safeEnqueue(encoder.encode(
            `event: contact\ndata: ${JSON.stringify(contact)}\n\n`
          ));
        };

        // Adiciona aos listeners globais
        if (!messageListeners.has(id)) {
          messageListeners.set(id, new Set());
        }
        messageListeners.get(id)!.add(messageCallback);

        if (!contactListeners.has(id)) {
          contactListeners.set(id, new Set());
        }
        contactListeners.get(id)!.add(contactCallback);

        console.log(`[API Stream] Listeners registered for session ${id}`);

        // Envia evento de conexão
        safeEnqueue(encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ sessionId: id, phone })}\n\n`
        ));

        // Cleanup após 5 minutos de inatividade
        const timeout = setTimeout(() => {
          console.log(`[API Stream] Timeout for session ${id}`);
          safeClose();
        }, 5 * 60 * 1000);

        // Cleanup
        return () => {
          clearTimeout(timeout);
          messageListeners.get(id)?.delete(messageCallback);
          contactListeners.get(id)?.delete(contactCallback);
          console.log(`[API Stream] Listeners removed for session ${id}`);
        };
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API Stream] Error creating SSE stream: ${errorMessage}`);
    
    // Log detalhado do erro para debugging
    if (error instanceof Error && error.stack) {
      console.error('[API Stream] Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar stream', details: errorMessage },
      { status: 500 }
    );
  }
}
