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

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from("waba_connections")
      .select("*, waba_configs(access_token, api_version)")
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

    const accessToken = connection.waba_configs?.access_token;
    const apiVersion = connection.waba_configs?.api_version || "v18.0";
    const phoneNumberId = connection.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: "Invalid connection configuration" },
        { status: 400 }
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
        .eq("conversation_id", conversationId)
        .eq("direction", "outbound")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json(
        { error: errorData.error?.message || "Failed to send message" },
        { status: metaResponse.status }
      );
    }

    const metaData: MetaMessageResponse = await metaResponse.json();
    const externalMessageId = metaData.messages?.[0]?.id;

    // Update message with external ID and sent status
    const { data: updatedMessage, error: updateError } = await supabase
      .from("waba_messages")
      .update({
        external_id: externalMessageId,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("direction", "outbound")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
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
