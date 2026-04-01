import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BaileysService } from "@/lib/whatsapp/baileys-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obter presença do contato
    const { data: contact, error } = await supabase
      .from("whatsapp_contacts")
      .select("presence_status, last_seen_at, is_typing")
      .eq("session_id", sessionId)
      .eq("phone", phone)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      phone,
      presence_status: contact.presence_status,
      last_seen_at: contact.last_seen_at,
      is_typing: contact.is_typing,
    });
  } catch (error) {
    console.error("[API] Erro ao obter presença:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { phone, presence_status, is_typing } = await request.json();

    if (!phone || !presence_status) {
      return NextResponse.json(
        { error: "Phone and presence_status are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Atualizar presença do contato
    const { data, error } = await supabase
      .from("whatsapp_contacts")
      .update({
        presence_status,
        is_typing: is_typing || false,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("phone", phone)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update presence" },
        { status: 400 }
      );
    }

    // Registrar no log de presença
    await supabase.from("whatsapp_presence_log").insert({
      session_id: sessionId,
      contact_phone: phone,
      status: presence_status,
    });

    console.log("[API] Presença atualizada:", { phone, presence_status });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Erro ao atualizar presença:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
