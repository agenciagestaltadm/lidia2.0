import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// GET /api/whatsapp/sessions/[id]/messages - Listar mensagens
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

    // Obtém parâmetros de query
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Busca mensagens
    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('session_id', id)
      .eq('contact_phone', phone);

    if (after) {
      query = query.gt('timestamp', after).order('timestamp', { ascending: true });
    } else {
      query = query.order('timestamp', { ascending: false }).limit(limit);
      if (before) {
        query = query.lt('timestamp', before);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      );
    }

    return NextResponse.json(after ? (messages || []) : (messages?.reverse() || []));
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/sessions/[id]/messages - Enviar mensagem
export async function POST(
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

    // Verifica se está ativa (estado válido para envio)
    console.log('[API] Session status:', session.status);
    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Sessão não está ativa', status: session.status },
        { status: 400 }
      );
    }

    // Obtém os dados da requisição
    const body = await request.json();
    const { phone, message, mediaType, mediaUrl, caption, fileName } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Se for mensagem de texto
    if (!mediaType) {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return NextResponse.json(
          { error: 'Mensagem é obrigatória' },
          { status: 400 }
        );
      }

      // Envia a mensagem de texto
      console.log('[API] Creating BaileysService...');
      const service = new BaileysService(id, profile.company_id, supabase);
      console.log('[API] BaileysService created, sending message...');
      const savedMessage = await service.sendMessage(phone, message.trim());
      console.log('[API] Message sent successfully:', savedMessage?.id);

      return NextResponse.json(savedMessage, { status: 201 });
    }

    // Se for mensagem com mídia
    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'URL da mídia é obrigatória' },
        { status: 400 }
      );
    }

    // Baixa a mídia da URL
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao baixar mídia' },
        { status: 400 }
      );
    }

    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());

     // Envia a mensagem com mídia
     const service = new BaileysService(id, profile.company_id, supabase);
     
     // Para áudio, tenta converter para formato suportado
     let finalMediaBuffer = mediaBuffer;
     let finalMediaType = mediaType as 'image' | 'video' | 'audio' | 'document' | 'sticker';
     
     if (mediaType === 'audio') {
       // Se for áudio, mantém o buffer como está
       // O Baileys vai lidar com a conversão se necessário
       console.log('[API] Enviando áudio:', { fileName, size: mediaBuffer.length, type: mediaType });
     }
     
     const savedMessage = await service.sendMediaMessage(
       phone,
       finalMediaBuffer,
       finalMediaType,
       caption,
       fileName
     );

     return NextResponse.json(savedMessage, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem', details: errorMessage },
      { status: 500 }
    );
  }
}
