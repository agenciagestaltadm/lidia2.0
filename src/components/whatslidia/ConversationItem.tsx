"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/chat";
import { Check, CheckCheck, XCircle, Eye, Play, RotateCcw } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
  activeTab?: 'open' | 'pending' | 'resolved';
  onForceClose?: (id: string) => void;
  onPreview?: (id: string) => void;
  onOpenConversation?: (id: string) => void;
  onReopen?: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
  isDarkMode = true,
  activeTab = 'open',
  onForceClose,
  onPreview,
  onOpenConversation,
  onReopen,
}: ConversationItemProps) {
  const { contact, lastMessage, unreadCount, priority, isTyping } = conversation;

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
        return <Check className={cn("w-3.5 h-3.5", isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />;
      case "delivered":
        return <CheckCheck className={cn("w-3.5 h-3.5", isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />;
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

  const handleForceClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onForceClose?.(conversation.id);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(conversation.id);
  };

  const handleOpenConversation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenConversation?.(conversation.id);
  };

  const handleReopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReopen?.(conversation.id);
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        "w-full p-3 flex items-start gap-3 transition-all duration-200 border-b group",
        isDarkMode ? "border-[#2a2a2a]" : "border-gray-200",
        isSelected
          ? isDarkMode 
            ? "bg-[#2a3942]" 
            : "bg-emerald-50"
          : unreadCount > 0
          ? isDarkMode 
            ? "bg-[#1a1a1a]" 
            : "bg-white"
          : isDarkMode 
            ? "bg-transparent hover:bg-[#202c33]" 
            : "bg-transparent hover:bg-gray-50"
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
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2",
            isDarkMode ? "border-[#111b21]" : "border-white",
            getPriorityColor()
          )}
          title={`Prioridade: ${priority}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Header: Name and Time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className={cn(
            "font-medium truncate",
            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
          )}>
            {contact.name}
          </h3>
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs shrink-0",
              unreadCount > 0 
                ? isDarkMode ? "text-[#00a884] font-medium" : "text-emerald-600 font-medium"
                : isDarkMode ? "text-[#8696a0]" : "text-gray-400"
            )}>
              {lastMessage && formatTime(lastMessage.timestamp)}
            </span>
            
            {/* Action Icons - Always visible inline */}
            {activeTab === 'open' && (
              <div className="flex items-center gap-0.5">
                {onPreview && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePreview}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      isDarkMode
                        ? "text-[#8696a0] hover:bg-blue-500/20 hover:text-blue-400"
                        : "text-gray-400 hover:bg-blue-100 hover:text-blue-600"
                    )}
                    title="Visualizar conversa"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                )}
                {onForceClose && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleForceClose}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      isDarkMode
                        ? "text-[#8696a0] hover:bg-red-500/20 hover:text-red-400"
                        : "text-gray-400 hover:bg-red-100 hover:text-red-600"
                    )}
                    title="Fechar conversa"
                  >
                    <XCircle className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
            
            {activeTab === 'pending' && onOpenConversation && (
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenConversation}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    isDarkMode
                      ? "text-[#8696a0] hover:bg-emerald-500/20 hover:text-emerald-400"
                      : "text-gray-400 hover:bg-emerald-100 hover:text-emerald-600"
                  )}
                  title="Atender conversa"
                >
                  <Play className="w-4 h-4" />
                </motion.button>
              </div>
            )}
            
            {activeTab === 'resolved' && onReopen && (
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReopen}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    isDarkMode
                      ? "text-[#8696a0] hover:bg-emerald-500/20 hover:text-emerald-400"
                      : "text-gray-400 hover:bg-emerald-100 hover:text-emerald-600"
                  )}
                  title="Reabrir conversa"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Message Preview */}
        <div className="flex items-center gap-1">
          {/* Status icon for sent messages */}
          {getStatusIcon()}

          {/* Typing indicator */}
          {isTyping ? (
            <span className="text-[#00a884] text-sm italic">digitando...</span>
          ) : (
            <p className={cn(
              "text-sm truncate flex-1",
              unreadCount > 0
                ? isDarkMode ? "text-[#e9edef] font-medium" : "text-gray-900 font-medium"
                : isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              {lastMessage?.content || "Sem mensagens"}
            </p>
          )}

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className={cn(
              "shrink-0 text-white text-xs font-medium min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center",
              isDarkMode ? "bg-[#00a884]" : "bg-emerald-500"
            )}>
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
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  isDarkMode 
                    ? "bg-[#2a3942] text-[#8696a0]" 
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {tag}
              </span>
            ))}
            {conversation.tags.length > 2 && (
              <span className={cn(
                "text-[10px]",
                isDarkMode ? "text-[#8696a0]" : "text-gray-400"
              )}>
                +{conversation.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
