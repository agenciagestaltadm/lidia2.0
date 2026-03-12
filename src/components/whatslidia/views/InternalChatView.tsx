"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Hash, 
  Lock, 
  Users, 
  MessageCircle, 
  Search,
  Pin,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  X,
  Check,
  CheckCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InternalMessageBubble } from "../components/InternalMessageBubble";
import { 
  useChatChannels, 
  useCompanyUsers, 
  useChannelMessages, 
  useSendMessage,
  usePinnedMessages,
  useTypingUsers,
  useTypingIndicator,
  useMarkAsRead,
  usePinMessage,
  useUnpinMessage,
  useSearchMessages,
  useChatNotifications,
  useMarkMessageAsRead
} from "@/hooks/use-internal-chat";
import type { ChatChannel, ChatUser, ChatMessage } from "@/types/internal-chat";

interface InternalChatViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export function InternalChatView({ isDarkMode, onBack }: InternalChatViewProps) {
  // Estados
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"channels" | "users">("channels");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { data: channels, isLoading: isLoadingChannels } = useChatChannels();
  const { data: users, isLoading: isLoadingUsers } = useCompanyUsers();
  const { data: messages, isLoading: isLoadingMessages } = useChannelMessages({
    channelId: selectedChannel?.id || null,
  });
  const { data: pinnedMessages } = usePinnedMessages(selectedChannel?.id || null);
  const typingUsers = useTypingUsers(selectedChannel?.id || null);
  const { setTyping } = useTypingIndicator();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const searchMessages = useSearchMessages();
  const { unreadCount, playNotificationSound } = useChatNotifications();
  const markMessageAsRead = useMarkMessageAsRead();

  const isChannel = !!selectedChannel;
  const currentChatId = selectedChannel?.id || selectedUser?.id;
  const title = selectedChannel?.name || selectedUser?.name || "Chat Interno";

  // Scroll para última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Marcar como lido ao abrir canal
  useEffect(() => {
    if (selectedChannel?.id) {
      markAsRead.mutate(selectedChannel.id);
    }
  }, [selectedChannel?.id, markAsRead]);

  // Handler de envio de mensagem
  const handleSend = async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage.mutateAsync({
      channelId: selectedChannel?.id,
      recipientId: selectedUser?.id,
      content: messageInput,
      replyToId: replyingTo?.id,
    });

    setMessageInput("");
    setReplyingTo(null);
    scrollToBottom();
  };

  // Handler de tecla
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handler de digitação
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    // Indicador de digitação
    if (selectedChannel?.id) {
      setTyping(selectedChannel.id, true);
      
      // Limpar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Parar de digitar após 2 segundos
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(selectedChannel.id, false);
      }, 2000);
    }
  };

  // Handler de menção
  const handleMentionClick = (user: ChatUser) => {
    setMessageInput(prev => prev + `@${user.name} `);
    inputRef.current?.focus();
  };

  // Handler de busca
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchMessages.mutateAsync({ query: searchQuery });
  };

  // Handler de pin
  const handlePinMessage = async (messageId: string) => {
    if (!selectedChannel?.id) return;
    await pinMessage.mutateAsync({ messageId, channelId: selectedChannel.id });
  };

  // Renderizar mensagens fixadas
  const renderPinnedMessages = () => {
    if (!pinnedMessages?.length || !selectedChannel?.isGeneral) return null;

    return (
      <div className={cn(
        "px-4 py-2 border-b",
        isDarkMode ? "bg-[#202c33] border-[#2a2a2a]" : "bg-yellow-50 border-gray-200"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Pin className="w-4 h-4 text-yellow-500" />
          <span className={cn(
            "text-xs font-medium",
            isDarkMode ? "text-[#8696a0]" : "text-gray-600"
          )}>
            Mensagens fixadas
          </span>
        </div>
        <ScrollArea className="h-16">
          <div className="space-y-1">
            {pinnedMessages.map((pinned) => (
              <div
                key={pinned.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer",
                  isDarkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-white/50"
                )}
              >
                <span className="truncate flex-1">{pinned.message?.content}</span>
                <span className={cn(
                  "text-xs",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  {pinned.message?.sender?.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Renderizar indicador de digitação
  const renderTypingIndicator = () => {
    if (!typingUsers.length) return null;

    const names = typingUsers.map(u => u.name);
    let text = "";
    if (names.length === 1) {
      text = `${names[0]} está digitando...`;
    } else if (names.length === 2) {
      text = `${names[0]} e ${names[1]} estão digitando...`;
    } else {
      text = `${names.length} pessoas estão digitando...`;
    }

    return (
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm",
        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
      )}>
        <div className="flex gap-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
        </div>
        <span>{text}</span>
      </div>
    );
  };

  // Contagem de membros online
  const onlineCount = users?.filter(u => u.status === "online").length || 0;

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full overflow-hidden",
      isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-4 px-4 py-3 border-b shrink-0",
        isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={cn(
            "shrink-0",
            isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-600"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {selectedChannel || selectedUser ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedChannel?.isGeneral ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f6f] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
            ) : selectedChannel ? (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isDarkMode ? "bg-[#2a2a2a]" : "bg-gray-100"
              )}>
                <Hash className="w-5 h-5 text-[#00a884]" />
              </div>
            ) : (
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedUser?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#008f6f] text-white">
                    {selectedUser?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2",
                  selectedUser?.status === "online" ? "bg-green-500" : "bg-gray-400",
                  isDarkMode ? "border-[#1a1a1a]" : "border-white"
                )} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className={cn(
                "font-semibold truncate",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                {selectedChannel?.isGeneral ? "Geral da Empresa" : title}
              </h2>
              <p className={cn(
                "text-xs truncate",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                {selectedChannel 
                  ? `${selectedChannel.memberCount} membros • ${onlineCount} online`
                  : selectedUser?.status === "online" 
                    ? "Online" 
                    : selectedUser?.lastSeenAt 
                      ? `Visto por último ${new Date(selectedUser.lastSeenAt).toLocaleDateString("pt-BR")}`
                      : "Offline"
                }
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className={cn(
              "font-semibold text-lg",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              Chat Interno
            </h2>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              Comunicação da equipe
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {(selectedChannel || selectedUser) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  showSearch && (isDarkMode ? "bg-[#2a2a2a]" : "bg-gray-100"),
                  isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-600"
                )}
              >
                <Search className="w-5 h-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-600"}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSearch(true)}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar mensagens
                  </DropdownMenuItem>
                  {selectedChannel?.isGeneral && pinnedMessages && pinnedMessages.length > 0 && (
                    <DropdownMenuItem>
                      <Pin className="w-4 h-4 mr-2" />
                      Ver mensagens fixadas ({pinnedMessages.length})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "border-b overflow-hidden",
              isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
            )}
          >
            <div className="p-3 flex gap-2">
              <Input
                placeholder="Buscar mensagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={cn(
                  "flex-1",
                  isDarkMode ? "bg-[#2a2a2a] border-[#3a3a3a] text-[#e9edef]" : ""
                )}
              />
              <Button
                onClick={handleSearch}
                disabled={searchMessages.isPending}
                className="bg-[#00a884] hover:bg-[#00a884]/90"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Results */}
            {searchMessages.data && (
              <div className={cn(
                "max-h-48 overflow-y-auto border-t",
                isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
              )}>
                {searchMessages.data.messages.length === 0 ? (
                  <p className={cn(
                    "p-3 text-sm text-center",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Nenhuma mensagem encontrada
                  </p>
                ) : (
                  searchMessages.data.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 border-b cursor-pointer hover:bg-opacity-50",
                        isDarkMode ? "border-[#2a2a2a] hover:bg-[#2a2a2a]" : "border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-medium",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}>
                        {msg.sender?.name}
                      </p>
                      <p className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-600"
                      )}>
                        {msg.content}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                      )}>
                        {new Date(msg.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "w-72 border-r flex flex-col shrink-0",
          isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
        )}>
          {/* Tabs */}
          <div className={cn(
            "flex border-b",
            isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
          )}>
            <button
              onClick={() => setActiveTab("channels")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === "channels"
                  ? isDarkMode 
                    ? "text-[#00a884] border-b-2 border-[#00a884]" 
                    : "text-blue-600 border-b-2 border-blue-600"
                  : isDarkMode
                    ? "text-[#8696a0] hover:text-[#e9edef]"
                    : "text-gray-600 hover:text-gray-900"
              )}
            >
              Canais
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === "users"
                  ? isDarkMode 
                    ? "text-[#00a884] border-b-2 border-[#00a884]" 
                    : "text-blue-600 border-b-2 border-blue-600"
                  : isDarkMode
                    ? "text-[#8696a0] hover:text-[#e9edef]"
                    : "text-gray-600 hover:text-gray-900"
              )}
            >
              Equipe
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {activeTab === "channels" ? (
                /* Channels List */
                isLoadingChannels ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {channels?.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannel(channel);
                          setSelectedUser(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                          selectedChannel?.id === channel.id
                            ? isDarkMode 
                              ? "bg-[#2a2a2a]" 
                              : "bg-gray-100"
                            : isDarkMode
                              ? "hover:bg-[#2a2a2a]/50"
                              : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                          channel.isGeneral
                            ? "bg-gradient-to-br from-[#00a884] to-[#008f6f]"
                            : channel.type === "private"
                              ? "bg-amber-500"
                              : isDarkMode
                                ? "bg-[#2a2a2a]"
                                : "bg-gray-200"
                        )}>
                          {channel.isGeneral ? (
                            <Users className="w-5 h-5 text-white" />
                          ) : channel.type === "private" ? (
                            <Lock className="w-5 h-5 text-white" />
                          ) : (
                            <Hash className="w-5 h-5 text-[#00a884]" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium truncate",
                              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                            )}>
                              {channel.isGeneral ? "Geral" : channel.name}
                            </span>
                            {channel.unreadCount ? (
                              <span className="bg-[#00a884] text-white text-xs px-1.5 py-0.5 rounded-full shrink-0">
                                {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <p className={cn(
                            "text-xs truncate",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}>
                            {channel.memberCount} membros
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* Users List */
                isLoadingUsers ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {users?.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedChannel(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                          selectedUser?.id === user.id
                            ? isDarkMode 
                              ? "bg-[#2a2a2a]" 
                              : "bg-gray-100"
                            : isDarkMode
                              ? "hover:bg-[#2a2a2a]/50"
                              : "hover:bg-gray-50"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-[#00a884]/30 to-[#00a884]/10 text-sm">
                              {user.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2",
                            user.status === "online" 
                              ? "bg-green-500" 
                              : user.status === "away"
                                ? "bg-yellow-500"
                                : "bg-gray-400",
                            isDarkMode ? "border-[#1a1a1a]" : "border-white"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "font-medium block truncate",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}>
                            {user.name}
                          </span>
                          <p className={cn(
                            "text-xs truncate",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}>
                            {user.status === "online" 
                              ? "Online" 
                              : user.status === "away"
                                ? "Ausente"
                                : user.lastSeenAt
                                  ? `Visto ${new Date(user.lastSeenAt).toLocaleDateString("pt-BR")}`
                                  : "Offline"
                            }
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChannel || selectedUser ? (
            <>
              {/* Pinned Messages */}
              {renderPinnedMessages()}

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full" />
                    </div>
                  ) : messages?.length ? (
                    messages.map((message, index) => {
                      const isCurrentUser = message.senderId === "current-user"; // Substituir por usuário real
                      const showAvatar = index === 0 || 
                        messages[index - 1]?.senderId !== message.senderId;

                      return (
                        <InternalMessageBubble
                          key={message.id}
                          message={message}
                          isCurrentUser={isCurrentUser}
                          isDarkMode={isDarkMode}
                          showAvatar={showAvatar}
                          onReply={setReplyingTo}
                          onPin={handlePinMessage}
                          isPinned={pinnedMessages?.some(p => p.messageId === message.id)}
                          companyUsers={users || []}
                        />
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <MessageCircle className={cn(
                        "w-16 h-16 mb-4",
                        isDarkMode ? "text-[#2a2a2a]" : "text-gray-200"
                      )} />
                      <p className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}>
                        {selectedChannel
                          ? `Início do canal #${selectedChannel.name}`
                          : `Inicie uma conversa com ${selectedUser?.name}`}
                      </p>
                    </div>
                  )}
                  
                  {/* Typing Indicator */}
                  {renderTypingIndicator()}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply Preview */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={cn(
                      "px-4 py-2 border-t",
                      isDarkMode ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex-1 px-3 py-2 rounded border-l-2 text-sm",
                        isDarkMode 
                          ? "bg-[#2a2a2a] border-[#00a884]" 
                          : "bg-white border-blue-400"
                      )}>
                        <p className={cn(
                          "text-xs font-medium",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-600"
                        )}>
                          Respondendo a {replyingTo.sender?.name}
                        </p>
                        <p className="truncate">{replyingTo.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReplyingTo(null)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className={cn(
                "p-4 border-t",
                isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
              )}>
                <div className="flex items-end gap-2">
                  {/* Emoji Button */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "shrink-0",
                          isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-600"
                        )}
                      >
                        <Smile className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className={cn(
                      "p-2 w-auto",
                      isDarkMode ? "bg-[#202c33] border-[#2a2a2a]" : "bg-white"
                    )}>
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setMessageInput(prev => prev + emoji);
                              setShowEmojiPicker(false);
                              inputRef.current?.focus();
                            }}
                            className="hover:scale-125 transition-transform text-xl p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Attachment Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "shrink-0",
                      isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-600"
                    )}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>

                  {/* Input */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite uma mensagem..."
                      rows={1}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg resize-none outline-none transition-all",
                        isDarkMode 
                          ? "bg-[#2a2a2a] text-[#e9edef] placeholder-[#8696a0] focus:bg-[#3a3a3a]" 
                          : "bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-200"
                      )}
                      style={{ minHeight: "44px", maxHeight: "120px" }}
                    />
                    
                    {/* Mention suggestions */}
                    {messageInput.includes("@") && (
                      <div className={cn(
                        "absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto rounded-lg shadow-lg z-50",
                        isDarkMode ? "bg-[#202c33] border border-[#2a2a2a]" : "bg-white border"
                      )}>
                        {users?.filter(u => 
                          u.name.toLowerCase().includes(messageInput.split("@").pop()?.toLowerCase() || "")
                        ).slice(0, 5).map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleMentionClick(user)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-opacity-50",
                              isDarkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-100"
                            )}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "text-sm",
                              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                            )}>
                              {user.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sendMessage.isPending}
                    className="bg-[#00a884] hover:bg-[#00a884]/90 text-white px-4 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-6",
                isDarkMode ? "bg-gradient-to-br from-[#00a884]/20 to-[#008f6f]/20" : "bg-gradient-to-br from-gray-100 to-gray-200"
              )}>
                <MessageCircle className={cn(
                  "w-12 h-12",
                  isDarkMode ? "text-[#00a884]" : "text-gray-400"
                )} />
              </div>
              <h3 className={cn(
                "text-2xl font-semibold mb-2",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                Chat Interno
              </h3>
              <p className={cn(
                "text-sm max-w-sm text-center mb-6",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                Selecione um canal da empresa ou um membro da equipe para iniciar uma conversa privada
              </p>
              
              {/* Quick Stats */}
              <div className={cn(
                "flex gap-6 px-6 py-4 rounded-xl",
                isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"
              )}>
                <div className="text-center">
                  <p className={cn(
                    "text-2xl font-bold text-[#00a884]",
                  )}>
                    {channels?.length || 0}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Canais
                  </p>
                </div>
                <div className="w-px bg-gray-700" />
                <div className="text-center">
                  <p className={cn(
                    "text-2xl font-bold text-[#00a884]",
                  )}>
                    {users?.length || 0}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Membros
                  </p>
                </div>
                <div className="w-px bg-gray-700" />
                <div className="text-center">
                  <p className={cn(
                    "text-2xl font-bold text-green-500",
                  )}>
                    {onlineCount}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Online
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
