"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { WhatsAppMedia } from "@/types/whatsapp";

interface UseWhatsAppMediaState {
  media: WhatsAppMedia[];
  loading: boolean;
  error: string | null;
  total: number;
  limit: number;
  offset: number;
}

export function useWhatsAppMedia(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppMediaState>({
    media: [],
    loading: false,
    error: null,
    total: 0,
    limit: 50,
    offset: 0,
  });

  // Busca mídia
  const fetchMedia = useCallback(
    async (mediaType?: string, limit = 50, offset = 0) => {
      if (!sessionId) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const params = new URLSearchParams();
        params.append("limit", limit.toString());
        params.append("offset", offset.toString());
        if (mediaType) params.append("type", mediaType);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/media?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar mídia");
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          media: offset === 0 ? data.media : [...prev.media, ...data.media],
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar mídia";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId]
  );

  // Faz upload de mídia
  const uploadMedia = useCallback(
    async (
      file: File,
      mediaType: "image" | "video" | "audio" | "document" | "sticker",
      messageId?: string,
      caption?: string
    ): Promise<WhatsAppMedia | null> => {
      if (!sessionId) return null;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mediaType", mediaType);
        if (messageId) formData.append("messageId", messageId);
        if (caption) formData.append("caption", caption);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/media`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao fazer upload");
        }

        const media = await response.json();
        setState((prev) => ({
          ...prev,
          media: [media, ...prev.media],
          total: prev.total + 1,
          loading: false,
        }));

        toast.success("Mídia enviada com sucesso");
        return media;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao fazer upload";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return null;
      }
    },
    [sessionId]
  );

  // Deleta mídia
  const deleteMedia = useCallback(
    async (mediaId: string): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/media`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaId }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao deletar mídia");
        }

        setState((prev) => ({
          ...prev,
          media: prev.media.filter((m) => m.id !== mediaId),
          total: prev.total - 1,
          loading: false,
        }));

        toast.success("Mídia deletada com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao deletar mídia";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Carrega mais mídia (paginação)
  const loadMore = useCallback(() => {
    if (state.offset + state.limit < state.total) {
      fetchMedia(undefined, state.limit, state.offset + state.limit);
    }
  }, [fetchMedia, state.offset, state.limit, state.total]);

  // Obtém mídia por tipo
  const getMediaByType = useCallback(
    (mediaType: string): WhatsAppMedia[] => {
      return state.media.filter((m) => m.media_type === mediaType);
    },
    [state.media]
  );

  // Obtém contagem de mídia por tipo
  const getMediaCountByType = useCallback(
    (mediaType: string): number => {
      return state.media.filter((m) => m.media_type === mediaType).length;
    },
    [state.media]
  );

  // Obtém tamanho total de mídia
  const getTotalMediaSize = useCallback((): number => {
    return state.media.reduce((total, m) => total + (m.file_size || 0), 0);
  }, [state.media]);

  // Formata tamanho de arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }, []);

  return {
    ...state,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    loadMore,
    getMediaByType,
    getMediaCountByType,
    getTotalMediaSize,
    formatFileSize,
  };
}
