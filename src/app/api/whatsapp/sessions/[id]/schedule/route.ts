import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List scheduled messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('whatsapp_scheduled_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: scheduled, error, count } = await query
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      scheduled,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled messages' },
      { status: 500 }
    );
  }
}

// POST - Schedule message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const {
      contactPhone,
      contactName,
      message,
      scheduledAt,
      mediaUrl,
      mediaType,
    } = body;

    if (!contactPhone || !message || !scheduledAt) {
      return NextResponse.json(
        { error: 'Contact phone, message, and scheduled time are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const { data: scheduled, error } = await supabase
      .from('whatsapp_scheduled_messages')
      .insert({
        session_id: sessionId,
        contact_phone: contactPhone,
        contact_name: contactName,
        message,
        scheduled_at: scheduledAt,
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(scheduled, { status: 201 });
  } catch (error) {
    console.error('Error scheduling message:', error);
    return NextResponse.json(
      { error: 'Failed to schedule message' },
      { status: 500 }
    );
  }
}

// PUT - Update scheduled message
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { scheduleId, message, scheduledAt, mediaUrl, mediaType } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Validate scheduled time if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (message) updateData.message = message;
    if (scheduledAt) updateData.scheduled_at = scheduledAt;
    if (mediaUrl) updateData.media_url = mediaUrl;
    if (mediaType) updateData.media_type = mediaType;
    updateData.updated_at = new Date().toISOString();

    const { data: scheduled, error } = await supabase
      .from('whatsapp_scheduled_messages')
      .update(updateData)
      .eq('id', scheduleId)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(scheduled);
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled message' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel scheduled message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('whatsapp_scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('id', scheduleId)
      .eq('session_id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled message' },
      { status: 500 }
    );
  }
}
