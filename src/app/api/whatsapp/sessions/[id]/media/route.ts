import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const sessionId = params.id;
    const mediaType = request.nextUrl.searchParams.get("type");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    let query = supabase
      .from("whatsapp_media")
      .select("*", { count: "exact" })
      .eq("session_id", sessionId);

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    const { data: media, error, count } = await query
      .order("uploaded_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Media API] Erro ao buscar mídia:", error);
      return NextResponse.json(
        { error: "Erro ao buscar mídia" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      media: media,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Media API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const sessionId = params.id;
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const messageId = formData.get("messageId") as string;
    const mediaType = formData.get("mediaType") as string;
    const caption = formData.get("caption") as string;

    if (!file || !mediaType) {
      return NextResponse.json(
        { error: "file e mediaType são obrigatórios" },
        { status: 400 }
      );
    }

    // Valida tipo de mídia
    const validTypes = ["image", "video", "audio", "document", "sticker"];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: "mediaType inválido" },
        { status: 400 }
      );
    }

    // Gera caminho de armazenamento
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `whatsapp/${sessionId}/${mediaType}/${fileName}`;

    // Converte arquivo para buffer
    const buffer = await file.arrayBuffer();

    // Faz upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("whatsapp-media")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Media API] Erro ao fazer upload:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      );
    }

    // Obtém URL pública
    const { data: publicUrlData } = supabase.storage
      .from("whatsapp-media")
      .getPublicUrl(storagePath);

    // Extrai metadados do arquivo
    const metadata: Record<string, any> = {
      originalName: file.name,
      size: file.size,
      type: file.type,
    };

    // Cria registro de mídia no banco
    const { data: media, error: dbError } = await supabase
      .from("whatsapp_media")
      .insert({
        session_id: sessionId,
        message_id: messageId || null,
        media_type: mediaType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        storage_url: publicUrlData.publicUrl,
        metadata: metadata,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Media API] Erro ao salvar mídia no banco:", dbError);
      // Tenta remover arquivo do storage
      await supabase.storage.from("whatsapp-media").remove([storagePath]);
      return NextResponse.json(
        { error: "Erro ao salvar mídia" },
        { status: 500 }
      );
    }

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("[Media API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const sessionId = params.id;
    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca mídia
    const { data: media, error: fetchError } = await supabase
      .from("whatsapp_media")
      .select("*")
      .eq("id", mediaId)
      .eq("session_id", sessionId)
      .single();

    if (fetchError || !media) {
      return NextResponse.json(
        { error: "Mídia não encontrada" },
        { status: 404 }
      );
    }

    // Remove arquivo do storage
    if (media.storage_path) {
      await supabase.storage
        .from("whatsapp-media")
        .remove([media.storage_path]);
    }

    // Remove registro do banco
    const { error: deleteError } = await supabase
      .from("whatsapp_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      console.error("[Media API] Erro ao deletar mídia:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar mídia" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Media API] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
