import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MetaGraphAPI } from '@/lib/meta-api';
import { normalizeBrazilianPhone } from '@/lib/phone-normalization';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get campaign with all necessary data
    const { data: campaign, error: campaignError } = await supabase
      .from('bulk_campaigns')
      .select(`
        *,
        waba_config:waba_config_id(*)
      `)
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if campaign can be started
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { success: false, error: 'Campaign cannot be started' },
        { status: 400 }
      );
    }

    // Get recipients based on selection mode
    let recipients: Array<{ id?: string; name?: string; phone: string }> = [];

    if (campaign.contact_selection_mode === 'all') {
      // Get all contacts from company
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('company_id', campaign.company_id)
        .eq('status', 'active');
      
      recipients = contacts || [];
    } else if (campaign.contact_selection_mode === 'manual' && campaign.selected_contact_ids) {
      // Get selected contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .in('id', campaign.selected_contact_ids);
      
      recipients = contacts || [];
    } else if (campaign.contact_selection_mode === 'csv' && campaign.csv_data) {
      // Use CSV data
      recipients = campaign.csv_data;
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Create recipients in database
    const recipientsData = recipients.map(recipient => ({
      campaign_id: id,
      contact_id: recipient.id || null,
      name: recipient.name || null,
      phone: recipient.phone,
      phone_normalized: normalizeBrazilianPhone(recipient.phone),
      status: 'pending',
      template_variables: {},
    }));

    const { error: recipientsError } = await supabase
      .from('bulk_campaign_recipients')
      .insert(recipientsData);

    if (recipientsError) {
      console.error('Error creating recipients:', recipientsError);
      return NextResponse.json(
        { success: false, error: 'Failed to create recipients' },
        { status: 500 }
      );
    }

    // Update campaign status and total recipients
    const { error: updateError } = await supabase
      .from('bulk_campaigns')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        total_recipients: recipients.length,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    // Start sending messages asynchronously
    // In production, this should be handled by a queue system (Redis, Bull, etc.)
    sendMessagesAsync(supabase, id, campaign);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting campaign:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Async function to send messages
async function sendMessagesAsync(supabase: Awaited<ReturnType<typeof createClient>>, campaignId: string, campaign: unknown) {
  const camp = campaign as {
    id: string;
    waba_config: {
      access_token: string;
      phone_number_id: string;
    };
    template_id?: string;
    custom_message?: string;
    min_interval_seconds: number;
    max_interval_seconds: number;
  };

  const metaApi = new MetaGraphAPI({
    accessToken: camp.waba_config.access_token,
    phoneNumberId: camp.waba_config.phone_number_id,
  });

  // Get template if using one
  let template: { name: string; language: string } | null = null;
  if (camp.template_id) {
    const { data } = await supabase
      .from('waba_templates')
      .select('name, language')
      .eq('id', camp.template_id)
      .single();
    template = data;
  }

  // Get pending recipients
  const { data: recipients } = await supabase
    .from('bulk_campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (!recipients || recipients.length === 0) return;

  for (const recipient of recipients) {
    try {
      // Update status to sending
      await supabase
        .from('bulk_campaign_recipients')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', recipient.id);

      let result;
      if (template) {
        result = await metaApi.sendTemplateMessage(
          recipient.phone_normalized,
          template.name,
          template.language
        );
      } else if (camp.custom_message) {
        result = await metaApi.sendTextMessage(
          recipient.phone_normalized,
          camp.custom_message
        );
      } else {
        throw new Error('No message content provided');
      }

      if (result.success) {
        await supabase
          .from('bulk_campaign_recipients')
          .update({
            status: 'sent',
            meta_message_id: result.messageId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipient.id);
      } else {
        await supabase
          .from('bulk_campaign_recipients')
          .update({
            status: 'failed',
            error_message: result.error,
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipient.id);
      }

      // Update campaign stats
      await supabase.rpc('update_campaign_stats', { p_campaign_id: campaignId });

      // Wait for random interval
      const interval = Math.random() * 
        (camp.max_interval_seconds - camp.min_interval_seconds) + 
        camp.min_interval_seconds;
      await new Promise(resolve => setTimeout(resolve, interval * 1000));

    } catch (error) {
      console.error('Error sending message:', error);
      await supabase
        .from('bulk_campaign_recipients')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipient.id);
    }
  }

  // Mark campaign as completed
  const { data: remaining } = await supabase
    .from('bulk_campaign_recipients')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  if (!remaining || remaining.length === 0) {
    await supabase
      .from('bulk_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
  }
}
