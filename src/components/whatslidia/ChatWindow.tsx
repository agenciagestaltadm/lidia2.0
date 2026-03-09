"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, Message } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { getConversationMessages } from "@/lib/mock/chat-data";
import { Lock, Shield } from "lucide-react";

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatWindow({
  conversation,
  onBack,
  showBackButton = false,
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
      <div className="flex-1 h-full flex flex-col bg-[#0b141a]">
        <ChatHeader conversation={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <div className="w-64 h-64 mx-auto mb-8 relative">
              {/* WhatsApp-style illustration */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00a884]/20 to-transparent rounded-full blur-3xl" />
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-48 h-48 text-[#364147]"
                  fill="currentColor"
                >
                  <path d="M100 0C44.8 0 0 44.8 0 100c0 17.6 4.6 34.1 12.7 48.4L2.3 186.7l38.3-10.4C54.9 184.4 76.4 192 100 192c55.2 0 100-44.8 100-100S155.2 0 100 0zm0 180c-21.1 0-40.3-7.5-55.3-20L30 160l10.3-37.5C27.7 108.3 20 91.2 20 72c0-44.1 35.9-80 80-80s80 35.9 80 80-35.9 80-80 80z" />
                  <path d="M75 95c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm25 0c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm25 0c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-[#e9edef] text-2xl font-light mb-2">
              WhatsLídia Web
            </h2>
            <p className="text-[#8696a0] text-sm mb-8 max-w-md">
              Envie e receba mensagens do WhatsApp Business sem precisar manter
              seu celular online.
            </p>
            <div className="flex items-center gap-2 text-[#667781] text-sm">
              <Lock className="w-4 h-4" />
              <span>Criptografado de ponta a ponta</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0b141a]">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent"
        style={{
          backgroundImage:
            "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAE5JREFUOE9j/P///38GMgAx2v///2cYmUyMioHRwCgYSMP/////Z0AXZ6SJgWg2/P///3+CpJmINAzNsJGjYOAomDg6hgfEwKgYTQwAqRcjE7aL4TQAAAAASUVORK5CYII=')",
          backgroundRepeat: "repeat",
        }}
      >
        {/* Encryption notice */}
        <div className="flex justify-center py-4">
          <div className="bg-[#1f2c33]/90 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <Lock className="w-3 h-3 text-[#8696a0]" />
            <span className="text-[#8696a0] text-xs">
              Mensagens criptografadas de ponta a ponta
            </span>
          </div>
        </div>

        {/* Date separator */}
        <div className="flex justify-center py-4">
          <div className="bg-[#1f2c33]/90 px-3 py-1 rounded-lg">
            <span className="text-[#8696a0] text-xs">
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
                  />
                ))}
              </div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      <div className="bg-[#1f2c33] border-t border-[#2a2a2a] px-4 py-2">
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
              className="shrink-0 px-3 py-1.5 bg-[#2a3942] text-[#e9edef] text-sm rounded-full hover:bg-[#374045] transition-colors whitespace-nowrap"
            >
              {quickReply.split(" - ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
