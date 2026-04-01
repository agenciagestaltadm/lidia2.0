import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const { messageId, deletedBy, reason } = await request.json();

    if (!messageId || !deletedBy) {
      return NextResponse.json(
        { error: "messageId e deletedBy são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca a mensagem
    const { data: message, error: messageError } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", messageId)
      .eq("session_id", sessionId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Mensagem não encontrada" },
        { status: 404 }
      );
    }

    // Cria registro de deleção
    const { data: deletion, error: deletionError } = await supabase
      .from("whatsapp_message_deletions")
      .insert({
        session_id: sessionId,
        message_id: messageId,
        deleted_by: deletedBy,
        deletion_type: "user",
        reason: reason || null,
      })
      .select()
      .single();

    if (deletionError) {
      console.error("[Delete API] Erro ao criar registro de deleção:", deletionError);
      return NextResponse.json(
        { error: "Erro ao deletar mensagem" },
        { status: 500 }
      );
    }

    // Marca a mensagem como deletada
    const { error: updateError } = await supabase
      .from("whatsapp_messages")
      .update({
        is_deleted: true,
        content: "[Mensagem deletada]",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (updateError) {
      console.error("[Delete API] Erro ao atualizar mensagem:", updateError);
      return NextResponse.json(
        { error: "Erro ao deletar mensagem" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Mensagem deletada com sucesso",
      deletion: deletion,
    });
  } catch (error) {
    console.error("[Delete API] Erro:", error);
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

    // Busca histórico de deleção
    const { data: deletion, error } = await supabase
      .from("whatsapp_message_deletions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("message_id", messageId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[Delete API] Erro ao buscar deleção:", error);
      return NextResponse.json(
        { error: "Erro ao buscar informações de deleção" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deletion: deletion || null,
      isDeleted: !!deletion,
    });
  } catch (error) {
    console.error("[Delete API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
