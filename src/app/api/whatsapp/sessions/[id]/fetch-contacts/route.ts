import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// GET /api/whatsapp/sessions/[id]/fetch-contacts
// Busca contatos diretamente do Baileys (não do Supabase)
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

    // Verifica se está ativa
    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Sessão não está ativa' },
        { status: 400 }
      );
    }

    // Busca contatos diretamente do Baileys
    const service = new BaileysService(id, profile.company_id);
    const contacts = await service.fetchContactsFromWhatsApp();

    // Retorna imediatamente (não espera salvar no Supabase)
    const response = NextResponse.json(contacts);

    // Salva no Supabase em background (não bloqueia a resposta)
    service.saveContactsToSupabase(contacts).catch((error: Error) => {
      console.error('[API] Erro ao salvar contatos no Supabase (background):', error);
    });

    return response;
  } catch (error) {
    console.error('[API] Erro ao buscar contatos do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contatos do WhatsApp' },
      { status: 500 }
    );
  }
}
