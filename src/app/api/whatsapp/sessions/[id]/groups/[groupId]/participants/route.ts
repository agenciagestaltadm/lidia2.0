import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId, groupId } = params;

    // Busca participantes do grupo
    const { data: participants, error } = await supabase
      .from("whatsapp_group_participants")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("[Participants API] Erro ao buscar participantes:", error);
      return NextResponse.json(
        { error: "Erro ao buscar participantes" },
        { status: 500 }
      );
    }

    return NextResponse.json(participants);
  } catch (error) {
    console.error("[Participants API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId, groupId } = params;
    const { participantPhone, participantName, isAdmin } = await request.json();

    if (!participantPhone) {
      return NextResponse.json(
        { error: "participantPhone é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se o participante já existe
    const { data: existingParticipant } = await supabase
      .from("whatsapp_group_participants")
      .select("id")
      .eq("group_id", groupId)
      .eq("participant_phone", participantPhone)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: "Participante já existe no grupo" },
        { status: 409 }
      );
    }

    // Adiciona participante
    const { data: participant, error } = await supabase
      .from("whatsapp_group_participants")
      .insert({
        group_id: groupId,
        participant_phone: participantPhone,
        participant_name: participantName || null,
        is_admin: isAdmin || false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Participants API] Erro ao adicionar participante:", error);
      return NextResponse.json(
        { error: "Erro ao adicionar participante" },
        { status: 500 }
      );
    }

    // Atualiza contagem de participantes no grupo
    const { data: group } = await supabase
      .from("whatsapp_group_participants")
      .select("id", { count: "exact" })
      .eq("group_id", groupId);

    if (group) {
      await supabase
        .from("whatsapp_groups")
        .update({
          participants_count: group.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", groupId);
    }

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("[Participants API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId, groupId } = params;
    const { participantId, isAdmin, participantName } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    // Atualiza participante
    const { data: participant, error } = await supabase
      .from("whatsapp_group_participants")
      .update({
        is_admin: isAdmin !== undefined ? isAdmin : undefined,
        participant_name: participantName !== undefined ? participantName : undefined,
      })
      .eq("id", participantId)
      .eq("group_id", groupId)
      .select()
      .single();

    if (error) {
      console.error("[Participants API] Erro ao atualizar participante:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar participante" },
        { status: 500 }
      );
    }

    return NextResponse.json(participant);
  } catch (error) {
    console.error("[Participants API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId, groupId } = params;
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    // Remove participante
    const { error } = await supabase
      .from("whatsapp_group_participants")
      .delete()
      .eq("id", participantId)
      .eq("group_id", groupId);

    if (error) {
      console.error("[Participants API] Erro ao remover participante:", error);
      return NextResponse.json(
        { error: "Erro ao remover participante" },
        { status: 500 }
      );
    }

    // Atualiza contagem de participantes no grupo
    const { data: group } = await supabase
      .from("whatsapp_group_participants")
      .select("id", { count: "exact" })
      .eq("group_id", groupId);

    if (group) {
      await supabase
        .from("whatsapp_groups")
        .update({
          participants_count: group.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", groupId);
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Participants API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
