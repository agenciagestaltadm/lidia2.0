import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Advanced message search
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: sessionId } = await params;
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const hasReactions = searchParams.get('hasReactions');
    const isDeleted = searchParams.get('isDeleted');
    const isForwarded = searchParams.get('isForwarded');

    let searchQuery = supabase
      .from('whatsapp_message_search_index')
      .select(
        `
        id,
        message_id,
        search_text,
        message_type,
        contact_phone,
        is_from_me,
        created_at,
        whatsapp_messages:message_id (
          id,
          message_text,
          caption,
          message_type,
          contact_phone,
          is_from_me,
          is_deleted,
          is_forwarded,
          reaction_count,
          forward_count,
          created_at
        )
        `,
        { count: 'exact' }
      )
      .eq('session_id', sessionId);

    // Full-text search
    if (query) {
      searchQuery = searchQuery.or(
        `search_text.ilike.%${query}%`
      );
    }

    // Filter by contact (from)
    if (from) {
      searchQuery = searchQuery.eq('contact_phone', from);
    }

    // Filter by message type
    if (type) {
      searchQuery = searchQuery.eq('message_type', type);
    }

    // Filter by date range
    if (dateFrom) {
      searchQuery = searchQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      searchQuery = searchQuery.lte('created_at', dateTo);
    }

    // Filter by reactions
    if (hasReactions === 'true') {
      searchQuery = searchQuery.gt('reaction_count', 0);
    } else if (hasReactions === 'false') {
      searchQuery = searchQuery.eq('reaction_count', 0);
    }

    // Filter by deleted status
    if (isDeleted === 'true') {
      searchQuery = searchQuery.eq('is_deleted', true);
    } else if (isDeleted === 'false') {
      searchQuery = searchQuery.eq('is_deleted', false);
    }

    // Filter by forwarded status
    if (isForwarded === 'true') {
      searchQuery = searchQuery.eq('is_forwarded', true);
    } else if (isForwarded === 'false') {
      searchQuery = searchQuery.eq('is_forwarded', false);
    }

    const { data: results, error, count } = await searchQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Extract messages from results
    const messages = results?.map((r: any) => r.whatsapp_messages).filter(Boolean) || [];

    return NextResponse.json({
      results: messages,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
