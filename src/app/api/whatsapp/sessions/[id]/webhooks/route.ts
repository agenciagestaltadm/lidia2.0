import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List webhooks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: webhooks, error } = await supabase
      .from('whatsapp_webhooks')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ webhooks, limit, offset });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST - Create webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { url, events, isActive = true, retryPolicy, headers } = body;

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = [
      'message.received',
      'message.sent',
      'message.deleted',
      'message.reacted',
      'message.forwarded',
      'group.created',
      'group.updated',
      'group.deleted',
      'contact.added',
      'contact.updated',
      'session.connected',
      'session.disconnected',
    ];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'At least one event must be specified' },
        { status: 400 }
      );
    }

    const invalidEvents = events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: webhook, error } = await supabase
      .from('whatsapp_webhooks')
      .insert({
        session_id: sessionId,
        url,
        events,
        is_active: isActive,
        retry_policy: retryPolicy || { maxRetries: 3, retryDelayMs: 5000 },
        headers: headers || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PUT - Update webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { webhookId, url, events, isActive, retryPolicy, headers } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid webhook URL' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (url) updateData.url = url;
    if (events) updateData.events = events;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (retryPolicy) updateData.retry_policy = retryPolicy;
    if (headers) updateData.headers = headers;
    updateData.updated_at = new Date().toISOString();

    const { data: webhook, error } = await supabase
      .from('whatsapp_webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { webhookId } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('whatsapp_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('session_id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
