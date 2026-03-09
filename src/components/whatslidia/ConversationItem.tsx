"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/chat";
import { Check, CheckCheck, VolumeX, Pin } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const { contact, lastMessage, unreadCount, status, priority, isTyping } = conversation;

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return messageDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Ontem";
    } else if (days < 7) {
      return messageDate.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const getStatusIcon = () => {
    if (!lastMessage?.isFromMe) return null;

    switch (lastMessage.status) {
      case "sent":
        return <Check className="w-3.5 h-3.5 text-[#8696a0]" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />;
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />;
      default:
        return null;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full p-3 flex items-start gap-3 transition-all duration-200 border-b border-[#2a2a2a]",
        isSelected
          ? "bg-[#2a3942] hover:bg-[#2a3942]"
          : unreadCount > 0
          ? "bg-[#1a1a1a] hover:bg-[#202c33]"
          : "bg-transparent hover:bg-[#202c33]"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium">
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>
        {/* Priority indicator */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111b21]",
            getPriorityColor()
          )}
          title={`Prioridade: ${priority}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Header: Name and Time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3
            className={cn(
              "font-medium truncate",
              isSelected ? "text-[#e9edef]" : "text-[#e9edef]"
            )}
          >
            {contact.name}
          </h3>
          <span
            className={cn(
              "text-xs shrink-0",
              unreadCount > 0 ? "text-[#00a884] font-medium" : "text-[#8696a0]"
            )}
          >
            {lastMessage && formatTime(lastMessage.timestamp)}
          </span>
        </div>

        {/* Message Preview */}
        <div className="flex items-center gap-1">
          {/* Status icon for sent messages */}
          {getStatusIcon()}

          {/* Typing indicator */}
          {isTyping ? (
            <span className="text-[#00a884] text-sm italic">digitando...</span>
          ) : (
            <p
              className={cn(
                "text-sm truncate flex-1",
                unreadCount > 0
                  ? "text-[#e9edef] font-medium"
                  : "text-[#8696a0]"
              )}
            >
              {lastMessage?.content || "Sem mensagens"}
            </p>
          )}

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="shrink-0 bg-[#00a884] text-white text-xs font-medium min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* Tags */}
        {conversation.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {conversation.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]"
              >
                {tag}
              </span>
            ))}
            {conversation.tags.length > 2 && (
              <span className="text-[10px] text-[#8696a0]">
                +{conversation.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
