import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SendMessageRequest {
  conversationId: string;
  connectionId: string;
  phoneNumber: string;
  messageType: "text" | "image" | "video" | "audio" | "document" | "template";
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
}

interface MetaMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { conversationId, connectionId, phoneNumber, messageType, content, mediaUrl, mediaCaption } = body;

    // Validate required fields
    if (!connectionId || !phoneNumber || !messageType) {
      return NextResponse.json(
        { error: "Missing required fields: connectionId, phoneNumber, messageType" },
        { status: 400 }
      );
    }

    if (messageType === "text" && !content) {
      return NextResponse.json(
        { error: "Content is required for text messages" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get connection details from waba_configs (primary connection table)
    // The connectionId parameter refers to waba_configs.id
    const { data: connection, error: connectionError } = await supabase
      .from("waba_configs")
      .select("id, phone_number_id, business_account_id, access_token, api_version, status")
      .eq("id", connectionId)
      .single();

    if (connectionError || !connection) {
      console.error("Connection error:", connectionError);
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.status !== "connected") {
      return NextResponse.json(
        { error: "Connection is not active" },
        { status: 400 }
      );
    }

    const accessToken = connection.access_token;
    const apiVersion = connection.api_version || "v18.0";
    const phoneNumberId = connection.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: "Invalid connection configuration" },
        { status: 400 }
      );
    }

    // Save message to database with pending status BEFORE sending to Meta
    const { data: savedMessage, error: saveError } = await supabase
      .from("waba_messages")
      .insert({
        conversation_id: conversationId,
        waba_connection_id: connectionId,
        direction: "outbound",
        message_type: messageType,
        content,
        media_url: mediaUrl,
        media_caption: mediaCaption,
        status: "pending",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message to database:", saveError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Build message payload for Meta API
    const messagePayload = buildMessagePayload(
      phoneNumber,
      messageType,
      content,
      mediaUrl,
      mediaCaption
    );

    // Send message to Meta API
    const metaResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json();
      console.error("Meta API error:", errorData);
      
      // Update message status to failed
      await supabase
        .from("waba_messages")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message: errorData.error?.message || "Meta API error",
        })
        .eq("id", savedMessage.id);

      return NextResponse.json(
        { error: errorData.error?.message || "Failed to send message" },
        { status: metaResponse.status }
      );
    }

    const metaData: MetaMessageResponse = await metaResponse.json();
    const externalMessageId = metaData.messages?.[0]?.id;

    // Update saved message with external ID and sent status
    const { data: updatedMessage, error: updateError } = await supabase
      .from("waba_messages")
      .update({
        external_id: externalMessageId,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", savedMessage.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message:", updateError);
    }

    return NextResponse.json({
      success: true,
      messageId: externalMessageId,
      message: updatedMessage,
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildMessagePayload(
  phoneNumber: string,
  messageType: string,
  content: string,
  mediaUrl?: string,
  mediaCaption?: string
): Record<string, unknown> {
  const basePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
  };

  switch (messageType) {
    case "text":
      return {
        ...basePayload,
        type: "text",
        text: { body: content },
      };

    case "image":
      return {
        ...basePayload,
        type: "image",
        image: {
          link: mediaUrl,
          caption: mediaCaption,
        },
      };

    case "video":
      return {
        ...basePayload,
        type: "video",
        video: {
          link: mediaUrl,
          caption: mediaCaption,
        },
      };

    case "audio":
      return {
        ...basePayload,
        type: "audio",
        audio: {
          link: mediaUrl,
        },
      };

    case "document":
      return {
        ...basePayload,
        type: "document",
        document: {
          link: mediaUrl,
          caption: mediaCaption,
          filename: mediaUrl?.split("/").pop() || "document",
        },
      };

    case "template":
      return {
        ...basePayload,
        type: "template",
        template: {
          name: content,
          language: { code: "pt_BR" },
        },
      };

    default:
      return {
        ...basePayload,
        type: "text",
        text: { body: content },
      };
  }
}
