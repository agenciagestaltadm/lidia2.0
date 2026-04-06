import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// GET /api/whatsapp/sessions/[id]/contacts - Listar contatos
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
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Busca contatos
    let query = supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('session_id', id)
      .order('last_message_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Erro ao buscar contatos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar contatos' },
        { status: 500 }
      );
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/sessions/[id]/contacts/sync - Sincronizar contatos
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

   // Verifica se está ativa ou conectando (estados válidos)
   const validStatuses = ['active', 'connecting'];
   if (!validStatuses.includes(session.status)) {
     return NextResponse.json(
       { error: 'Sessão não está ativa', status: session.status },
       { status: 400 }
     );
   }

   // Sincroniza contatos
   const service = new BaileysService(id, profile.company_id);
   const syncedContacts = await service.syncContacts();

   return NextResponse.json(syncedContacts, { status: 200 });
 } catch (error) {
   console.error('Erro ao sincronizar contatos:', error);
   return NextResponse.json(
     { error: 'Erro ao sincronizar contatos' },
     { status: 500 }
   );
 }
}
