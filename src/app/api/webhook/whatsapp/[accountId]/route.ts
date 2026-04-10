import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// CORS headers for webhook endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Meta webhook verification endpoint (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("[WEBHOOK GET] Received verification request:");
  console.log("  accountId:", accountId);
  console.log("  mode:", mode);
  console.log("  token:", token);
  console.log("  challenge:", challenge);
  console.log("  full URL:", request.url);

  // Validate required parameters
  if (!mode || !token || !challenge) {
    console.error("[WEBHOOK GET] Missing required parameters");
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Only handle subscribe mode
  if (mode !== "subscribe") {
    console.error("[WEBHOOK GET] Invalid mode:", mode);
    return NextResponse.json(
      { error: "Invalid mode" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Find config by account UUID
    console.log("[WEBHOOK GET] Looking for config with account_uuid:", accountId);
    const { data: config, error } = await supabase
      .from("waba_configs")
      .select("id, verify_token, status, account_uuid")
      .eq("account_uuid", accountId)
      .single();

    if (error) {
      console.error("[WEBHOOK GET] Database error:", error);
    }

    if (!config) {
      console.error("[WEBHOOK GET] Config not found for account:", accountId);
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      );
    }

    console.log("[WEBHOOK GET] Found config:", {
      id: config.id,
      account_uuid: config.account_uuid,
      has_token: !!config.verify_token,
    });

    const verifyToken = config.verify_token;

    if (!verifyToken) {
      console.error("[WEBHOOK GET] No verify_token in config");
      return NextResponse.json(
        { error: "Verification token not set" },
        { status: 403 }
      );
    }

    if (verifyToken !== token) {
      console.error("[WEBHOOK GET] Token mismatch:");
      console.error("  Expected:", verifyToken);
      console.error("  Received:", token);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 }
      );
    }

    console.log("[WEBHOOK GET] Token verified successfully!");
    console.log("[WEBHOOK GET] Returning challenge:", challenge);

    // Update config status to connected
    await supabase
      .from("waba_configs")
      .update({ 
        status: "connected",
        updated_at: new Date().toISOString()
      })
      .eq("id", config.id);

    // Return the challenge to verify the webhook
    // MUST return exactly the challenge value as plain text
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[WEBHOOK GET] Error verifying webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Meta webhook event receiver (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;

  try {
    const supabase = await createClient();

    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Find config by account UUID
    const { data: config, error: configError } = await supabase
      .from("waba_configs")
      .select("id, company_id, verify_token, access_token")
      .eq("account_uuid", accountId)
      .single();

    if (configError || !config) {
      console.error("Config not found for account:", accountId, configError);
      return NextResponse.json(
        { error: "Config not found" },
        { status: 404 }
      );
    }

    const connectionId = config.id;
    const companyId = config.company_id;

    // Process webhook events
    const entries = body.entry || [];
    
    for (const entry of entries) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        const value = change.value || {};
        const field = change.field;

        // Log the webhook event
        await supabase.from("waba_webhook_logs").insert({
          connection_id: connectionId,
          waba_config_id: config?.id,
          event_type: field,
          payload: value,
          status: "pending"
        });

        // Process based on event type - ALL events are accepted
        switch (field) {
          case "messages":
            await processMessages(supabase, value, connectionId, companyId);
            break;
          
          case "message_status":
          case "message_echoes":
            await processMessageStatus(supabase, value, connectionId);
            break;
          
          case "message_template_status_update":
          case "template_category_update":
            await processTemplateStatusUpdate(supabase, value, connectionId);
            break;
          
          case "account_alerts":
          case "account_review_update":
          case "account_settings_update":
          case "account_update":
            await processAccountAlert(supabase, value, connectionId);
            break;
          
          case "phone_number_quality_update":
          case "phone_number_name_update":
            await processPhoneQualityUpdate(supabase, value, connectionId);
            break;
          
          case "business_capability_update":
          case "business_status_update":
          case "business_phone_number_update":
            await processBusinessUpdate(supabase, value, connectionId, field);
            break;
          
          // All other events are logged but not processed
          default:
            console.log(`Received webhook event type: ${field} - logged but not processed`);
            // Still mark as success since we received it
            await supabase
              .from("waba_webhook_logs")
              .update({ status: "success" })
              .eq("connection_id", connectionId)
              .eq("event_type", field)
              .order("created_at", { ascending: false })
              .limit(1);
        }
      }
    }

    // Always return 200 OK to Meta
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: true });
  }
}

// Process incoming messages
async function processMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string,
  companyId: string
) {
  const messages = (value.messages as Array<Record<string, unknown>>) || [];
  const contacts = (value.contacts as Array<Record<string, unknown>>) || [];
  const metadata = value.metadata as Record<string, string> || {};

  for (const message of messages) {
    const from = message.from as string;
    const messageId = message.id as string;
    const timestamp = message.timestamp as string;
    const messageType = message.type as string;

    // Skip if message is from the business itself (echo)
    if (messageId?.startsWith("wamid.")) {
      // Check if it's an echo
      const isEcho = (message as Record<string, unknown>).from_me === true;
      if (isEcho) {
        console.log("Skipping echo message:", messageId);
        continue;
      }
    }

    // Find or create contact in waba_contacts
    let contactId: string;
    const { data: existingContact } = await supabase
      .from("waba_contacts")
      .select("id")
      .eq("company_id", companyId)
      .eq("phone", from)
      .single();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      // Get contact info from the contacts array
      const contactInfo = contacts.find((c: Record<string, unknown>) => 
        (c.wa_id as string) === from
      ) as Record<string, Record<string, string>> | undefined;
      
      const { data: newContact, error } = await supabase
        .from("waba_contacts")
        .insert({
          company_id: companyId,
          phone: from,
          name: contactInfo?.profile?.name || from,
          whatsapp_id: from,
          source: "whatsapp_official"
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating contact:", error);
        continue;
      }
      contactId = newContact.id;
    }

    // Find or create conversation
    let conversationId: string;
    const { data: existingConversation } = await supabase
      .from("waba_conversations")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("contact_id", contactId)
      .in("status", ["open", "pending"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
      // If conversation was resolved, move back to pending
      if (existingConversation.status === "resolved") {
        await supabase
          .from("waba_conversations")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    } else {
      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("waba_conversations")
        .insert({
          company_id: companyId,
          waba_connection_id: connectionId, // References waba_configs.id
          contact_id: contactId,
          status: "pending",
          priority: "medium",
          unread_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        console.error("Conversation data:", {
          company_id: companyId,
          waba_connection_id: connectionId,
          contact_id: contactId
        });
        continue;
      }
      console.log("New conversation created:", newConversation.id);
      conversationId = newConversation.id;
    }

    // Extract message content based on type
    let content = "";
    let mediaUrl = null;
    let mediaCaption = null;

    switch (messageType) {
      case "text":
        content = (message.text as Record<string, string>)?.body || "";
        break;
      case "image":
        const imageData = message.image as Record<string, string>;
        content = imageData?.caption || "[Imagem]";
        mediaCaption = imageData?.caption;
        // Note: Media URL needs to be fetched separately using Media API
        mediaUrl = imageData?.id ? `media:${imageData.id}` : null;
        break;
      case "video":
        const videoData = message.video as Record<string, string>;
        content = videoData?.caption || "[Vídeo]";
        mediaCaption = videoData?.caption;
        mediaUrl = videoData?.id ? `media:${videoData.id}` : null;
        break;
      case "audio":
        const audioData = message.audio as Record<string, string>;
        content = "[Áudio]";
        mediaUrl = audioData?.id ? `media:${audioData.id}` : null;
        break;
      case "voice":
        const voiceData = message.voice as Record<string, string>;
        content = "[Mensagem de Voz]";
        mediaUrl = voiceData?.id ? `media:${voiceData.id}` : null;
        break;
      case "document":
        const docData = message.document as Record<string, string>;
        content = docData?.filename || "[Documento]";
        mediaCaption = docData?.filename;
        mediaUrl = docData?.id ? `media:${docData.id}` : null;
        break;
      case "location":
        const location = message.location as Record<string, number>;
        content = `[Localização: ${location?.latitude}, ${location?.longitude}]`;
        break;
      case "sticker":
        content = "[Figurinha]";
        break;
      case "contacts":
        content = "[Contato compartilhado]";
        break;
      default:
        content = `[${messageType}]`;
    }

    // Save the message to waba_messages
    const { error: messageError } = await supabase
      .from("waba_messages")
      .insert({
        conversation_id: conversationId,
        waba_connection_id: connectionId, // References waba_configs.id
        direction: "inbound",
        message_type: messageType === "voice" ? "audio" : messageType,
        content,
        media_url: mediaUrl,
        media_caption: mediaCaption,
        external_id: messageId,
        status: "delivered",
        delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        metadata: {
          timestamp,
          raw: message,
          display_phone_number: metadata?.display_phone_number,
          phone_number_id: metadata?.phone_number_id
        }
      });

    if (messageError) {
      console.error("Error saving message:", messageError);
      console.error("Message data:", {
        conversation_id: conversationId,
        waba_connection_id: connectionId,
        direction: "inbound",
        message_type: messageType,
        external_id: messageId
      });
    } else {
      console.log("Message saved successfully:", messageId);
    }

    // Update webhook log status
    await supabase
      .from("waba_webhook_logs")
      .update({ status: "success" })
      .eq("connection_id", connectionId)
      .eq("payload->>id", messageId)
      .order("created_at", { ascending: false })
      .limit(1);
  }
}

// Process message status updates
async function processMessageStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string
) {
  const statuses = (value.statuses as Array<Record<string, unknown>>) || [];

  for (const status of statuses) {
    const messageId = status.id as string;
    const statusValue = status.status as string;
    const timestamp = status.timestamp as string;

    // Build update data
    const updateData: Record<string, string> = {
      status: mapMessageStatus(statusValue),
    };

    if (statusValue === "sent") {
      updateData.sent_at = new Date(parseInt(timestamp) * 1000).toISOString();
    } else if (statusValue === "delivered") {
      updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
    } else if (statusValue === "read") {
      updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();
    } else if (statusValue === "failed") {
      updateData.failed_at = new Date(parseInt(timestamp) * 1000).toISOString();
      const errors = status.errors as Array<Record<string, string>> | undefined;
      updateData.error_message = errors?.[0]?.message || "Failed to deliver";
    }

    // Update message status in waba_messages
    const { error } = await supabase
      .from("waba_messages")
      .update(updateData)
      .eq("external_id", messageId);

    if (error) {
      console.error("Error updating message status:", error);
    }
  }
}

// Process template status updates
async function processTemplateStatusUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string
) {
  const eventType = value.event_type as string;
  const templateId = value.message_template_id as string;
  const templateName = value.message_template_name as string;
  const reason = value.reason as string;

  // Update template status in database
  const { error } = await supabase
    .from("waba_templates")
    .update({
      status: eventType.toUpperCase(),
      reason: reason || null,
      updated_at: new Date().toISOString()
    })
    .eq("template_id", templateId);

  if (error) {
    console.error("Error updating template status:", error);
  }
}

// Process account alerts
async function processAccountAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string
) {
  const alertType = value.alert_type as string;
  const alertSeverity = value.alert_severity as string;
  const alertDescription = value.alert_description as string;

  // Log the alert
  console.warn(`WABA Alert: ${alertType} - ${alertDescription}`);

  // Update connection with alert info
  const { error } = await supabase
    .from("waba_connections")
    .update({
      last_error: `${alertType}: ${alertDescription}`,
      updated_at: new Date().toISOString()
    })
    .eq("id", connectionId);

  if (error) {
    console.error("Error updating connection alert:", error);
  }
}

// Process phone quality updates
async function processPhoneQualityUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string
) {
  const phoneNumberId = value.phone_number_id as string;
  const qualityScore = value.quality_score as string;
  const previousQualityScore = value.previous_quality_score as string;

  // Update connection with quality info
  const { error } = await supabase
    .from("waba_connections")
    .update({
      last_error: `Quality Score: ${qualityScore}`,
      updated_at: new Date().toISOString()
    })
    .eq("phone_number_id", phoneNumberId);

  if (error) {
    console.error("Error updating phone quality:", error);
  }
}

// Process business updates
async function processBusinessUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: Record<string, unknown>,
  connectionId: string,
  eventType: string
) {
  // Log business updates
  console.log(`Business Update (${eventType}):`, value);
}

// Map Meta message status to internal status
function mapMessageStatus(metaStatus: string): string {
  const statusMap: Record<string, string> = {
    "sent": "sent",
    "delivered": "delivered",
    "read": "read",
    "failed": "failed",
    "deleted": "deleted"
  };
  
  return statusMap[metaStatus] || metaStatus;
}
