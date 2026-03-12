"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Hash, Lock, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useChatChannels,
  useCompanyUsers,
  useDirectConversations,
} from "@/hooks/use-internal-chat";
import type { ChatChannel, ChatUser } from "@/types/internal-chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedChannelId?: string;
  selectedUserId?: string;
  onSelectChannel: (channel: ChatChannel) => void;
  onSelectUser: (user: ChatUser) => void;
}

export function ChatSidebar({
  selectedChannelId,
  selectedUserId,
  onSelectChannel,
  onSelectUser,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"channels" | "direct">("channels");

  const { data: channels, isLoading: isLoadingChannels } = useChatChannels();
  const { data: users, isLoading: isLoadingUsers } = useCompanyUsers();
  const { data: directConversations, isLoading: isLoadingDirect } = useDirectConversations();

  const filteredChannels = channels?.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generalChannel = filteredChannels?.find((c) => c.isGeneral);
  const otherChannels = filteredChannels?.filter((c) => !c.isGeneral);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Comunicação</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canais ou pessoas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("channels")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors",
            activeTab === "channels"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Hash className="h-4 w-4" />
            Canais
          </div>
        </button>
        <button
          onClick={() => setActiveTab("direct")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors",
            activeTab === "direct"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Diretas
          </div>
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "channels" ? (
          <div className="p-2">
            {/* Canal Geral */}
            {generalChannel && (
              <div className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Geral
                </div>
                <ChannelItem
                  channel={generalChannel}
                  isSelected={selectedChannelId === generalChannel.id}
                  onClick={() => onSelectChannel(generalChannel)}
                />
              </div>
            )}

            {/* Outros Canais */}
            {otherChannels && otherChannels.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Canais
                </div>
                {otherChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannelId === channel.id}
                    onClick={() => onSelectChannel(channel)}
                  />
                ))}
              </div>
            )}

            {isLoadingChannels && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando canais...
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Usuários Online */}
            {filteredUsers && filteredUsers.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Equipe
                </div>
                {filteredUsers.map((user) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    isSelected={selectedUserId === user.id}
                    unreadCount={directConversations?.find((c) => c.userId === user.id)?.unreadCount || 0}
                    onClick={() => onSelectUser(user)}
                  />
                ))}
              </div>
            )}

            {isLoadingUsers && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando usuários...
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================
// COMPONENTE: ITEM DE CANAL
// ============================================================

interface ChannelItemProps {
  channel: ChatChannel;
  isSelected: boolean;
  onClick: () => void;
}

function ChannelItem({ channel, isSelected, onClick }: ChannelItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent text-foreground"
      )}
    >
      <div className="flex-shrink-0">
        {channel.isGeneral ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
        ) : channel.type === "private" ? (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Hash className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {channel.isGeneral ? "geral" : channel.name}
          </span>
          {channel.unreadCount ? (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
              {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {channel.memberCount} membros
        </p>
      </div>
    </motion.button>
  );
}

// ============================================================
// COMPONENTE: ITEM DE USUÁRIO
// ============================================================

interface UserItemProps {
  user: ChatUser;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}

function UserItem({ user, isSelected, unreadCount, onClick }: UserItemProps) {
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent text-foreground"
      )}
    >
      <div className="relative flex-shrink-0">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
            getStatusColor(user.status)
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{user.name}</span>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {user.customStatus || (user.status === "online" ? "Online" : "Offline")}
        </p>
      </div>
    </motion.button>
  );
}
