"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation, ConversationStatus } from "@/types/chat";
import { ConversationItem } from "./ConversationItem";
import { Search, Plus, Filter } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type FilterTab = "open" | "pending" | "resolved";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("open");

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesTab = conv.status === activeTab;
      const matchesSearch =
        searchQuery === "" ||
        conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.contact.phone.includes(searchQuery) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [conversations, activeTab, searchQuery]);

  const getUnreadCount = (status: ConversationStatus) => {
    return conversations
      .filter((c) => c.status === status)
      .reduce((acc, c) => acc + c.unreadCount, 0);
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "open", label: "Abertas" },
    { id: "pending", label: "Pendentes" },
    { id: "resolved", label: "Resolvidas" },
  ];

  return (
    <div className="w-[380px] h-full flex flex-col bg-[#111b21] border-r border-[#2a2a2a] shrink-0">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-[#1f2c33] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <h1 className="text-[#e9edef] font-semibold text-lg tracking-tight">
            WhatsLídia
          </h1>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#00a884]/20 text-[#00a884] rounded-full font-medium">
            BETA
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942] transition-colors"
          title="Nova Conversa"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-[#111b21]">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#8696a0]" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-[#8696a0] hover:text-[#e9edef]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pb-2 bg-[#111b21] border-b border-[#2a2a2a]">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const unreadCount = getUnreadCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  activeTab === tab.id
                    ? "bg-[#2a3942] text-[#00a884]"
                    : "text-[#8696a0] hover:bg-[#1f2c33] hover:text-[#e9edef]"
                )}
              >
                {tab.label}
                {unreadCount > 0 && (
                  <span className="bg-[#00a884] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0] px-6">
            <div className="w-16 h-16 rounded-full bg-[#1f2c33] flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-center text-sm">
              {searchQuery
                ? "Nenhuma conversa encontrada"
                : `Nenhuma conversa ${activeTab === "open" ? "aberta" : activeTab === "pending" ? "pendente" : "resolvida"}`}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ConversationItem
                  conversation={conversation}
                  isSelected={selectedId === conversation.id}
                  onClick={() => onSelect(conversation.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 px-4 flex items-center justify-between bg-[#1f2c33] border-t border-[#2a2a2a] text-[10px] text-[#8696a0]">
        <span>{filteredConversations.length} conversas</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00a884]" />
          WABA Conectado
        </span>
      </div>
    </div>
  );
}
