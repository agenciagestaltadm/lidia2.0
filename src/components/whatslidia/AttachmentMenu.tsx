"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Video,
  Image,
  FileText,
  User,
  MousePointerClick,
  List,
  FileType,
  Link,
  MessageSquare,
  MapPin,
  MapPinned,
  Navigation,
  GitBranch,
  X,
  Upload,
  Send,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "video" | "document" | "audio";
  size: number;
}

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSendAttachments: (files: AttachmentFile[], caption?: string) => void;
  onSendLocation: (type: "location" | "address" | "request") => void;
  onSendContact: () => void;
  onSendTemplate: (type: string) => void;
  onSendFlow: () => void;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

const MAX_FILE_SIZE_DEFAULT = 100; // 100MB default

// Menu items based on the reference image
const menuItems = [
  { id: "videoconf", icon: Video, label: "Link Videoconf.", color: "bg-purple-500", category: "media" },
  { id: "gallery", icon: Image, label: "Arquivo Galeria", color: "bg-pink-500", category: "media" },
  { id: "contact", icon: User, label: "Enviar Contato", color: "bg-blue-500", category: "contact" },
  { id: "buttons", icon: MousePointerClick, label: "Enviar Botões", color: "bg-orange-500", category: "interactive" },
  { id: "lists", icon: List, label: "Enviar Listas", color: "bg-teal-500", category: "interactive" },
  { id: "templates", icon: FileType, label: "Templates", color: "bg-indigo-500", category: "template" },
  { id: "cta", icon: Link, label: "Enviar CTA URL", color: "bg-cyan-500", category: "interactive" },
  { id: "replybuttons", icon: MessageSquare, label: "Botões Resposta", color: "bg-amber-500", category: "interactive" },
  { id: "address", icon: MapPin, label: "Enviar Endereço", color: "bg-red-500", category: "location" },
  { id: "requestlocation", icon: Navigation, label: "Solicitar Localização", color: "bg-lime-500", category: "location" },
  { id: "location", icon: MapPinned, label: "Enviar Localização", color: "bg-green-500", category: "location" },
  { id: "flow", icon: GitBranch, label: "Enviar Flow", color: "bg-violet-500", category: "flow" },
];

export function AttachmentMenu({
  isOpen,
  onClose,
  isDarkMode,
  onSendAttachments,
  onSendLocation,
  onSendContact,
  onSendTemplate,
  onSendFlow,
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  disabled = false,
}: AttachmentMenuProps) {
  const [selectedFiles, setSelectedFiles] = useState<AttachmentFile[]>([]);
  const [caption, setCaption] = useState("");
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    const newFiles: AttachmentFile[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name} excede o limite de ${maxFileSize}MB`);
        return;
      }

      // Determine file type
      let type: AttachmentFile["type"] = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";

      // Create preview for images
      let preview: string | undefined;
      if (type === "image") {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        id: `file-${Date.now()}-${index}`,
        file,
        preview,
        type,
        size: file.size,
      });
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setShowCaptionModal(true);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [maxFileSize]);

  // Remove a selected file
  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Handle send with caption
  const handleSend = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    clearInterval(progressInterval);
    setUploadProgress(100);

    // Send files
    onSendAttachments(selectedFiles, caption.trim() || undefined);

    // Cleanup
    setTimeout(() => {
      selectedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setSelectedFiles([]);
      setCaption("");
      setShowCaptionModal(false);
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
    }, 500);
  }, [selectedFiles, caption, onSendAttachments, onClose]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle menu item click
  const handleMenuItemClick = (itemId: string) => {
    switch (itemId) {
      case "gallery":
        fileInputRef.current?.click();
        break;
      case "contact":
        onSendContact();
        onClose();
        break;
      case "address":
        onSendLocation("address");
        onClose();
        break;
      case "requestlocation":
        onSendLocation("request");
        onClose();
        break;
      case "location":
        onSendLocation("location");
        onClose();
        break;
      case "templates":
        onSendTemplate("template");
        onClose();
        break;
      case "flow":
        onSendFlow();
        onClose();
        break;
      default:
        // For other items, show a placeholder action
        console.log(`Selected: ${itemId}`);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input for multi-file selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Attachment Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          "border-b overflow-hidden",
          isDarkMode ? "border-[#2a2a2a] bg-[#1f2c33]" : "border-gray-200 bg-white"
        )}
      >
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mx-4 mt-3 p-3 rounded-lg flex items-center gap-2 text-sm",
                isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
              )}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-pre-line">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Menu Grid */}
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMenuItemClick(item.id)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center gap-1.5 group",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg",
                    item.color,
                    "group-hover:shadow-xl group-hover:brightness-110"
                  )}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  "text-[10px] text-center leading-tight max-w-[60px] line-clamp-2",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Caption & Preview Modal */}
      <AnimatePresence>
        {showCaptionModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !isUploading && setShowCaptionModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-[90%] max-w-lg rounded-2xl shadow-2xl overflow-hidden",
                isDarkMode ? "bg-[#1f2c33]" : "bg-white"
              )}
            >
              {/* Header */}
              <div className={cn(
                "px-4 py-3 border-b flex items-center justify-between",
                isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
              )}>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </h3>
                {!isUploading && (
                  <button
                    onClick={() => setShowCaptionModal(false)}
                    className={cn(
                      "p-1 rounded-full hover:bg-black/10 transition-colors",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* File Preview Grid */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden group",
                        isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
                      )}
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <FileText className={cn(
                            "w-8 h-8",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )} />
                          <span className={cn(
                            "text-[10px] text-center px-1 truncate max-w-full",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}>
                            {file.file.name}
                          </span>
                        </div>
                      )}

                      {/* File size badge */}
                      <div className={cn(
                        "absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-medium",
                        isDarkMode ? "bg-black/60 text-white" : "bg-white/80 text-gray-700"
                      )}>
                        {formatFileSize(file.size)}
                      </div>

                      {/* Remove button */}
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className={cn(
                            "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center",
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            isDarkMode ? "bg-red-500 text-white" : "bg-red-500 text-white"
                          )}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* File number badge */}
                      <div className={cn(
                        "absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isDarkMode ? "bg-[#00a884] text-white" : "bg-emerald-500 text-white"
                      )}>
                        {index + 1}
                      </div>
                    </motion.div>
                  ))}

                  {/* Add more files button */}
                  {!isUploading && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
                        isDarkMode 
                          ? "border-[#374045] hover:border-[#00a884] text-[#8696a0]" 
                          : "border-gray-300 hover:border-emerald-500 text-gray-400"
                      )}
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px]">Adicionar</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Caption Input */}
              <div className={cn(
                "px-4 py-3 border-t",
                isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
              )}>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicionar uma legenda..."
                  disabled={isUploading}
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className={cn(
                  "px-4 py-3 border-t",
                  isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
                )}>
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#00a884]" />
                    <div className="flex-1">
                      <div className={cn(
                        "h-2 rounded-full overflow-hidden",
                        isDarkMode ? "bg-[#2a3942]" : "bg-gray-200"
                      )}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-[#00a884] rounded-full"
                        />
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}>
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className={cn(
                "px-4 py-3 border-t flex items-center justify-end gap-2",
                isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
              )}>
                {!isUploading && (
                  <button
                    onClick={() => setShowCaptionModal(false)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      isDarkMode 
                        ? "text-[#e9edef] hover:bg-[#2a3942]" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={isUploading || selectedFiles.length === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    "bg-[#00a884] text-white hover:bg-[#00a884]/90",
                    (isUploading || selectedFiles.length === 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar {selectedFiles.length > 1 && `(${selectedFiles.length})`}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
