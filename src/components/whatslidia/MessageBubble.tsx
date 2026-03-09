"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { Check, CheckCheck, Clock, AlertCircle, File, Play, Pause } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isDarkMode?: boolean;
}

export function MessageBubble({
  message,
  isFirstInGroup = false,
  isLastInGroup = false,
  isDarkMode = true,
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    if (!message.isFromMe) return null;

    const baseClasses = "w-3.5 h-3.5";

    switch (message.status) {
      case "sent":
        return <Check className={cn(baseClasses, "text-[#8696a0]")} />;
      case "delivered":
        return <CheckCheck className={cn(baseClasses, "text-[#8696a0]")} />;
      case "read":
        return <CheckCheck className={cn(baseClasses, "text-[#53bdeb]")} />;
      case "failed":
        return <AlertCircle className={cn(baseClasses, "text-red-500")} />;
      default:
        return <Clock className={cn(baseClasses, "text-[#8696a0]")} />;
    }
  };

  const renderMediaContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="relative group cursor-pointer">
            <div className="bg-[#2a3942] rounded-lg w-48 h-48 flex items-center justify-center">
              <span className="text-[#8696a0] text-xs">[Imagem]</span>
            </div>
            {message.metadata?.caption && (
              <p className="mt-1 text-sm">{message.metadata.caption}</p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="relative group cursor-pointer">
            <div className="bg-[#2a3942] rounded-lg w-48 h-36 flex items-center justify-center">
              <Play className="w-10 h-10 text-white/70" />
            </div>
            {message.metadata?.duration && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {Math.floor(message.metadata.duration / 60)}:
                {String(message.metadata.duration % 60).padStart(2, "0")}
              </span>
            )}
            {message.metadata?.caption && (
              <p className="mt-1 text-sm">{message.metadata.caption}</p>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white hover:bg-[#00a884]/90 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              {/* Audio waveform placeholder */}
              <div className="h-8 flex items-center gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#00a884]/50 rounded-full"
                    style={{
                      height: `${Math.random() * 100}%`,
                      minHeight: "20%",
                    }}
                  />
                ))}
              </div>
            </div>
            {message.metadata?.duration && (
              <span className="text-xs text-[#8696a0]">
                {Math.floor(message.metadata.duration / 60)}:
                {String(message.metadata.duration % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        );

      case "document":
        return (
          <div className="flex items-center gap-3 bg-[#2a3942] rounded-lg p-3 cursor-pointer hover:bg-[#2a3942]/80 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#1f2c33] flex items-center justify-center">
              <File className="w-6 h-6 text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.metadata?.fileName || "Documento"}
              </p>
              {message.metadata?.fileSize && (
                <p className="text-xs text-[#8696a0]">
                  {(message.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex",
        message.isFromMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] min-w-[80px] relative transition-colors duration-300",
          message.isFromMe
            ? isDarkMode 
              ? "bg-[#005c4b] rounded-l-2xl rounded-tr-2xl rounded-br-md"
              : "bg-emerald-100 rounded-l-2xl rounded-tr-2xl rounded-br-md"
            : isDarkMode
              ? "bg-[#202c33] rounded-r-2xl rounded-tl-2xl rounded-bl-md"
              : "bg-white rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-sm",
          isFirstInGroup && (message.isFromMe ? "rounded-tr-none" : "rounded-tl-none"),
          isLastInGroup && (message.isFromMe ? "rounded-br-md" : "rounded-bl-md")
        )}
      >
        {/* Message Content */}
        <div className="px-3 py-2">
          {/* Sender name for group chats */}
          {!message.isFromMe && message.sender && (
            <p className="text-[#53bdeb] text-sm font-medium mb-1">
              {message.sender.name}
            </p>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={cn(
              "border-l-4 border-[#00a884] pl-2 mb-2 py-1 rounded-r",
              isDarkMode ? "bg-black/10" : "bg-gray-100"
            )}>
              <p className="text-xs text-[#00a884] font-medium">
                {message.replyTo.sender}
              </p>
              <p className={cn(
                "text-xs truncate",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Media content */}
          {message.type !== "text" && message.type !== "template" && (
            <div className="mb-1">{renderMediaContent()}</div>
          )}

          {/* Text content */}
          {(message.type === "text" || message.metadata?.caption) && (
            <p className={cn(
              "text-sm whitespace-pre-wrap break-words",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              {message.type === "text" ? message.content : message.metadata?.caption}
            </p>
          )}

          {/* Template message */}
          {message.type === "template" && (
            <div className="border border-[#00a884]/30 rounded-lg p-2 bg-[#00a884]/5">
              <p className="text-xs text-[#00a884] mb-1">Template</p>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>{message.content}</p>
            </div>
          )}
        </div>

        {/* Footer: Time and Status */}
        <div className="flex items-center justify-end gap-1 px-3 pb-1 -mt-1">
          <span className={cn(
            "text-[10px]",
            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
          )}>
            {formatTime(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>

        {/* Triangle pointer for first in group */}
        {isFirstInGroup && (
          <div
            className={cn(
              "absolute top-0 w-3 h-3",
              message.isFromMe
                ? isDarkMode 
                  ? "right-[-4px] bg-[#005c4b]"
                  : "right-[-4px] bg-emerald-100"
                : isDarkMode
                  ? "left-[-4px] bg-[#202c33]"
                  : "left-[-4px] bg-white"
            )}
            style={{
              clipPath: message.isFromMe
                ? "polygon(0 0, 0% 100%, 100% 0)"
                : "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
