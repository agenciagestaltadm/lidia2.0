"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, Message, MessageType, MessageStatus } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { AttachmentFile } from "./AttachmentMenu";
import { getConversationMessages } from "@/lib/mock/chat-data";
import { type WABAMessage } from "@/hooks/use-waba-messages";
import { Lock, Shield, Eye, RotateCcw, AlertCircle, Loader2, CheckCircle } from "lucide-react";

// Convert WABAMessage to UI Message format
function convertWABAMessageToMessage(wabaMsg: WABAMessage): Message {
  // Map WABA message type to UI MessageType
  const mapMessageType = (type: string): MessageType => {
    const typeMap: Record<string, MessageType> = {
      text: "text",
      image: "image",
      video: "video",
      audio: "audio",
      document: "document",
      location: "text", // render as text with location info
      template: "template",
      sticker: "text",
      voice: "audio",
    };
    return typeMap[type] || "text";
  };

  // Map WABA message status to UI MessageStatus
  const mapMessageStatus = (status: string): MessageStatus => {
    const statusMap: Record<string, MessageStatus> = {
      pending: "sent",
      sent: "sent",
      delivered: "delivered",
      read: "read",
      failed: "failed",
    };
    return statusMap[status] || "sent";
  };

  return {
    id: wabaMsg.id,
    conversationId: wabaMsg.conversation_id,
    content: wabaMsg.content,
    type: mapMessageType(wabaMsg.message_type),
    status: mapMessageStatus(wabaMsg.status),
    isFromMe: wabaMsg.direction === "outbound",
    timestamp: new Date(wabaMsg.created_at),
    metadata: {
      url: wabaMsg.media_url || undefined,
      caption: wabaMsg.media_caption || undefined,
      fileName: wabaMsg.media_caption || undefined,
    },
  };
}

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
  isDarkMode?: boolean;
  isReadOnly?: boolean;
  onReopen?: () => void;
  onResolve?: () => void;
  onOpenConversation?: () => void;
  onReturnToPending?: () => void;
  onSendMessage?: (content: string) => void;
  onSendAttachments?: (files: AttachmentFile[], caption?: string) => void;
  onSendLocation?: (type: "location" | "address" | "request") => void;
  onSendContact?: () => void;
  onSendTemplate?: (type: string) => void;
  onSendFlow?: () => void;
  // Props for real data integration
  externalMessages?: Message[];
  loading?: boolean;
  // Pagination props
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  // WABA props
  messages?: import("@/hooks/use-waba-messages").WABAMessage[];
  isLoadingMessages?: boolean;
  isSending?: boolean;
  connectionType?: "qr" | "oficial";
}

export function ChatWindow({
  conversation,
  onBack,
  showBackButton = false,
  isDarkMode = true,
  isReadOnly = false,
  onReopen,
  onResolve,
  onOpenConversation,
  onReturnToPending,
  onSendMessage,
  onSendAttachments,
  onSendLocation,
  onSendContact,
  onSendTemplate,
  onSendFlow,
  externalMessages,
  loading: externalLoading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  messages: wabaMessages,
  isLoadingMessages,
  isSending,
  connectionType,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Determine if we are using WABA messages
  const isUsingWABA = wabaMessages !== undefined;

  // Convert WABA messages to UI format when provided
  const convertedWABAMessages = useMemo(() => {
    if (!wabaMessages) return [];
    return wabaMessages.map(convertWABAMessageToMessage);
  }, [wabaMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (externalMessages !== undefined) {
      setLocalMessages(externalMessages);
    } else if (conversation && !isUsingWABA) {
      const msgs = getConversationMessages(conversation.id);
      setLocalMessages(msgs);
    } else {
      setLocalMessages([]);
    }
  }, [conversation?.id, externalMessages, isUsingWABA]);

  // Final messages: prefer WABA converted, then local
  const messages = isUsingWABA ? convertedWABAMessages : localMessages;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loadingMore) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, loadingMore]);

  // Handler para scroll e carregar mais mensagens
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loadingMore) return;

    const { scrollTop } = container;
    
    // Se scrollou perto do topo, carrega mais mensagens
    if (scrollTop < 100) {
      onLoadMore?.();
    }

    // Mostra/esconde botão de scroll para baixo
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, [hasMore, loadingMore, onLoadMore]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (content: string) => {
    if (!conversation) return;

    // Call external handler if provided
    onSendMessage?.(content);

    // Only add local message if not using WABA (which uses Realtime)
    if (!isUsingWABA) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conversation.id,
        content,
        type: "text",
        status: "sent",
        isFromMe: true,
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, newMessage]);
    }
  };

  // Handle sending messages with type and metadata (for modals)
  const handleSendMessageWithType = (content: string, type?: string, metadata?: any) => {
    if (!conversation) return;

    // Call external handler if provided
    onSendMessage?.(content);

    // Only add local message if not using WABA (which uses Realtime)
    if (!isUsingWABA) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conversation.id,
        content,
        type: (type as MessageType) || "text",
        status: "sent",
        isFromMe: true,
        timestamp: new Date(),
        metadata,
      };
      setLocalMessages((prev) => [...prev, newMessage]);
    }
  };

  // Handle sending attachments with caption
  const handleSendAttachments = (files: AttachmentFile[], caption?: string) => {
    if (!conversation) return;

    // Call external handler if provided
    onSendAttachments?.(files, caption);

    // Only add local messages if not using WABA (which uses Realtime)
    if (!isUsingWABA) {
      files.forEach((file, index) => {
        const newMessage: Message = {
          id: `msg-${Date.now()}-${index}`,
          conversationId: conversation.id,
          content: index === 0 && caption ? caption : file.file.name,
          type: file.type,
          status: "sent",
          isFromMe: true,
          timestamp: new Date(Date.now() + index * 100),
          metadata: {
            fileName: file.file.name,
            fileSize: file.size,
            mimeType: file.file.type,
            caption: index === 0 ? caption : undefined,
          },
        };
        setLocalMessages((prev) => [...prev, newMessage]);
      });
    }
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
        onResolve={conversation?.status === 'open' ? onResolve : undefined}
        onReturnToPending={conversation?.status === 'open' ? onReturnToPending : undefined}
        onOpenConversation={conversation?.status === 'pending' ? onOpenConversation : undefined}
      />

      {/* Read-only Banner - only covers top, messages still visible */}
      {isReadOnly && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative z-20 flex items-center justify-between gap-3 px-4 py-3 border-b",
            conversation?.status === 'pending'
              ? isDarkMode
                ? "bg-amber-900/30 border-amber-700/50"
                : "bg-amber-50 border-amber-200"
              : isDarkMode
                ? "bg-[#1a2e35] border-[#2a3a42]"
                : "bg-gray-50 border-gray-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              conversation?.status === 'pending'
                ? isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
                : isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
            )}>
              {conversation?.status === 'pending' ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-[#00a884]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                {conversation?.status === 'pending' ? 'Conversa Pendente' : 'Conversa Resolvida'}
              </span>
              <span className={cn(
                "text-xs",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                {conversation?.status === 'pending'
                  ? 'Clique em "Atender" para habilitar o envio de mensagens'
                  : 'Clique em "Reabrir" para retomar o atendimento'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conversation?.status === 'pending' && onOpenConversation && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenConversation}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#00a884] text-white rounded-lg text-sm font-medium hover:bg-[#00a884]/90 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Atender
              </motion.button>
            )}
            {conversation?.status === 'resolved' && onReopen && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReopen}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#00a884] text-white rounded-lg text-sm font-medium hover:bg-[#00a884]/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reabrir
              </motion.button>
            )}
            {conversation?.status === 'pending' && !onOpenConversation && (
              <div className={cn(
                "flex items-center gap-1.5 text-sm",
                isDarkMode ? "text-[#8696a0]" : "text-gray-400"
              )}>
                <Eye className="w-4 h-4" />
                Somente visualização
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent relative",
          isDarkMode ? "scrollbar-thumb-[#374045]" : "scrollbar-thumb-gray-300"
        )}
        style={{
          backgroundImage: isDarkMode
            ? "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAE5JREFUOE9j/P///38GMgAx2v///2cYmUyMioHRwCgYSMP/////Z0AXZ6SJgWg2/P///3+CpJmINAzNsJGjYOAomDg6hgfEwKgYTQwAqRcjE7aL4TQAAAAASUVORK5CYII=')"
            : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAABJREFUOE9j/P///38GBgATiA0BAwMAgCYAl2kHbEUAAAAASUVORK5CYII=')",
          backgroundRepeat: "repeat",
        }}
      >
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className={cn(
              "w-6 h-6 animate-spin",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )} />
          </div>
        )}
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

        {/* Loading indicator for WABA messages */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className={cn(
              "flex flex-col items-center gap-3",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Carregando mensagens...</span>
            </div>
          </div>
        )}

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

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className={cn(
              "absolute bottom-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center",
              isDarkMode ? "bg-[#00a884] text-white" : "bg-emerald-500 text-white"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Input Area - Only show when not read-only */}
      {!isReadOnly && (
        <MessageInput
          onSend={handleSendMessage}
          onSendAttachments={handleSendAttachments}
          onSendMessage={handleSendMessageWithType}
          isDarkMode={isDarkMode}
          conversationStatus={conversation?.status || 'open'}
        />
      )}
    </div>
  );
}
