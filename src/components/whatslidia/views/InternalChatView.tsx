"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, Lock, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatChannels, useCompanyUsers, useChannelMessages, useSendMessage } from "@/hooks/use-internal-chat";
import type { ChatChannel, ChatUser } from "@/types/internal-chat";

interface InternalChatViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export function InternalChatView({ isDarkMode, onBack }: InternalChatViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: channels, isLoading: isLoadingChannels } = useChatChannels();
  const { data: users, isLoading: isLoadingUsers } = useCompanyUsers();
  const { data: messages, isLoading: isLoadingMessages } = useChannelMessages({
    channelId: selectedChannel?.id || null,
  });
  const sendMessage = useSendMessage();

  const isChannel = !!selectedChannel;
  const title = selectedChannel?.name || selectedUser?.name || "Comentários Internos";

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage.mutateAsync({
      channelId: selectedChannel?.id,
      recipientId: selectedUser?.id,
      content: messageInput,
    });
    
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full",
      isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-4 px-6 py-4 border-b",
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
          <div className="flex items-center gap-3 flex-1">
            {selectedChannel?.isGeneral ? (
              <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#00a884]" />
              </div>
            ) : selectedChannel ? (
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#8696a0]" />
              </div>
            ) : (
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser?.avatar} />
                <AvatarFallback className="bg-[#00a884] text-white">
                  {selectedUser?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h2 className={cn(
                "font-semibold",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                {selectedChannel?.isGeneral ? "Geral" : title}
              </h2>
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                {selectedChannel 
                  ? `${selectedChannel.memberCount} membros` 
                  : selectedUser?.status === "online" ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className={cn(
              "font-semibold text-lg",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              Comentários Internos
            </h2>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
            )}>
              Comunicação da equipe
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "w-72 border-r flex flex-col",
          isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
        )}>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {/* Channels Section */}
              <div className="mb-4">
                <h3 className={cn(
                  "px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Canais
                </h3>
                {isLoadingChannels ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
                ) : (
                  channels?.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel);
                        setSelectedUser(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                        selectedChannel?.id === channel.id
                          ? isDarkMode 
                            ? "bg-[#00a884]/20 text-[#00a884]" 
                            : "bg-blue-50 text-blue-600"
                          : isDarkMode
                            ? "text-[#e9edef] hover:bg-[#2a2a2a]"
                            : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {channel.isGeneral ? (
                        <Users className="w-4 h-4" />
                      ) : channel.type === "private" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                      <span className="flex-1 truncate">
                        {channel.isGeneral ? "geral" : channel.name}
                      </span>
                      {channel.unreadCount ? (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-xs",
                          isDarkMode ? "bg-[#00a884] text-white" : "bg-blue-500 text-white"
                        )}>
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>

              {/* Users Section */}
              <div>
                <h3 className={cn(
                  "px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Equipe
                </h3>
                {isLoadingUsers ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
                ) : (
                  users?.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedChannel(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                        selectedUser?.id === user.id
                          ? isDarkMode 
                            ? "bg-[#00a884]/20 text-[#00a884]" 
                            : "bg-blue-50 text-blue-600"
                          : isDarkMode
                            ? "text-[#e9edef] hover:bg-[#2a2a2a]"
                            : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-[#00a884]/30 to-[#00a884]/10 text-sm">
                            {user.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2",
                          user.status === "online" 
                            ? "bg-green-500" 
                            : "bg-gray-400",
                          isDarkMode ? "border-[#1a1a1a]" : "border-white"
                        )} />
                      </div>
                      <span className="flex-1 truncate">{user.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel || selectedUser ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}>
                      Carregando mensagens...
                    </p>
                  </div>
                ) : messages?.length ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender?.id === "current-user" ? "flex-row-reverse" : ""
                        )}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={message.sender?.avatar} />
                          <AvatarFallback className="bg-[#00a884] text-white text-xs">
                            {message.sender?.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[70%] px-4 py-2 rounded-2xl",
                          message.sender?.id === "current-user"
                            ? "bg-[#00a884] text-white rounded-br-sm"
                            : isDarkMode 
                              ? "bg-[#2a2a2a] text-[#e9edef] rounded-bl-sm"
                              : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <span className={cn(
                            "text-[10px] mt-1 block",
                            message.sender?.id === "current-user"
                              ? "text-white/70"
                              : isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}>
                            {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className={cn(
                      "w-12 h-12 mb-4",
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
              </ScrollArea>

              {/* Input */}
              <div className={cn(
                "p-4 border-t",
                isDarkMode ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-gray-200 bg-white"
              )}>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
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
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sendMessage.isPending}
                    className="bg-[#00a884] hover:bg-[#00a884]/90 text-white px-6"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                isDarkMode ? "bg-[#2a2a2a]" : "bg-gray-100"
              )}>
                <MessageCircle className={cn(
                  "w-10 h-10",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                )} />
              </div>
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                Comentários Internos
              </h3>
              <p className={cn(
                "text-sm max-w-sm text-center",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                Selecione um canal ou um membro da equipe para iniciar uma conversa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
