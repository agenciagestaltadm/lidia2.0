import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";

    let query = supabase
      .from("whatsapp_groups")
      .select("*")
      .eq("session_id", sessionId);

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data: groups, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      console.error("[Groups API] Erro ao buscar grupos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar grupos" },
        { status: 500 }
      );
    }

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[Groups API] Erro:", error);
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
    const { groupJid, name, description, profilePictureUrl, ownerPhone } =
      await request.json();

    if (!groupJid || !name) {
      return NextResponse.json(
        { error: "groupJid e name são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se o grupo já existe
    const { data: existingGroup } = await supabase
      .from("whatsapp_groups")
      .select("id")
      .eq("session_id", sessionId)
      .eq("group_jid", groupJid)
      .single();

    if (existingGroup) {
      return NextResponse.json(
        { error: "Grupo já existe" },
        { status: 409 }
      );
    }

    // Cria novo grupo
    const { data: group, error } = await supabase
      .from("whatsapp_groups")
      .insert({
        session_id: sessionId,
        group_jid: groupJid,
        name,
        description: description || null,
        profile_picture_url: profilePictureUrl || null,
        owner_phone: ownerPhone || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Groups API] Erro ao criar grupo:", error);
      return NextResponse.json(
        { error: "Erro ao criar grupo" },
        { status: 500 }
      );
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("[Groups API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;
    const { groupId, name, description, profilePictureUrl, isArchived } =
      await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId é obrigatório" },
        { status: 400 }
      );
    }

    // Atualiza grupo
    const { data: group, error } = await supabase
      .from("whatsapp_groups")
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        profile_picture_url: profilePictureUrl !== undefined ? profilePictureUrl : undefined,
        is_archived: isArchived !== undefined ? isArchived : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId)
      .eq("session_id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("[Groups API] Erro ao atualizar grupo:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar grupo" },
        { status: 500 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("[Groups API] Erro:", error);
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
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId é obrigatório" },
        { status: 400 }
      );
    }

    // Deleta grupo (cascata deleta participantes)
    const { error } = await supabase
      .from("whatsapp_groups")
      .delete()
      .eq("id", groupId)
      .eq("session_id", sessionId);

    if (error) {
      console.error("[Groups API] Erro ao deletar grupo:", error);
      return NextResponse.json(
        { error: "Erro ao deletar grupo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Groups API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
