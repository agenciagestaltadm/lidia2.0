import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';
import QRCode from 'qrcode';

// GET /api/whatsapp/sessions/[id]/qr - Iniciar sessão e obter QR code (SSE)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[API QR] Requisição para sessão: ${id}`);

    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[API QR] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obtém o perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.log('[API QR] Perfil não encontrado');
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }
    console.log(`[API QR] Company ID: ${profile.company_id}`);

    // Verifica se a sessão existe e pertence à empresa
    console.log(`[API QR] Buscando sessão no banco...`);
    const session = await BaileysService.getSessionById(id, profile.company_id);

    if (!session) {
      console.log('[API QR] Sessão não encontrada');
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }
    console.log(`[API QR] Sessão encontrada: ${session.name}, status: ${session.status}`);

    // Verifica se já está conectado
    if (session.status === 'active' || session.status === 'connected') {
      console.log('[API QR] Sessão já está conectada');
      return NextResponse.json({
        status: 'connected',
        phone: session.phone_number,
        pushName: session.push_name,
      });
    }

    // Se já está ativa em memória, retorna status
    if (BaileysService.isSessionActive(id)) {
      return NextResponse.json({
        status: 'connecting',
        message: 'Sessão já está sendo iniciada',
      });
    }

    // Limpa dados de autenticação anteriores para garantir QR code novo
    console.log('[API QR] Limpando dados de autenticação anteriores...');
    await BaileysService.clearSessionAuth(id);

    // Cria uma resposta SSE
    const encoder = new TextEncoder();
    let qrGenerated = false;
    let connectionEstablished = false;

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;
        let timeoutId: NodeJS.Timeout | null = null;

        // Função helper para enviar dados de forma segura
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

        // Função helper para fechar controller de forma segura
        const safeClose = () => {
          if (!isClosed) {
            try {
              isClosed = true;
              controller.close();
            } catch (error) {
              console.log('[API QR] Error closing controller:', error);
            }
          }
          // Limpa o timeout se existir
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };

        // Envia evento de início
        safeEnqueue(
          encoder.encode(`event: status\ndata: ${JSON.stringify({ status: 'starting' })}\n\n`)
        );

        // Inicia a sessão
        const service = new BaileysService(id, profile.company_id);

        service
          .startSession(
            async (qr) => {
              // Callback quando QR é gerado
              if (isClosed || connectionEstablished) return;
              
              try {
                const qrDataUrl = await QRCode.toDataURL(qr);
                safeEnqueue(
                  encoder.encode(
                    `event: qr\ndata: ${JSON.stringify({ qr: qrDataUrl })}\n\n`
                  )
                );
                qrGenerated = true;
              } catch (error) {
                console.error('[API QR] Erro ao gerar QR code:', error);
              }
            },
            (status, phone, pushName) => {
              // Callback quando status muda
              if (isClosed) return;
              
              if (status === 'active' && !connectionEstablished) {
                connectionEstablished = true;
                safeEnqueue(
                  encoder.encode(
                    `event: connected\ndata: ${JSON.stringify({
                      status: 'connected',
                      phone,
                      pushName,
                    })}\n\n`
                  )
                );
                safeClose();
              } else if (status === 'disconnected') {
                safeEnqueue(
                  encoder.encode(
                    `event: disconnected\ndata: ${JSON.stringify({
                      status: 'disconnected',
                    })}\n\n`
                  )
                );
                safeClose();
              } else if (status === 'error') {
                // Erro de conexão reportado pelo Baileys (após todas as tentativas)
                safeEnqueue(
                  encoder.encode(
                    `event: error\ndata: ${JSON.stringify({
                      error: 'Erro de conexão',
                      message: pushName || 'Falha ao conectar com o WhatsApp. Tente novamente.',
                    })}\n\n`
                  )
                );
                safeClose();
              } else if (status === 'retrying') {
                // Baileys está tentando reconectar
                safeEnqueue(
                  encoder.encode(
                    `event: status\ndata: ${JSON.stringify({
                      status: 'retrying',
                      message: pushName || 'Reconectando...',
                    })}\n\n`
                  )
                );
              }
            }
          )
          .catch((error) => {
            console.error('[API QR] Erro ao iniciar sessão:', error);
            if (!isClosed) {
              safeEnqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({
                    error: 'Erro ao iniciar sessão',
                    message: error instanceof Error ? error.message : 'Erro desconhecido',
                  })}\n\n`
                )
              );
              safeClose();
            }
          });

        // Timeout de 5 minutos
        timeoutId = setTimeout(() => {
          if (!connectionEstablished && !isClosed) {
            console.log('[API QR] Timeout reached, closing connection');
            safeEnqueue(
              encoder.encode(
                `event: timeout\ndata: ${JSON.stringify({
                  status: 'timeout',
                  message: 'Tempo expirado. Tente novamente.',
                })}\n\n`
              )
            );
            safeClose();
          }
        }, 5 * 60 * 1000);

        // Cleanup quando a stream é cancelada
        return () => {
          console.log('[API QR] Stream cancelled, cleaning up');
          safeClose();
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
    console.error('[API QR] Erro ao obter QR code:', error);
    if (error instanceof Error) {
      console.error('[API QR] Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
