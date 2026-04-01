import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET - List backups
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: backups, error, count } = await supabase
      .from('whatsapp_backups')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      backups,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}

// POST - Create backup
export async function POST(
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
    const body = await request.json();
    const {
      includeMessages = true,
      includeMedia = true,
      includeContacts = true,
      dateFrom,
      dateTo,
    } = body;

    // Create backup record
    const backupName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`;

    const { data: backup, error: backupError } = await supabase
      .from('whatsapp_backups')
      .insert({
        session_id: sessionId,
        backup_name: backupName,
        backup_type: 'manual',
        status: 'pending',
        include_messages: includeMessages,
        include_media: includeMedia,
        include_contacts: includeContacts,
        date_from: dateFrom,
        date_to: dateTo,
      })
      .select()
      .single();

    if (backupError) throw backupError;

    // Fetch data for backup
    let messageCount = 0;
    let mediaCount = 0;
    let contactCount = 0;

    if (includeMessages) {
      const { count } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .gte('created_at', dateFrom || '1970-01-01')
        .lte('created_at', dateTo || new Date().toISOString());
      messageCount = count || 0;
    }

    if (includeMedia) {
      const { count } = await supabase
        .from('whatsapp_media')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .gte('created_at', dateFrom || '1970-01-01')
        .lte('created_at', dateTo || new Date().toISOString());
      mediaCount = count || 0;
    }

    if (includeContacts) {
      const { count } = await supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      contactCount = count || 0;
    }

    // Update backup with counts
    const { data: updatedBackup, error: updateError } = await supabase
      .from('whatsapp_backups')
      .update({
        message_count: messageCount,
        media_count: mediaCount,
        contact_count: contactCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', backup.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedBackup, { status: 201 });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// PUT - Update backup (for restore operations)
export async function PUT(
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
    const body = await request.json();
    const { backupId, action, overwrite = false } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    if (action === 'restore') {
      // Mark backup as restored
      const { data: backup, error } = await supabase
        .from('whatsapp_backups')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', backupId)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Backup restore initiated',
        backup,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating backup:', error);
    return NextResponse.json(
      { error: 'Failed to update backup' },
      { status: 500 }
    );
  }
}

// DELETE - Delete backup
export async function DELETE(
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
    const body = await request.json();
    const { backupId } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    // Get backup to delete storage file
    const { data: backup, error: fetchError } = await supabase
      .from('whatsapp_backups')
      .select('storage_path')
      .eq('id', backupId)
      .eq('session_id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage if path exists
    if (backup?.storage_path) {
      await supabase.storage
        .from('whatsapp-backups')
        .remove([backup.storage_path]);
    }

    // Delete backup record
    const { error: deleteError } = await supabase
      .from('whatsapp_backups')
      .delete()
      .eq('id', backupId)
      .eq('session_id', sessionId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
