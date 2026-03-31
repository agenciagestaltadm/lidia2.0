import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// POST /api/whatsapp/sessions - Criar nova sessão
export async function POST(request: NextRequest) {
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

    // Verifica permissões
    if (
      profile.role !== 'SUPER_USER' &&
      profile.role !== 'CLIENT_ADMIN' &&
      profile.role !== 'CLIENT_MANAGER'
    ) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Obtém os dados da requisição
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da conexão é obrigatório' },
        { status: 400 }
      );
    }

    // Cria a sessão
    const service = new BaileysService('', profile.company_id);
    const session = await service.createSession(name.trim());

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
