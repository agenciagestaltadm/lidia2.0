import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Busca reações da mensagem
    const { data: reactions, error } = await supabase
      .from("whatsapp_message_reactions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("message_id", messageId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Reactions API] Erro ao buscar reações:", error);
      return NextResponse.json(
        { error: "Erro ao buscar reações" },
        { status: 500 }
      );
    }

    // Agrupa reações por emoji
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        const emoji = reaction.reaction_emoji;
        if (!acc[emoji]) {
          acc[emoji] = [];
        }
        acc[emoji].push(reaction);
        return acc;
      },
      {} as Record<string, typeof reactions>
    );

    return NextResponse.json(groupedReactions);
  } catch (error) {
    console.error("[Reactions API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const { messageId, contactPhone, reactionEmoji } = await request.json();

    if (!messageId || !contactPhone || !reactionEmoji) {
      return NextResponse.json(
        { error: "messageId, contactPhone e reactionEmoji são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se a reação já existe
    const { data: existingReaction } = await supabase
      .from("whatsapp_message_reactions")
      .select("id")
      .eq("session_id", sessionId)
      .eq("message_id", messageId)
      .eq("contact_phone", contactPhone)
      .eq("reaction_emoji", reactionEmoji)
      .single();

    if (existingReaction) {
      // Se já existe, remove a reação (toggle)
      const { error: deleteError } = await supabase
        .from("whatsapp_message_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        console.error("[Reactions API] Erro ao remover reação:", deleteError);
        return NextResponse.json(
          { error: "Erro ao remover reação" },
          { status: 500 }
        );
      }

      return NextResponse.json({ removed: true });
    }

    // Cria nova reação
    const { data: reaction, error } = await supabase
      .from("whatsapp_message_reactions")
      .insert({
        session_id: sessionId,
        message_id: messageId,
        contact_phone: contactPhone,
        reaction_emoji: reactionEmoji,
      })
      .select()
      .single();

    if (error) {
      console.error("[Reactions API] Erro ao criar reação:", error);
      return NextResponse.json(
        { error: "Erro ao criar reação" },
        { status: 500 }
      );
    }

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("[Reactions API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const { messageId, contactPhone, reactionEmoji } = await request.json();

    if (!messageId || !contactPhone || !reactionEmoji) {
      return NextResponse.json(
        { error: "messageId, contactPhone e reactionEmoji são obrigatórios" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("whatsapp_message_reactions")
      .delete()
      .eq("session_id", sessionId)
      .eq("message_id", messageId)
      .eq("contact_phone", contactPhone)
      .eq("reaction_emoji", reactionEmoji);

    if (error) {
      console.error("[Reactions API] Erro ao deletar reação:", error);
      return NextResponse.json(
        { error: "Erro ao deletar reação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Reactions API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
