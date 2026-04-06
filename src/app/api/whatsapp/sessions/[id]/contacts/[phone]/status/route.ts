import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/whatsapp/sessions/[id]/contacts/[phone]/status - Update conversation status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phone: string }> }
) {
  try {
    const { id, phone } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get user profile
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

    // Verify session belongs to company
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('id')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['open', 'pending', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: open, pending, resolved' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      conversation_status: status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps based on status
    if (status === 'open') {
      updateData.opened_at = new Date().toISOString();
      updateData.unread_count = 0;
      updateData.has_new_messages = false;
    } else if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.unread_count = 0;
      updateData.has_new_messages = false;
    }

    // Update contact
    const { data: updatedContact, error } = await supabase
      .from('whatsapp_contacts')
      .update(updateData)
      .eq('session_id', id)
      .eq('phone', phone)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da conversa' },
        { status: 500 }
      );
    }

    if (!updatedContact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: updatedContact,
      message: `Conversa movida para ${status === 'open' ? 'Abertas' : status === 'pending' ? 'Pendentes' : 'Resolvidas'}`,
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/sessions/[id]/contacts/[phone]/status - Get conversation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phone: string }> }
) {
  try {
    const { id, phone } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Get contact with status
    const { data: contact, error } = await supabase
      .from('whatsapp_contacts')
      .select('phone, name, conversation_status, unread_count, has_new_messages, opened_at, resolved_at')
      .eq('session_id', id)
      .eq('phone', phone)
      .single();

    if (error || !contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      contact: {
        phone: contact.phone,
        name: contact.name,
        status: contact.conversation_status,
        unreadCount: contact.unread_count,
        hasNewMessages: contact.has_new_messages,
        openedAt: contact.opened_at,
        resolvedAt: contact.resolved_at,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
