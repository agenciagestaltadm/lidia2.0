// Edge Function: WhatsApp Business API Webhook
// Recebe webhooks do Facebook/Meta sem autenticação JWT
// Validação apenas pelo token de verificação configurado pelo usuário

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers para permitir acesso do Facebook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Interface para o config do WABA
interface WABAConfig {
  id: string
  company_id: string
  verify_token: string
  account_uuid: string
  status: string
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Extrair account_uuid da URL
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const accountUuid = pathParts[pathParts.length - 1]

  console.log('[WEBHOOK] Request received:', {
    method: req.method,
    accountUuid,
    url: req.url,
  })

  if (!accountUuid || accountUuid === 'whatsapp-webhook') {
    return new Response(
      JSON.stringify({ error: 'Account UUID not provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Criar cliente Supabase com service role key
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[WEBHOOK] Missing Supabase environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Buscar configuração pelo account_uuid
    const { data: config, error: configError } = await supabase
      .from('waba_configs')
      .select('id, company_id, verify_token, account_uuid, status')
      .eq('account_uuid', accountUuid)
      .single()

    if (configError || !config) {
      console.error('[WEBHOOK] Config not found:', accountUuid, configError)
      return new Response(
        JSON.stringify({ error: 'Config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Roteamento baseado no método HTTP
    if (req.method === 'GET') {
      return handleVerification(req, config, supabase, corsHeaders)
    } else if (req.method === 'POST') {
      return handleWebhookEvent(req, config, supabase, corsHeaders)
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Handler para verificação do webhook (GET)
async function handleVerification(
  req: Request,
  config: WABAConfig,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  console.log('[WEBHOOK GET] Verification request:', {
    mode,
    token,
    challenge,
    accountUuid: config.account_uuid,
  })

  // Validar parâmetros obrigatórios
  if (!mode || !token || !challenge) {
    console.error('[WEBHOOK GET] Missing required parameters')
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Apenas aceitar modo subscribe
  if (mode !== 'subscribe') {
    console.error('[WEBHOOK GET] Invalid mode:', mode)
    return new Response(
      JSON.stringify({ error: 'Invalid mode' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Validar token de verificação
  if (!config.verify_token) {
    console.error('[WEBHOOK GET] No verify_token configured')
    return new Response(
      JSON.stringify({ error: 'Verification token not set' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (config.verify_token !== token) {
    console.error('[WEBHOOK GET] Token mismatch:', {
      expected: config.verify_token,
      received: token,
    })
    return new Response(
      JSON.stringify({ error: 'Verification failed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('[WEBHOOK GET] Token verified successfully!')

  // Atualizar status para connected
  await supabase
    .from('waba_configs')
    .update({
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', config.id)

  // Retornar o challenge como plain text (exatamente como o Facebook espera)
  return new Response(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      ...corsHeaders,
    },
  })
}

// Handler para eventos do webhook (POST)
async function handleWebhookEvent(
  req: Request,
  config: WABAConfig,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    console.log('[WEBHOOK POST] Event received:', {
      accountUuid: config.account_uuid,
      object: body.object,
    })

    // Processar eventos
    const entries = body.entry || []

    for (const entry of entries) {
      const changes = entry.changes || []

      for (const change of changes) {
        const value = change.value || {}
        const field = change.field

        // Log do evento
        await supabase.from('waba_webhook_logs').insert({
          waba_config_id: config.id,
          event_type: field,
          payload: value,
          status: 'pending',
        })

        // Processar baseado no tipo de evento
        switch (field) {
          case 'messages':
            await processMessages(supabase, value, config)
            break

          case 'message_status':
          case 'message_echoes':
            await processMessageStatus(supabase, value, config)
            break

          case 'message_template_status_update':
          case 'template_category_update':
            await processTemplateStatusUpdate(supabase, value, config)
            break

          case 'account_alerts':
          case 'account_review_update':
          case 'account_settings_update':
          case 'account_update':
            await processAccountAlert(supabase, value, config)
            break

          case 'phone_number_quality_update':
          case 'phone_number_name_update':
            await processPhoneQualityUpdate(supabase, value, config)
            break

          case 'business_capability_update':
          case 'business_status_update':
          case 'business_phone_number_update':
            await processBusinessUpdate(supabase, value, config, field)
            break

          default:
            console.log(`[WEBHOOK] Event type ${field} logged but not processed`)
            // Marcar como success mesmo não processando
            await supabase
              .from('waba_webhook_logs')
              .update({ status: 'success' })
              .eq('waba_config_id', config.id)
              .eq('event_type', field)
              .order('created_at', { ascending: false })
              .limit(1)
        }
      }
    }

    // Sempre retornar 200 OK para o Meta
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[WEBHOOK POST] Error processing webhook:', error)
    // Mesmo com erro, retornar 200 para evitar retries do Meta
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// Processar mensagens recebidas
async function processMessages(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig
) {
  const messages = (value.messages as Array<Record<string, unknown>>) || []
  const contacts = (value.contacts as Array<Record<string, unknown>>) || []
  const metadata = (value.metadata as Record<string, string>) || {}

  for (const message of messages) {
    const from = message.from as string
    const messageId = message.id as string
    const timestamp = message.timestamp as string
    const messageType = message.type as string

    // Pular mensagens de eco (enviadas pelo próprio negócio)
    if (messageId?.startsWith('wamid.')) {
      const isEcho = (message as Record<string, unknown>).from_me === true
      if (isEcho) {
        console.log('[WEBHOOK] Skipping echo message:', messageId)
        continue
      }
    }

    // Buscar ou criar contato
    let contactId: string
    const { data: existingContact } = await supabase
      .from('waba_contacts')
      .select('id')
      .eq('company_id', config.company_id)
      .eq('phone', from)
      .single()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const contactInfo = contacts.find(
        (c: Record<string, unknown>) => (c.wa_id as string) === from
      ) as Record<string, Record<string, string>> | undefined

      const { data: newContact, error } = await supabase
        .from('waba_contacts')
        .insert({
          company_id: config.company_id,
          phone: from,
          name: contactInfo?.profile?.name || from,
          whatsapp_id: from,
          source: 'whatsapp_official',
        })
        .select()
        .single()

      if (error) {
        console.error('[WEBHOOK] Error creating contact:', error)
        continue
      }
      contactId = newContact.id
    }

    // Buscar ou criar conversa
    let conversationId: string
    const { data: existingConversation } = await supabase
      .from('waba_conversations')
      .select('id, status')
      .eq('company_id', config.company_id)
      .eq('contact_id', contactId)
      .in('status', ['open', 'pending'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      const { data: newConversation, error } = await supabase
        .from('waba_conversations')
        .insert({
          company_id: config.company_id,
          waba_connection_id: config.id, // References waba_configs.id
          contact_id: contactId,
          status: 'pending',
          priority: 'medium',
          unread_count: 0,
        })
        .select()
        .single()

      if (error) {
        console.error('[WEBHOOK] Error creating conversation:', error)
        console.error('[WEBHOOK] Conversation data:', {
          company_id: config.company_id,
          waba_connection_id: config.id,
          contact_id: contactId,
        })
        continue
      }
      console.log('[WEBHOOK] New conversation created:', newConversation.id)
      conversationId = newConversation.id
    }

    // Extrair conteúdo da mensagem baseado no tipo
    let content = ''
    let mediaUrl: string | null = null
    let mediaCaption: string | null = null

    switch (messageType) {
      case 'text':
        content = (message.text as Record<string, string>)?.body || ''
        break
      case 'image':
        const imageData = message.image as Record<string, string>
        content = imageData?.caption || '[Imagem]'
        mediaCaption = imageData?.caption || null
        mediaUrl = imageData?.id ? `media:${imageData.id}` : null
        break
      case 'video':
        const videoData = message.video as Record<string, string>
        content = videoData?.caption || '[Vídeo]'
        mediaCaption = videoData?.caption || null
        mediaUrl = videoData?.id ? `media:${videoData.id}` : null
        break
      case 'audio':
        const audioData = message.audio as Record<string, string>
        content = '[Áudio]'
        mediaUrl = audioData?.id ? `media:${audioData.id}` : null
        break
      case 'voice':
        const voiceData = message.voice as Record<string, string>
        content = '[Mensagem de Voz]'
        mediaUrl = voiceData?.id ? `media:${voiceData.id}` : null
        break
      case 'document':
        const docData = message.document as Record<string, string>
        content = docData?.filename || '[Documento]'
        mediaCaption = docData?.filename || null
        mediaUrl = docData?.id ? `media:${docData.id}` : null
        break
      case 'location':
        const location = message.location as Record<string, number>
        content = `[Localização: ${location?.latitude}, ${location?.longitude}]`
        break
      case 'sticker':
        content = '[Figurinha]'
        break
      case 'contacts':
        content = '[Contato compartilhado]'
        break
      default:
        content = `[${messageType}]`
    }

    // Salvar mensagem
    const { error: messageError } = await supabase.from('waba_messages').insert({
      conversation_id: conversationId,
      waba_connection_id: config.id, // References waba_configs.id
      direction: 'inbound',
      message_type: messageType === 'voice' ? 'audio' : messageType,
      content,
      media_url: mediaUrl,
      media_caption: mediaCaption,
      external_id: messageId,
      status: 'delivered',
      delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
      metadata: {
        timestamp,
        raw: message,
        display_phone_number: metadata?.display_phone_number,
        phone_number_id: metadata?.phone_number_id,
      },
    })

    if (messageError) {
      console.error('[WEBHOOK] Error saving message:', messageError)
      console.error('[WEBHOOK] Message data:', {
        conversation_id: conversationId,
        waba_connection_id: config.id,
        direction: 'inbound',
        message_type: messageType,
        external_id: messageId,
      })
    } else {
      console.log('[WEBHOOK] Message saved successfully:', messageId)
    }

    // Atualizar log do webhook
    await supabase
      .from('waba_webhook_logs')
      .update({ status: 'success' })
      .eq('waba_config_id', config.id)
      .eq('event_type', 'messages')
      .order('created_at', { ascending: false })
      .limit(1)
  }
}

// Processar atualizações de status de mensagem
async function processMessageStatus(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig
) {
  const statuses = (value.statuses as Array<Record<string, unknown>>) || []

  for (const status of statuses) {
    const messageId = status.id as string
    const statusValue = status.status as string
    const timestamp = status.timestamp as string

    const updateData: Record<string, string> = {
      status: mapMessageStatus(statusValue),
    }

    if (statusValue === 'sent') {
      updateData.sent_at = new Date(parseInt(timestamp) * 1000).toISOString()
    } else if (statusValue === 'delivered') {
      updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString()
    } else if (statusValue === 'read') {
      updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString()
    } else if (statusValue === 'failed') {
      updateData.failed_at = new Date(parseInt(timestamp) * 1000).toISOString()
      const errors = status.errors as Array<Record<string, string>> | undefined
      updateData.error_message = errors?.[0]?.message || 'Failed to deliver'
    }

    const { error } = await supabase
      .from('waba_messages')
      .update(updateData)
      .eq('external_id', messageId)

    if (error) {
      console.error('[WEBHOOK] Error updating message status:', error)
    }
  }
}

// Processar atualizações de status de template
async function processTemplateStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig
) {
  const eventType = value.event_type as string
  const templateId = value.message_template_id as string
  const reason = value.reason as string

  const { error } = await supabase
    .from('waba_templates')
    .update({
      status: eventType.toUpperCase(),
      reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('template_id', templateId)

  if (error) {
    console.error('[WEBHOOK] Error updating template status:', error)
  }
}

// Processar alertas da conta
async function processAccountAlert(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig
) {
  const alertType = value.alert_type as string
  const alertDescription = value.alert_description as string

  console.warn(`[WEBHOOK] WABA Alert: ${alertType} - ${alertDescription}`)

  // Atualizar config com info do alerta
  await supabase
    .from('waba_configs')
    .update({
      status: 'error',
      updated_at: new Date().toISOString(),
    })
    .eq('id', config.id)
}

// Processar atualizações de qualidade do número
async function processPhoneQualityUpdate(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig
) {
  const qualityScore = value.quality_score as string
  console.log(`[WEBHOOK] Quality Score Update: ${qualityScore}`)
}

// Processar atualizações de negócio
async function processBusinessUpdate(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
  config: WABAConfig,
  eventType: string
) {
  console.log(`[WEBHOOK] Business Update (${eventType}):`, value)
}

// Mapear status do Meta para status interno
function mapMessageStatus(metaStatus: string): string {
  const statusMap: Record<string, string> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    deleted: 'deleted',
  }

  return statusMap[metaStatus] || metaStatus
}
