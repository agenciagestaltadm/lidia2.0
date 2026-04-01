import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List archived conversations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: archived, error, count } = await supabase
      .from('whatsapp_archived_conversations')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('archived_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      archived,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching archived conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived conversations' },
      { status: 500 }
    );
  }
}

// POST - Archive conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = id;
    const body = await request.json();
    const { contactPhone, contactName, reason } = body;

    if (!contactPhone) {
      return NextResponse.json(
        { error: 'Contact phone is required' },
        { status: 400 }
      );
    }

    const { data: archived, error } = await supabase
      .from('whatsapp_archived_conversations')
      .insert({
        session_id: sessionId,
        contact_phone: contactPhone,
        contact_name: contactName,
        reason,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - conversation already archived
        return NextResponse.json(
          { error: 'Conversation is already archived' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(archived, { status: 201 });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}

// DELETE - Unarchive conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = id;
    const body = await request.json();
    const { archiveId } = body;

    if (!archiveId) {
      return NextResponse.json(
        { error: 'Archive ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('whatsapp_archived_conversations')
      .delete()
      .eq('id', archiveId)
      .eq('session_id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to unarchive conversation' },
      { status: 500 }
    );
  }
}
