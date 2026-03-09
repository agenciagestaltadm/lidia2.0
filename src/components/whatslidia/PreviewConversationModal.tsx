"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, Message } from "@/types/chat";
import { getConversationMessages } from "@/lib/mock/chat-data";
import { 
  X, 
  Eye, 
  ExternalLink, 
  Lock, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  File,
  Play,
  Pause
} from "lucide-react";
import { useState } from "react";

interface PreviewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  isDarkMode: boolean;
  onOpenConversation?: (id: string) => void;
}

export function PreviewConversationModal({
  isOpen,
  onClose,
  conversation,
  isDarkMode,
  onOpenConversation,
}: PreviewConversationModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      const msgs = getConversationMessages(conversation.id);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (message: Message) => {
    if (!message.isFromMe) return null;

    const baseClasses = "w-3.5 h-3.5";

    switch (message.status) {
      case "sent":
        return <Check className={cn(baseClasses, isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />;
      case "delivered":
        return <CheckCheck className={cn(baseClasses, isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />;
      case "read":
        return <CheckCheck className={cn(baseClasses, "text-[#53bdeb]")} />;
      case "failed":
        return <AlertCircle className={cn(baseClasses, "text-red-500")} />;
      default:
        return <Clock className={cn(baseClasses, isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />;
    }
  };

  const handleOpenConversation = () => {
    if (conversation && onOpenConversation) {
      onOpenConversation(conversation.id);
      onClose();
    }
  };

  if (!conversation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[90%] max-w-2xl h-[80vh] max-h-[700px] rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isDarkMode ? "bg-[#111b21]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "h-16 px-4 flex items-center justify-between border-b shrink-0",
              isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium text-sm">
                  {conversation.contact.avatar ? (
                    <img
                      src={conversation.contact.avatar}
                      alt={conversation.contact.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    conversation.contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className={cn(
                    "font-medium",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                  )}>
                    {conversation.contact.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Eye className={cn(
                      "w-3 h-3",
                      isDarkMode ? "text-[#00a884]" : "text-emerald-500"
                    )} />
                    <span className={cn(
                      "text-xs",
                      isDarkMode ? "text-[#00a884]" : "text-emerald-600"
                    )}>
                      Modo Preview - Visualização sem marcar como lido
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Open Conversation Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenConversation}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-[#00a884] text-white hover:bg-[#00a884]/90"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Conversa
                </motion.button>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isDarkMode 
                      ? "text-[#aebac1] hover:bg-[#2a3942]" 
                      : "text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className={cn(
                "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent",
                isDarkMode ? "scrollbar-thumb-[#374045]" : "scrollbar-thumb-gray-300"
              )}
              style={{
                backgroundImage: isDarkMode 
                  ? "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAE5JREFUOE9j/P///38GMgAx2v///2cYmUyMioHRwCgYSMP/////Z0AXZ6SJgWg2/P///3+CpJmINAzNsJGjYOAomDg6hgfEwKgYTQwAqRcjE7aL4TQAAAAASUVORK5CYII=')"
                  : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAABJREFUOE9j/P///38GBgATiA0BAwMAgCYAl2kHbEUAAAAASUVORK5CYII=')",
                backgroundRepeat: "repeat",
              }}
            >
              {/* Encryption notice */}
              <div className="flex justify-center py-4">
                <div className={cn(
                  "px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg",
                  isDarkMode ? "bg-[#1f2c33]/90" : "bg-white/90"
                )}>
                  <Lock className={cn(
                    "w-3 h-3",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Mensagens criptografadas de ponta a ponta
                  </span>
                </div>
              </div>

              {/* Date separator */}
              <div className="flex justify-center py-4">
                <div className={cn(
                  "px-3 py-1 rounded-lg",
                  isDarkMode ? "bg-[#1f2c33]/90" : "bg-white/90"
                )}>
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    {new Date().toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 pb-4 space-y-1">
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const timeDiff = prevMessage
                    ? new Date(message.timestamp).getTime() -
                      new Date(prevMessage.timestamp).getTime()
                    : Infinity;
                  const isSameSender = prevMessage?.isFromMe === message.isFromMe;
                  const isWithin5Min = timeDiff < 5 * 60 * 1000;
                  const isFirstInGroup = !isSameSender || !isWithin5Min;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
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
                              : "bg-white rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-sm"
                        )}
                      >
                        <div className="px-3 py-2">
                          {/* Text content */}
                          {message.type === "text" && (
                            <p className={cn(
                              "text-sm whitespace-pre-wrap break-words",
                              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                            )}>
                              {message.content}
                            </p>
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
                          {getStatusIcon(message)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Footer - Read Only Notice */}
            <div className={cn(
              "h-12 px-4 flex items-center justify-center border-t shrink-0",
              isDarkMode 
                ? "bg-[#1f2c33] border-[#2a2a2a]" 
                : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn(
                "text-sm flex items-center gap-2",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                <Eye className="w-4 h-4" />
                Modo somente visualização - Clique em "Abrir Conversa" para responder
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
