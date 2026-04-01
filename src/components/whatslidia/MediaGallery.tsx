"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Download, Trash2, Image as ImageIcon, Video, Music, File } from "lucide-react";
import type { WhatsAppMedia } from "@/types/whatsapp";

interface MediaGalleryProps {
  media: WhatsAppMedia[];
  loading?: boolean;
  onDelete?: (mediaId: string) => void;
  onDownload?: (media: WhatsAppMedia) => void;
  isDarkMode?: boolean;
}

export function MediaGallery({
  media,
  loading = false,
  onDelete,
  onDownload,
  isDarkMode = true,
}: MediaGalleryProps) {
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);

  // Filtra mídia por tipo
  const filteredMedia = selectedMediaType
    ? media.filter((m) => m.media_type === selectedMediaType)
    : media;

  // Obtém tipos de mídia disponíveis
  const mediaTypes = Array.from(new Set(media.map((m) => m.media_type)));

  // Obtém ícone para tipo de mídia
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "document":
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  // Formata tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Formata data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (media.length === 0) {
    return (
      <div
        className={cn(
          "p-8 text-center rounded-lg",
          isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
        )}
      >
        <p
          className={cn(
            "text-sm",
            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
          )}
        >
          Nenhuma mídia encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros por tipo */}
      {mediaTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedMediaType(null)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              selectedMediaType === null
                ? "bg-[#00a884] text-white"
                : isDarkMode
                ? "bg-[#2a3942] text-[#8696a0] hover:bg-[#374045]"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            )}
          >
            Tudo ({media.length})
          </button>
          {mediaTypes.map((type) => {
            const count = media.filter((m) => m.media_type === type).length;
            return (
              <button
                key={type}
                onClick={() => setSelectedMediaType(type)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                  selectedMediaType === type
                    ? "bg-[#00a884] text-white"
                    : isDarkMode
                    ? "bg-[#2a3942] text-[#8696a0] hover:bg-[#374045]"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                )}
              >
                {getMediaIcon(type)}
                {type} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de mídia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedia.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-lg overflow-hidden group cursor-pointer transition-all hover:shadow-lg",
              isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
            )}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-[#1f2c33] flex items-center justify-center overflow-hidden">
              {item.media_type === "image" && item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.file_name}
                  className="w-full h-full object-cover"
                />
              ) : item.media_type === "video" && item.thumbnail_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={item.thumbnail_url}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {getMediaIcon(item.media_type)}
                  <span className="text-xs text-[#8696a0]">
                    {item.media_type}
                  </span>
                </div>
              )}

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onDownload && (
                  <button
                    onClick={() => onDownload(item)}
                    className="p-2 rounded-full bg-[#00a884] text-white hover:bg-[#00a884]/90 transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}
                title={item.file_name}
              >
                {item.file_name}
              </p>
              <div
                className={cn(
                  "text-xs mt-1 space-y-1",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}
              >
                <p>{formatFileSize(item.file_size || 0)}</p>
                <p>{formatDate(item.uploaded_at)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mensagem quando nenhuma mídia do tipo selecionado */}
      {filteredMedia.length === 0 && selectedMediaType && (
        <div
          className={cn(
            "p-8 text-center rounded-lg",
            isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
          )}
        >
          <p
            className={cn(
              "text-sm",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}
          >
            Nenhuma mídia do tipo "{selectedMediaType}" encontrada
          </p>
        </div>
      )}
    </div>
  );
}
