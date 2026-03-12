"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Smile, 
  MoreVertical, 
  Pin,
  Reply,
  Trash2,
  Edit3,
  FileText,
  Image as ImageIcon,
  Video,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatMessage, ChatUser } from "@/types/internal-chat";
import { useAddReaction, useDeleteMessage } from "@/hooks/use-internal-chat";

interface InternalMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isDarkMode: boolean;
  showAvatar?: boolean;
  onReply?: (message: ChatMessage) => void;
  onPin?: (messageId: string) => void;
  isPinned?: boolean;
  readBy?: { userId: string; readAt: string }[];
  companyUsers?: ChatUser[];
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export function InternalMessageBubble({
  message,
  isCurrentUser,
  isDarkMode,
  showAvatar = true,
  onReply,
  onPin,
  isPinned = false,
  readBy = [],
  companyUsers = [],
}: InternalMessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReadStatus, setShowReadStatus] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const addReaction = useAddReaction();
  const deleteMessage = useDeleteMessage();

  const handleReaction = useCallback(async (emoji: string) => {
    await addReaction.mutateAsync({ messageId: message.id, emoji });
    setShowEmojiPicker(false);
  }, [addReaction, message.id]);

  const handleDelete = useCallback(async () => {
    if (confirm("Deseja excluir esta mensagem?")) {
      await deleteMessage.mutateAsync(message.id);
    }
  }, [deleteMessage, message.id]);

  // Status de leitura (estilo WhatsApp)
  const getReadStatusIcon = () => {
    const readCount = readBy.length;
    
    if (readCount === 0) {
      return <Check className="w-3 h-3 text-gray-400" />;
    } else if (readCount === 1) {
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    } else {
      return <CheckCheck className="w-3 h-3 text-[#53bdeb]" />;
    }
  };

  // Formatar nome dos leitores
  const getReadStatusText = () => {
    if (readBy.length === 0) return "Enviada";
    
    const readNames = readBy
      .map(r => companyUsers.find(u => u.id === r.userId)?.name)
      .filter(Boolean)
      .slice(0, 3);
    
    if (readBy.length <= 3) {
      return `Lida por: ${readNames.join(", ")}`;
    } else {
      return `Lida por: ${readNames.join(", ")} e mais ${readBy.length - 3}`;
    }
  };

  // Renderizar anexos
  const renderAttachments = () => {
    if (!message.attachments?.length) return null;

    return (
      <div className="space-y-2 mt-2">
        {message.attachments.map((attachment, idx) => {
          const isImage = attachment.mimeType?.startsWith("image/");
          const isVideo = attachment.mimeType?.startsWith("video/");

          if (isImage) {
            return (
              <div key={idx} className="relative group">
                {!imageLoaded && (
                  <div className={cn(
                    "w-48 h-32 rounded-lg animate-pulse flex items-center justify-center",
                    isDarkMode ? "bg-[#2a2a2a]" : "bg-gray-200"
                  )}>
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className={cn(
                    "max-w-48 max-h-48 rounded-lg object-cover cursor-pointer transition-opacity",
                    imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => window.open(attachment.url, "_blank")}
                />
              </div>
            );
          }

          if (isVideo) {
            return (
              <video
                key={idx}
                src={attachment.url}
                controls
                className="max-w-48 max-h-48 rounded-lg"
                poster={undefined}
              />
            );
          }

          // Documento genérico
          return (
            <a
              key={idx}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg max-w-xs",
                isDarkMode ? "bg-[#2a2a2a] hover:bg-[#3a3a3a]" : "bg-white/20 hover:bg-white/30"
              )}
            >
              <FileText className="w-8 h-8 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{attachment.fileName}</p>
                <p className="text-xs opacity-70">
                  {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Download className="w-4 h-4 shrink-0" />
            </a>
          );
        })}
      </div>
    );
  };

  // Renderizar menções
  const renderContent = () => {
    let content = message.content;
    
    // Destacar menções
    companyUsers.forEach(user => {
      const mentionRegex = new RegExp(`@${user.name}`, "g");
      content = content.replace(mentionRegex, `<span class="bg-[#00a884]/30 px-1 rounded font-medium">@${user.name}</span>`);
    });

    return (
      <div 
        className="text-sm whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-2 group",
          isCurrentUser ? "flex-row-reverse" : ""
        )}
      >
        {/* Avatar */}
        {showAvatar && !isCurrentUser ? (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={message.sender?.avatar} />
            <AvatarFallback className={cn(
              "text-xs",
              isDarkMode ? "bg-[#2a2a2a] text-[#e9edef]" : "bg-gray-200"
            )}>
              {message.sender?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 shrink-0" />
        )}

        {/* Message Container */}
        <div className={cn(
          "flex flex-col max-w-[70%]",
          isCurrentUser ? "items-end" : "items-start"
        )}>
          {/* Sender Name (for group chats) */}
          {!isCurrentUser && showAvatar && (
            <span className={cn(
              "text-xs mb-1 px-1",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              {message.sender?.name}
            </span>
          )}

          {/* Message Bubble */}
          <div className="relative">
            {/* Pinned Badge */}
            {isPinned && (
              <div className={cn(
                "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center",
                isDarkMode ? "bg-[#00a884]" : "bg-blue-500"
              )}>
                <Pin className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Main Bubble */}
            <div
              className={cn(
                "relative px-3 py-2 rounded-lg",
                isCurrentUser
                  ? "bg-[#00a884] text-white rounded-br-sm"
                  : isDarkMode
                    ? "bg-[#202c33] text-[#e9edef] rounded-bl-sm"
                    : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
              )}
            >
              {/* Reply Reference */}
              {message.replyTo && (
                <div className={cn(
                  "mb-2 px-2 py-1 rounded border-l-2 text-xs",
                  isCurrentUser
                    ? "bg-[#00a884]/30 border-white/50"
                    : isDarkMode
                      ? "bg-[#2a2a2a] border-[#00a884]"
                      : "bg-gray-100 border-blue-400"
                )}>
                  <p className="opacity-70">{message.replyTo.senderName}</p>
                  <p className="truncate">{message.replyTo.content}</p>
                </div>
              )}

              {/* Content */}
              {renderContent()}

              {/* Attachments */}
              {renderAttachments()}

              {/* Footer: Time & Status */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={cn(
                  "text-[10px]",
                  isCurrentUser ? "text-white/70" : isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* Edited Indicator */}
                {message.isEdited && (
                  <span className={cn(
                    "text-[9px] italic",
                    isCurrentUser ? "text-white/50" : isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                  )}>
                    editada
                  </span>
                )}

                {/* Read Status (only for current user) */}
                {isCurrentUser && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowReadStatus(!showReadStatus)}
                        className="flex items-center"
                      >
                        {getReadStatusIcon()}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{getReadStatusText()}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Hover Actions */}
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isCurrentUser ? "-left-20" : "-right-20"
            )}>
              {/* Emoji Picker */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    isDarkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100"
                  )}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>

                {showEmojiPicker && (
                  <div className={cn(
                    "absolute bottom-full mb-1 left-0 p-2 rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1",
                    isDarkMode ? "bg-[#202c33] border border-[#2a2a2a]" : "bg-white border"
                  )}>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="hover:scale-125 transition-transform text-lg p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      isDarkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100"
                    )}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onReply?.(message)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Responder
                  </DropdownMenuItem>
                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(message.id)}>
                      <Pin className="w-4 h-4 mr-2" />
                      {isPinned ? "Desfixar" : "Fixar"}
                    </DropdownMenuItem>
                  )}
                  {isCurrentUser && (
                    <>
                      <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={cn(
              "flex gap-1 mt-1",
              isCurrentUser ? "flex-row-reverse" : ""
            )}>
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                    reaction.userReacted
                      ? isDarkMode
                        ? "bg-[#00a884]/30 text-[#00a884]"
                        : "bg-blue-100 text-blue-600"
                      : isDarkMode
                        ? "bg-[#2a2a2a] text-[#8696a0]"
                        : "bg-gray-100 text-gray-600"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count > 1 && <span>{reaction.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
