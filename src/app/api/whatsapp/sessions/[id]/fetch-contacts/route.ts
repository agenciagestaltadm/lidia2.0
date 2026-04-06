import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BaileysService } from '@/lib/whatsapp/baileys-service';

// Configuração para Node.js runtime (não Edge) - necessário para Baileys
export const runtime = 'nodejs';
export const maxDuration = 30;

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

    // Verifica se está ativa ou conectando (estados válidos)
    console.log(`[API fetch-contacts] Session ${id} status:`, session.status);
    const validStatuses = ['active', 'connecting'];
    if (!validStatuses.includes(session.status)) {
      console.log(`[API fetch-contacts] Session not in valid state: ${session.status}`);
      return NextResponse.json(
        { error: 'Sessão não está ativa', status: session.status },
        { status: 400 }
      );
    }

    // Busca contatos diretamente do Baileys
    console.log(`[API fetch-contacts] Creating BaileysService and fetching contacts...`);
    const service = new BaileysService(id, profile.company_id, supabase);
    const contacts = await service.fetchContactsFromWhatsApp();
    console.log(`[API fetch-contacts] ${contacts.length} contacts fetched from WhatsApp`);

    // Buscar últimas mensagens dos contatos do Supabase
    console.log(`[API fetch-contacts] Fetching last messages from Supabase...`);
    const { data: lastMessages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('session_id', id)
      .order('timestamp', { ascending: false })
      .limit(1000);

    // Mapear última mensagem por contato (primeira ocorrência é a mais recente)
    const lastMessageByContact = new Map();
    lastMessages?.forEach((msg: any) => {
      if (!lastMessageByContact.has(msg.contact_phone)) {
        lastMessageByContact.set(msg.contact_phone, msg);
      }
    });

    console.log(`[API fetch-contacts] ${lastMessageByContact.size} last messages mapped`);

    // Adicionar last_message aos contatos
    const contactsWithLastMessage = contacts.map((contact: any) => ({
      ...contact,
      last_message: lastMessageByContact.get(contact.phone) || null
    }));

    // Retorna imediatamente (não espera salvar no Supabase)
    const response = NextResponse.json(contactsWithLastMessage);

    // Salva no Supabase em background (não bloqueia a resposta)
    service.saveContactsToSupabase(contacts).catch((error: Error) => {
      console.error('[API] Erro ao salvar contatos no Supabase (background):', error);
    });

    return response;
  } catch (error) {
    console.error('[API] Erro ao buscar contatos do WhatsApp:', error);
    if (error instanceof Error) {
      console.error('[API] Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erro ao buscar contatos do WhatsApp', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
