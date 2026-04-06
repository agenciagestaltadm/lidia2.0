import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// Configuração para Node.js runtime (não Edge) - necessário para Baileys
export const runtime = 'nodejs';
export const maxDuration = 30;

// GET /api/whatsapp/sessions/[id]/fetch-messages?phone=xxx
// Busca mensagens diretamente do Baileys (não do Supabase)
// Retorna imediatamente, salva no Supabase em background
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

    // Obtém perfil do usuário
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

    // Verifica se sessão existe e pertence à empresa
    const session = await BaileysService.getSessionById(id, profile.company_id);

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Verifica se está ativa ou conectando (estados válidos)
    const validStatuses = ['active', 'connecting'];
    if (!validStatuses.includes(session.status)) {
      return NextResponse.json(
        { error: 'Sessão não está ativa', status: session.status },
        { status: 400 }
      );
    }

    // Obtém parâmetros de query
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Tenta usar socket existente em memória primeiro
    const existingSocket = BaileysService.getSession(id);
    let messages: any[] = [];

    if (existingSocket) {
      const service = new BaileysService(id, profile.company_id);
      messages = await service.fetchMessagesFromWhatsApp(phone, limit);
    }

    // Fallback para Supabase se não encontrou mensagens em memória
    if (messages.length === 0) {
      console.log('[API] Nenhuma mensagem em memória, buscando do Supabase...');
      const { data: supabaseMessages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('session_id', id)
        .eq('contact_phone', phone)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      messages = supabaseMessages || [];
    }

    const response = NextResponse.json(messages);

    // Salva no Supabase em background se veio do Baileys
    if (messages.length > 0 && existingSocket) {
      const service = new BaileysService(id, profile.company_id);
      service.saveMessagesToSupabase(messages).catch((error: Error) => {
        console.error('[API] Erro ao salvar mensagens no Supabase (background):', error);
      });
    }

    return response;
  } catch (error) {
    console.error('[API] Erro ao buscar mensagens do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens do WhatsApp' },
      { status: 500 }
    );
  }
}
