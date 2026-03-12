"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Smile,
  Reply,
  Edit,
  Trash2,
  Pin,
  Check,
  CheckCheck,
  Clock,
  FileIcon,
  ImageIcon,
  Video,
  Music,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAddReaction } from "@/hooks/use-internal-chat";
import type { ChatMessage } from "@/types/internal-chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar: boolean;
  onReply?: (messageId: string, content: string, senderName: string) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export function MessageBubble({ message, showAvatar, onReply }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const addReaction = useAddReaction();

  const isMe = message.sender?.id === "current-user-id"; // Substituir pelo ID real
  const hasReactions = message.reactions && message.reactions.length > 0;

  const handleReaction = (emoji: string) => {
    addReaction.mutate({ messageId: message.id, emoji });
    setShowReactions(false);
  };

  const getStatusIcon = () => {
    if (message.readBy && message.readBy.length > 0) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    // Simplified status - would need actual delivery status from backend
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  const renderAttachment = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const attachment = message.attachments[0];
    const isImage = attachment.mimeType.startsWith("image/");
    const isVideo = attachment.mimeType.startsWith("video/");
    const isAudio = attachment.mimeType.startsWith("audio/");

    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-w-full h-auto object-cover"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
          <video
            src={attachment.url}
            controls
            className="max-w-full h-auto"
          />
        </div>
      );
    }

    return (
      <a
        href={attachment.url}
        download={attachment.fileName}
        className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors max-w-sm"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          {isAudio ? (
            <Music className="h-5 w-5 text-primary" />
          ) : (
            <FileIcon className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <Download className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex gap-3",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback>
            {message.sender?.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
        {/* Sender Name */}
        {showAvatar && !isMe && (
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {message.sender?.name}
          </span>
        )}

        {/* Reply Reference */}
        {message.replyTo && (
          <div className={cn(
            "mb-1 px-3 py-1.5 rounded-lg text-sm border-l-2",
            isMe
              ? "bg-primary/10 border-primary text-right"
              : "bg-muted border-primary text-left"
          )}>
            <p className="text-xs text-muted-foreground mb-0.5">
              Respondendo a {message.replyTo.senderName}
            </p>
            <p className="truncate text-muted-foreground">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachments */}
          {renderAttachment()}

          {/* Reactions */}
          {hasReactions && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions?.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                    reaction.userReacted
                      ? "bg-primary/20 text-primary"
                      : "bg-background/50 hover:bg-background"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count > 1 && <span>{reaction.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "flex items-center gap-1 mt-1 text-[10px]",
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span>
              {format(new Date(message.createdAt), "HH:mm", { locale: ptBR })}
            </span>
            {isMe && getStatusIcon()}
            {message.isEdited && <span>(editada)</span>}
          </div>
        </div>

        {/* Reaction Picker (on hover) */}
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 mt-1 p-1 rounded-full bg-card border border-border shadow-sm"
          >
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-6 h-6 flex items-center justify-center hover:bg-accent rounded text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Actions Menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMe ? "end" : "start"}>
            <DropdownMenuItem onClick={() => onReply?.(message.id, message.content, message.sender?.name || "")}>
              <Reply className="h-4 w-4 mr-2" />
              Responder
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Smile className="h-4 w-4 mr-2" />
              Reagir
            </DropdownMenuItem>
            {isMe && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
