import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// POST /api/whatsapp/sessions - Criar nova sessão
export async function POST(request: NextRequest) {
  try {
    console.log('[API WhatsApp] Iniciando criação de sessão...');
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[API WhatsApp] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    console.log('[API WhatsApp] Usuário autenticado:', user.id);

    // Obtém o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[API WhatsApp] Erro ao buscar perfil:', profileError);
    }

    if (!profile) {
      console.log('[API WhatsApp] Perfil não encontrado');
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }
    console.log('[API WhatsApp] Perfil encontrado:', { company_id: profile.company_id, role: profile.role });

    // Verifica permissões
    if (
      profile.role !== 'SUPER_USER' &&
      profile.role !== 'CLIENT_ADMIN' &&
      profile.role !== 'CLIENT_MANAGER'
    ) {
      console.log('[API WhatsApp] Permissão negada:', profile.role);
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Obtém os dados da requisição
    const body = await request.json();
    const { name } = body;
    console.log('[API WhatsApp] Dados recebidos:', { name });

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da conexão é obrigatório' },
        { status: 400 }
      );
    }

    // Cria a sessão
    console.log('[API WhatsApp] Criando sessão Baileys...');
    const service = new BaileysService('', profile.company_id);
    const session = await service.createSession(name.trim());
    console.log('[API WhatsApp] Sessão criada com sucesso:', session.id);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('[API WhatsApp] Erro detalhado ao criar sessão:', error);
    if (error instanceof Error) {
      console.error('[API WhatsApp] Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/sessions - Listar sessões
export async function GET(request: NextRequest) {
  try {
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

    // Lista as sessões
    const sessions = await BaileysService.listSessions(profile.company_id);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
