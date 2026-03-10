"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, Message } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { getConversationMessages } from "@/lib/mock/chat-data";
import { Lock, Shield, Eye, RotateCcw, AlertCircle } from "lucide-react";

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
  isDarkMode?: boolean;
  isReadOnly?: boolean;
  onReopen?: () => void;
}

export function ChatWindow({
  conversation,
  onBack,
  showBackButton = false,
  isDarkMode = true,
  isReadOnly = false,
  onReopen,
}: ChatWindowProps) {
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

  const handleSendMessage = (content: string) => {
    if (!conversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversation.id,
      content,
      type: "text",
      status: "sent",
      isFromMe: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate message status updates
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessage.id ? { ...m, status: "delivered" } : m
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, status: "read" } : m))
      );
    }, 2500);
  };

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    const timeDiff = prevMessage
      ? new Date(message.timestamp).getTime() -
        new Date(prevMessage.timestamp).getTime()
      : Infinity;
    const isSameSender = prevMessage?.isFromMe === message.isFromMe;
    const isWithin5Min = timeDiff < 5 * 60 * 1000;

    if (!isSameSender || !isWithin5Min) {
      groups.push([]);
    }
    groups[groups.length - 1].push({ message, index });
    return groups;
  }, [] as { message: Message; index: number }[][]);

  if (!conversation) {
    return (
      <div className={cn(
        "flex-1 h-full flex flex-col transition-colors duration-300",
        isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
      )}>
        <ChatHeader conversation={null} isDarkMode={isDarkMode} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <div className="w-64 h-64 mx-auto mb-8 relative">
              {/* WhatsApp-style illustration */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00a884]/20 to-transparent rounded-full blur-3xl" />
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className={cn(
                    "w-48 h-48",
                    isDarkMode ? "text-[#364147]" : "text-gray-300"
                  )}
                  fill="currentColor"
                >
                  <path d="M100 0C44.8 0 0 44.8 0 100c0 17.6 4.6 34.1 12.7 48.4L2.3 186.7l38.3-10.4C54.9 184.4 76.4 192 100 192c55.2 0 100-44.8 100-100S155.2 0 100 0zm0 180c-21.1 0-40.3-7.5-55.3-20L30 160l10.3-37.5C27.7 108.3 20 91.2 20 72c0-44.1 35.9-80 80-80s80 35.9 80 80-35.9 80-80 80z" />
                  <path d="M75 95c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm25 0c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm25 0c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                </svg>
              </div>
            </div>
            <h2 className={cn(
              "text-2xl font-light mb-2",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              WhatsLídia Web
            </h2>
            <p className={cn(
              "text-sm mb-8 max-w-md",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              Envie e receba mensagens do WhatsApp Business sem precisando manter
              seu celular online.
            </p>
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkMode ? "text-[#667781]" : "text-gray-400"
            )}>
              <Lock className="w-4 h-4" />
              <span>Criptografado de ponta a ponta</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 h-full flex flex-col transition-colors duration-300 relative",
      isDarkMode ? "bg-[#0b141a]" : "bg-gray-100"
    )}>
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        showBackButton={showBackButton}
        isDarkMode={isDarkMode}
      />

      {/* Read-only Overlay */}
      {isReadOnly && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "px-8 py-6 rounded-2xl text-center max-w-md mx-4 shadow-2xl",
              isDarkMode ? "bg-[#1f2c33] border border-[#2a2a2a]" : "bg-white border border-gray-200"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
            )}>
              {conversation?.status === 'pending' ? (
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              ) : (
                <Lock className="w-8 h-8 text-[#00a884]" />
              )}
            </div>
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              Conversa {conversation?.status === 'pending' ? 'Pendente' : 'Resolvida'}
            </h3>
            <p className={cn(
              "text-sm mb-6",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              {conversation?.status === 'pending'
                ? 'Esta conversa está na fila de pendentes. Use o botão "Abrir Conversa" na lista para habilitar a interação.'
                : 'Esta conversa foi resolvida. Clique em "Reabrir Conversa" para retomar o atendimento.'}
            </p>
            {conversation?.status === 'resolved' && onReopen && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReopen}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#00a884] text-white rounded-xl font-medium hover:bg-[#00a884]/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reabrir Conversa
              </motion.button>
            )}
            {conversation?.status === 'pending' && (
              <div className={cn(
                "flex items-center justify-center gap-2 text-sm",
                isDarkMode ? "text-[#8696a0]" : "text-gray-400"
              )}>
                <Eye className="w-4 h-4" />
                Modo somente visualização
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent",
          isReadOnly ? "pointer-events-none" : "",
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
          <AnimatePresence mode="popLayout">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-0.5">
                {group.map(({ message, index }, msgIndex) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isFirstInGroup={msgIndex === 0}
                    isLastInGroup={msgIndex === group.length - 1}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies - Only show when not read-only */}
      {!isReadOnly && (
        <div className={cn(
          "px-4 py-2 border-t transition-colors duration-300",
          isDarkMode
            ? "bg-[#1f2c33] border-[#2a2a2a]"
            : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              "/ola - Olá! Como posso ajudar?",
              "/aguarde - Só um momento...",
              "/agrad - Obrigado pelo contato!",
            ].map((quickReply) => (
              <button
                key={quickReply}
                onClick={() =>
                  handleSendMessage(quickReply.split(" - ")[1] || quickReply)
                }
                className={cn(
                  "shrink-0 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
                  isDarkMode
                    ? "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                )}
              >
                {quickReply.split(" - ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Only show when not read-only */}
      {!isReadOnly && (
        <MessageInput onSend={handleSendMessage} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}
