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
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se a sessão existe e pertence à empresa
    const session = await BaileysService.getSessionById(id, profile.company_id);

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Verifica se já está conectado
    if (session.status === 'active' || session.status === 'connected') {
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

    // Cria uma resposta SSE
    const encoder = new TextEncoder();
    let qrGenerated = false;
    let connectionEstablished = false;

    const stream = new ReadableStream({
      start(controller) {
        // Envia evento de início
        controller.enqueue(
          encoder.encode(`event: status\ndata: ${JSON.stringify({ status: 'starting' })}\n\n`)
        );

        // Inicia a sessão
        const service = new BaileysService(id, profile.company_id);

        service
          .startSession(
            async (qr) => {
              // Callback quando QR é gerado
              try {
                const qrDataUrl = await QRCode.toDataURL(qr);
                controller.enqueue(
                  encoder.encode(
                    `event: qr\ndata: ${JSON.stringify({ qr: qrDataUrl })}\n\n`
                  )
                );
                qrGenerated = true;
              } catch (error) {
                console.error('Erro ao gerar QR code:', error);
              }
            },
            (status, phone, pushName) => {
              // Callback quando status muda
              if (status === 'active' && !connectionEstablished) {
                connectionEstablished = true;
                controller.enqueue(
                  encoder.encode(
                    `event: connected\ndata: ${JSON.stringify({
                      status: 'connected',
                      phone,
                      pushName,
                    })}\n\n`
                  )
                );
                controller.close();
              } else if (status === 'disconnected') {
                controller.enqueue(
                  encoder.encode(
                    `event: disconnected\ndata: ${JSON.stringify({
                      status: 'disconnected',
                    })}\n\n`
                  )
                );
                controller.close();
              }
            }
          )
          .catch((error) => {
            console.error('Erro ao iniciar sessão:', error);
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  error: 'Erro ao iniciar sessão',
                })}\n\n`
              )
            );
            controller.close();
          });

        // Timeout de 5 minutos
        setTimeout(() => {
          if (!connectionEstablished) {
            controller.enqueue(
              encoder.encode(
                `event: timeout\ndata: ${JSON.stringify({
                  status: 'timeout',
                  message: 'Tempo expirado. Tente novamente.',
                })}\n\n`
              )
            );
            controller.close();
          }
        }, 5 * 60 * 1000);
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
    console.error('Erro ao obter QR code:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
