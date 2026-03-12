"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Hash,
  Lock,
  Users,
  MoreVertical,
  Pin,
  Bell,
  BellOff,
  Search,
  Phone,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useChannelMessages,
  useDirectMessages,
  useSendMessage,
  useMarkAsRead,
  usePinnedMessages,
  useChatRealtime,
} from "@/hooks/use-internal-chat";
import type { ChatChannel, ChatUser } from "@/types/internal-chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { PinnedMessages } from "./PinnedMessages";
import { TypingIndicator } from "./TypingIndicator";

interface ChatRoomProps {
  channel?: ChatChannel | null;
  directUser?: ChatUser | null;
  onBack: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatRoom({
  channel,
  directUser,
  onBack,
  sidebarOpen,
  onToggleSidebar,
}: ChatRoomProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [showPinned, setShowPinned] = useState(false);

  const isChannel = !!channel;
  const title = channel?.name || directUser?.name || "";
  const subtitle = channel
    ? `${channel.memberCount} membros`
    : directUser?.status === "online"
    ? "Online"
    : directUser?.lastSeenAt
    ? `Visto ${format(new Date(directUser.lastSeenAt), "HH:mm", { locale: ptBR })}`
    : "Offline";

  // Queries
  const { data: channelMessages, isLoading: isLoadingChannel } = useChannelMessages({
    channelId: channel?.id || null,
  });
  const { data: directMessages, isLoading: isLoadingDirect } = useDirectMessages(
    directUser?.id || null
  );
  const { data: pinnedMessages } = usePinnedMessages(channel?.id || null);

  // Mutations
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Realtime
  useChatRealtime(channel?.id || null);

  const messages = isChannel ? channelMessages : directMessages;
  const isLoading = isChannel ? isLoadingChannel : isLoadingDirect;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening
  useEffect(() => {
    if (channel?.id) {
      markAsRead.mutate(channel.id);
    }
  }, [channel?.id]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    await sendMessage.mutateAsync({
      channelId: channel?.id,
      recipientId: directUser?.id,
      content,
      replyToId: replyTo?.id,
    });

    setReplyTo(null);
  };

  const handleReply = (messageId: string, content: string, senderName: string) => {
    setReplyTo({ id: messageId, content, senderName });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Avatar/Icon */}
          {channel ? (
            <div className="relative">
              {channel.isGeneral ? (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              ) : channel.type === "private" ? (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={directUser?.avatar} />
                <AvatarFallback>
                  {directUser?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
                  getStatusColor(directUser?.status)
                )}
              />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {channel?.isGeneral ? "#geral" : `#${title}`}
            </h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {channel && pinnedMessages && pinnedMessages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(showPinned && "bg-accent")}
              onClick={() => setShowPinned(!showPinned)}
            >
              <Pin className="h-4 w-4" />
              {pinnedMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {pinnedMessages.length}
                </span>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {channel && (
                <>
                  <DropdownMenuItem>
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="text-destructive">
                Sair da conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages */}
      <AnimatePresence>
        {showPinned && pinnedMessages && pinnedMessages.length > 0 && (
          <PinnedMessages
            messages={pinnedMessages}
            onClose={() => setShowPinned(false)}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground">
              Carregando mensagens...
            </div>
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const showAvatar =
                index === 0 ||
                messages[index - 1].senderId !== message.senderId ||
                new Date(message.createdAt).getTime() -
                  new Date(messages[index - 1].createdAt).getTime() >
                  5 * 60 * 1000; // 5 minutos

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Hash className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {channel
                ? `Este é o início do canal #${channel.name}`
                : `Inicie uma conversa com ${directUser?.name}`}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={sendMessage.isPending}
      />
    </div>
  );
}
