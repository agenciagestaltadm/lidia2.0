"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, MessageType } from "@/types/chat";
import {
  X,
  Phone,
  Video,
  BellOff,
  Bell,
  Pin,
  PinOff,
  Ban,
  Flag,
  Shield,
  Lock,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  FileText,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
} from "lucide-react";

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  isDarkMode: boolean;
}

type MediaTab = "photos" | "videos" | "links" | "documents";

// Mock data for shared media - in production this would come from API
const mockSharedMedia = {
  photos: [
    { id: "1", url: "/1.png", timestamp: new Date(), type: "image" as const },
    { id: "2", url: "/2.png", timestamp: new Date(), type: "image" as const },
    { id: "3", url: "/3.png", timestamp: new Date(), type: "image" as const },
  ],
  videos: [
    { id: "1", url: "/video1.mp4", thumbnail: "/1.png", duration: 120, type: "video" as const },
  ],
  links: [
    { id: "1", url: "https://example.com", title: "Example Site", preview: "Preview do link compartilhado...", type: "link" as const },
    { id: "2", url: "https://google.com", title: "Google", preview: "Busca na web...", type: "link" as const },
  ],
  documents: [
    { id: "1", name: "documento.pdf", size: 1024000, type: "application/pdf" as const },
    { id: "2", name: "contrato.docx", size: 512000, type: "application/docx" as const },
  ],
};

export function ContactInfoModal({
  isOpen,
  onClose,
  conversation,
  isDarkMode,
}: ContactInfoModalProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>("photos");
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPhotoZoomed) {
          setIsPhotoZoomed(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isPhotoZoomed]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPhotoZoomed(false);
      setActiveTab("photos");
    }
  }, [isOpen]);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLastSeen = () => {
    // Mock last seen - in production would come from conversation data
    return "visto por último hoje às 14:30";
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "mute":
        setIsMuted(!isMuted);
        break;
      case "pin":
        setIsPinned(!isPinned);
        break;
      case "block":
        // Would trigger confirmation dialog
        console.log("Block contact");
        break;
      case "report":
        // Would trigger report dialog
        console.log("Report contact");
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  if (!conversation) return null;

  const { contact } = conversation;

  const actionButtons = [
    {
      id: "voice",
      icon: Phone,
      label: "Áudio",
      onClick: () => handleAction("voice"),
    },
    {
      id: "video",
      icon: VideoIcon,
      label: "Vídeo",
      onClick: () => handleAction("video"),
    },
    {
      id: "mute",
      icon: isMuted ? Bell : BellOff,
      label: isMuted ? "Ativar" : "Silenciar",
      onClick: () => handleAction("mute"),
      active: isMuted,
    },
    {
      id: "pin",
      icon: isPinned ? PinOff : Pin,
      label: isPinned ? "Desafixar" : "Fixar",
      onClick: () => handleAction("pin"),
      active: isPinned,
    },
    {
      id: "block",
      icon: Ban,
      label: "Bloquear",
      onClick: () => handleAction("block"),
      danger: true,
    },
    {
      id: "report",
      icon: Flag,
      label: "Reportar",
      onClick: () => handleAction("report"),
      danger: true,
    },
  ];

  const tabs: { id: MediaTab; label: string; count: number }[] = [
    { id: "photos", label: "Fotos", count: mockSharedMedia.photos.length },
    { id: "videos", label: "Vídeos", count: mockSharedMedia.videos.length },
    { id: "links", label: "Links", count: mockSharedMedia.links.length },
    { id: "documents", label: "Docs", count: mockSharedMedia.documents.length },
  ];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { 
      x: isMobile ? 0 : "100%",
      opacity: isMobile ? 0 : 1,
      scale: isMobile ? 0.95 : 1,
    },
    visible: { 
      x: 0, 
      opacity: 1,
      scale: 1,
    },
    exit: { 
      x: isMobile ? 0 : "100%",
      opacity: isMobile ? 0 : 1,
      scale: isMobile ? 0.95 : 1,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 bg-black/70 backdrop-blur-sm",
              isMobile && "bg-black/80"
            )}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300,
              duration: 0.3 
            }}
            className={cn(
              "relative z-10 h-full overflow-hidden shadow-2xl",
              // Desktop: slide from right
              "md:ml-auto md:w-[380px] lg:w-[420px]",
              // Mobile: full screen overlay
              isMobile && "w-full",
              isDarkMode ? "bg-[#0b141a]" : "bg-white"
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 border-b",
                isDarkMode
                  ? "bg-[#1f2c33] border-[#2a2a2a]"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                {isMobile && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isDarkMode
                        ? "text-[#aebac1] hover:bg-[#2a3942]"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
                <h2
                  className={cn(
                    "font-semibold text-lg",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                  )}
                >
                  Informações do contato
                </h2>
              </div>
              {!isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDarkMode
                      ? "text-[#aebac1] hover:bg-[#2a3942]"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="h-[calc(100%-60px)] overflow-y-auto scrollbar-thin">
              {/* Profile Section */}
              <div
                className={cn(
                  "p-6 flex flex-col items-center border-b",
                  isDarkMode
                    ? "bg-[#1f2c33] border-[#2a2a2a]"
                    : "bg-white border-gray-200"
                )}
              >
                {/* Avatar with Zoom */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPhotoZoomed(true)}
                  className="relative cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-28 h-28 rounded-full overflow-hidden transition-shadow duration-300",
                      "ring-4 ring-offset-2",
                      isDarkMode
                        ? "ring-[#00a884] ring-offset-[#1f2c33]"
                        : "ring-[#00a884] ring-offset-white",
                      "group-hover:shadow-xl group-hover:shadow-[#00a884]/20"
                    )}
                  >
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white text-3xl font-semibold">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Zoom indicator */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      "bg-black/40"
                    )}
                  >
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                  {/* Online status badge */}
                  {contact.isRegistered && (
                    <div
                      className={cn(
                        "absolute bottom-1 right-1 w-6 h-6 bg-[#00a884] rounded-full border-4",
                        isDarkMode ? "border-[#1f2c33]" : "border-white"
                      )}
                    />
                  )}
                </motion.div>

                {/* Name and Status */}
                <div className="mt-4 text-center">
                  <h3
                    className={cn(
                      "text-xl font-semibold",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    {contact.name}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      contact.isRegistered
                        ? "text-[#00a884]"
                        : isDarkMode
                        ? "text-[#8696a0]"
                        : "text-gray-500"
                    )}
                  >
                    {contact.isRegistered ? "online" : getLastSeen()}
                  </p>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div
                className={cn(
                  "p-4 border-b",
                  isDarkMode
                    ? "bg-[#1f2c33] border-[#2a2a2a]"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="grid grid-cols-3 gap-2">
                  {actionButtons.map((button) => (
                    <motion.button
                      key={button.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={button.onClick}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                        button.danger
                          ? isDarkMode
                            ? "hover:bg-red-500/10"
                            : "hover:bg-red-50"
                          : button.active
                          ? isDarkMode
                            ? "bg-[#00a884]/20"
                            : "bg-[#00a884]/10"
                          : isDarkMode
                          ? "hover:bg-[#2a3942]"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                          button.danger
                            ? "bg-red-500/20 text-red-400"
                            : button.active
                            ? "bg-[#00a884] text-white"
                            : isDarkMode
                            ? "bg-[#2a3942] text-[#aebac1]"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        <button.icon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          button.danger
                            ? "text-red-400"
                            : isDarkMode
                            ? "text-[#aebac1]"
                            : "text-gray-600"
                        )}
                      >
                        {button.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Contact Details */}
              <div
                className={cn(
                  "p-4 border-b",
                  isDarkMode
                    ? "bg-[#1f2c33] border-[#2a2a2a]"
                    : "bg-white border-gray-200"
                )}
              >
                {/* Phone */}
                <div className="mb-4">
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider mb-1",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    Telefone
                  </p>
                  <p
                    className={cn(
                      "text-base",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    {formatPhone(contact.phone)}
                  </p>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {contact.source === "whatsapp"
                      ? "WhatsApp"
                      : contact.source}
                  </p>
                </div>

                {/* About/Description */}
                {contact.notes && (
                  <div>
                    <p
                      className={cn(
                        "text-xs uppercase tracking-wider mb-1",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Sobre
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      {contact.notes}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-4">
                    <p
                      className={cn(
                        "text-xs uppercase tracking-wider mb-2",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Etiquetas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            isDarkMode
                              ? "bg-[#2a3942] text-[#e9edef]"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shared Media Section */}
              <div
                className={cn(
                  "p-4 border-b",
                  isDarkMode
                    ? "bg-[#1f2c33] border-[#2a2a2a]"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4
                    className={cn(
                      "font-semibold",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    Mídia, links e docs
                  </h4>
                  <button
                    className={cn(
                      "text-sm flex items-center gap-1 transition-colors",
                      isDarkMode
                        ? "text-[#00a884] hover:text-[#00a884]/80"
                        : "text-[#00a884] hover:text-[#00a884]/80"
                    )}
                  >
                    Ver tudo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        activeTab === tab.id
                          ? isDarkMode
                            ? "bg-[#00a884] text-white"
                            : "bg-[#00a884] text-white"
                          : isDarkMode
                          ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {activeTab === "photos" &&
                    mockSharedMedia.photos.map((photo) => (
                      <motion.div
                        key={photo.id}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden cursor-pointer",
                          "ring-2 ring-offset-1 transition-all",
                          isDarkMode
                            ? "ring-offset-[#1f2c33] ring-transparent hover:ring-[#00a884]/50"
                            : "ring-offset-white ring-transparent hover:ring-[#00a884]/50"
                        )}
                      >
                        <img
                          src={photo.url}
                          alt="Shared photo"
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}

                  {activeTab === "videos" &&
                    mockSharedMedia.videos.map((video) => (
                      <motion.div
                        key={video.id}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden cursor-pointer relative",
                          "ring-2 ring-offset-1 transition-all",
                          isDarkMode
                            ? "ring-offset-[#1f2c33] ring-transparent hover:ring-[#00a884]/50"
                            : "ring-offset-white ring-transparent hover:ring-[#00a884]/50"
                        )}
                      >
                        <img
                          src={video.thumbnail}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <VideoIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                          {formatDuration(video.duration)}
                        </div>
                      </motion.div>
                    ))}

                  {activeTab === "links" &&
                    mockSharedMedia.links.map((link) => (
                      <motion.a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "col-span-3 p-3 rounded-lg transition-colors",
                          isDarkMode
                            ? "bg-[#2a3942] hover:bg-[#374045]"
                            : "bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                            )}
                          >
                            <LinkIcon
                              className={cn(
                                "w-5 h-5",
                                isDarkMode
                                  ? "text-[#00a884]"
                                  : "text-[#00a884]"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                isDarkMode
                                  ? "text-[#e9edef]"
                                  : "text-gray-900"
                              )}
                            >
                              {link.title}
                            </p>
                            <p
                              className={cn(
                                "text-xs truncate",
                                isDarkMode
                                  ? "text-[#8696a0]"
                                  : "text-gray-500"
                              )}
                            >
                              {link.preview}
                            </p>
                          </div>
                        </div>
                      </motion.a>
                    ))}

                  {activeTab === "documents" &&
                    mockSharedMedia.documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "col-span-3 p-3 rounded-lg transition-colors",
                          isDarkMode
                            ? "bg-[#2a3942] hover:bg-[#374045]"
                            : "bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                            )}
                          >
                            <FileText
                              className={cn(
                                "w-5 h-5",
                                isDarkMode
                                  ? "text-[#00a884]"
                                  : "text-[#00a884]"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                isDarkMode
                                  ? "text-[#e9edef]"
                                  : "text-gray-900"
                              )}
                            >
                              {doc.name}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                isDarkMode
                                  ? "text-[#8696a0]"
                                  : "text-gray-500"
                              )}
                            >
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Encryption Section */}
              <div
                className={cn(
                  "p-4",
                  isDarkMode ? "bg-[#1f2c33]" : "bg-white"
                )}
              >
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        isDarkMode
                          ? "bg-[#00a884]/20"
                          : "bg-[#00a884]/10"
                      )}
                    >
                      <Lock
                        className={cn(
                          "w-5 h-5",
                          isDarkMode ? "text-[#00a884]" : "text-[#00a884]"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "font-medium text-sm",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        Criptografia de ponta a ponta
                      </h4>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        As mensagens e chamadas são protegidas com criptografia
                        de ponta a ponta. Nem mesmo o WhatsApp pode ler ou
                        ouvi-las.
                      </p>
                      <button
                        className={cn(
                          "text-xs mt-2 font-medium transition-colors",
                          isDarkMode
                            ? "text-[#00a884] hover:text-[#00a884]/80"
                            : "text-[#00a884] hover:text-[#00a884]/80"
                        )}
                      >
                        Saiba mais
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photo Zoom Modal */}
          <AnimatePresence>
            {isPhotoZoomed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
                onClick={() => setIsPhotoZoomed(false)}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsPhotoZoomed(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="max-w-[90vw] max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-80 h-80 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white text-8xl font-semibold">
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
