import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const { messageId, forwardToPhones } = await request.json();

    if (!messageId || !forwardToPhones || !Array.isArray(forwardToPhones)) {
      return NextResponse.json(
        { error: "messageId e forwardToPhones (array) são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca a mensagem original
    const { data: originalMessage, error: messageError } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", messageId)
      .eq("session_id", sessionId)
      .single();

    if (messageError || !originalMessage) {
      return NextResponse.json(
        { error: "Mensagem não encontrada" },
        { status: 404 }
      );
    }

    // Cria registros de encaminhamento para cada contato
    const forwardRecords = forwardToPhones.map((phone: string) => ({
      session_id: sessionId,
      original_message_id: messageId,
      forwarded_to_phone: phone,
    }));

    const { data: forwards, error: forwardError } = await supabase
      .from("whatsapp_message_forwards")
      .insert(forwardRecords)
      .select();

    if (forwardError) {
      console.error("[Forward API] Erro ao criar encaminhamentos:", forwardError);
      return NextResponse.json(
        { error: "Erro ao encaminhar mensagem" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Mensagem encaminhada com sucesso",
        forwards: forwards,
        count: forwards.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Forward API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const messageId = request.nextUrl.searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca histórico de encaminhamentos
    const { data: forwards, error } = await supabase
      .from("whatsapp_message_forwards")
      .select("*")
      .eq("session_id", sessionId)
      .eq("original_message_id", messageId)
      .order("forwarded_at", { ascending: false });

    if (error) {
      console.error("[Forward API] Erro ao buscar encaminhamentos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar encaminhamentos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      forwards: forwards,
      count: forwards.length,
    });
  } catch (error) {
    console.error("[Forward API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
