"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Conversation, ConversationStatus } from "@/types/chat";
import { ConversationItem } from "./ConversationItem";
import { Search, Plus, Filter, Moon, Sun, Wifi, WifiOff } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  wabaStatus: "connected" | "disconnected" | "connecting";
  onForceClose?: (id: string) => void;
  onPreview?: (id: string) => void;
  onOpenConversation?: (id: string) => void;
}

type FilterTab = "open" | "pending" | "resolved";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  isDarkMode,
  onToggleTheme,
  wabaStatus,
  onForceClose,
  onPreview,
  onOpenConversation,
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

  const getWabaStatusColor = () => {
    switch (wabaStatus) {
      case "connected":
        return "text-emerald-400";
      case "connecting":
        return "text-yellow-400";
      case "disconnected":
        return "text-red-400";
    }
  };

  const getWabaStatusText = () => {
    switch (wabaStatus) {
      case "connected":
        return "WABA Conectado";
      case "connecting":
        return "Conectando...";
      case "disconnected":
        return "WABA Desconectado";
    }
  };

  return (
    <div className={cn(
      "w-[380px] h-full flex flex-col border-r shrink-0 transition-colors duration-300",
      isDarkMode ? "bg-[#111b21] border-[#2a2a2a]" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className={cn(
        "h-16 px-4 flex items-center justify-between border-b",
        isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-[#f0f2f5] border-gray-200"
      )}>
        <div className="flex items-center gap-2">
          {/* Logo Curionópolis */}
          <div className="relative w-32 h-10">
            <Image
              src="/Curionópolis - Logo 2021.pdf.png"
              alt="Curionópolis"
              fill
              className="object-contain logo-image"
              priority
            />
          </div>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            isDarkMode ? "bg-[#00a884]/20 text-[#00a884]" : "bg-emerald-100 text-emerald-600"
          )}>
            BETA
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewConversation}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isDarkMode 
              ? "text-[#aebac1] hover:bg-[#2a3942]" 
              : "text-gray-600 hover:bg-gray-200"
          )}
          title="Nova Conversa"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className={cn(
        "p-3 transition-colors duration-300",
        isDarkMode ? "bg-[#111b21]" : "bg-white"
      )}>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className={cn(
              "w-4 h-4",
              isDarkMode ? "text-[#8696a0]" : "text-gray-400"
            )} />
          </div>
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-10 pl-10 pr-4 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all",
              isDarkMode 
                ? "bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0]" 
                : "bg-[#f0f2f5] text-gray-900 placeholder-gray-500"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={cn(
                "absolute inset-y-0 right-3 flex items-center",
                isDarkMode ? "text-[#8696a0] hover:text-[#e9edef]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={cn(
        "px-3 pb-2 border-b transition-colors duration-300",
        isDarkMode ? "bg-[#111b21] border-[#2a2a2a]" : "bg-white border-gray-200"
      )}>
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
                    ? isDarkMode 
                      ? "bg-[#2a3942] text-[#00a884]" 
                      : "bg-emerald-100 text-emerald-600"
                    : isDarkMode 
                      ? "text-[#8696a0] hover:bg-[#1f2c33] hover:text-[#e9edef]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {tab.label}
                {unreadCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center",
                    isDarkMode ? "bg-[#00a884] text-white" : "bg-emerald-500 text-white"
                  )}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-thin",
        isDarkMode 
          ? "scrollbar-thumb-[#374045] scrollbar-track-transparent" 
          : "scrollbar-thumb-gray-300 scrollbar-track-transparent"
      )}>
        {filteredConversations.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center h-full px-6",
            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              isDarkMode ? "bg-[#1f2c33]" : "bg-gray-100"
            )}>
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
                  isDarkMode={isDarkMode}
                  activeTab={activeTab}
                  onForceClose={onForceClose}
                  onPreview={onPreview}
                  onOpenConversation={onOpenConversation}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer com Toggle de Tema e Status WABA */}
      <div className={cn(
        "h-14 px-4 flex items-center justify-between border-t transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-[#f0f2f5] border-gray-200"
      )}>
        {/* Status WABA */}
        <div className="flex items-center gap-2">
          {wabaStatus === "connected" ? (
            <Wifi className={cn("w-4 h-4", getWabaStatusColor())} />
          ) : (
            <WifiOff className={cn("w-4 h-4", getWabaStatusColor())} />
          )}
          <span className={cn(
            "text-xs font-medium",
            isDarkMode ? "text-[#e9edef]" : "text-gray-700"
          )}>
            {getWabaStatusText()}
          </span>
        </div>

        {/* Toggle Tema */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleTheme}
          className={cn(
            "w-10 h-6 rounded-full relative flex items-center transition-colors duration-300",
            isDarkMode ? "bg-[#00a884]" : "bg-gray-300"
          )}
        >
          <motion.div
            initial={false}
            animate={{ x: isDarkMode ? 16 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shadow-sm",
              isDarkMode ? "bg-white" : "bg-white"
            )}
          >
            {isDarkMode ? (
              <Moon className="w-3 h-3 text-[#1f2c33]" />
            ) : (
              <Sun className="w-3 h-3 text-yellow-500" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Contador de conversas */}
      <div className={cn(
        "h-7 px-4 flex items-center justify-center text-[10px] transition-colors duration-300",
        isDarkMode 
          ? "bg-[#111b21] text-[#8696a0] border-t border-[#2a2a2a]" 
          : "bg-white text-gray-500 border-t border-gray-200"
      )}>
        {filteredConversations.length} conversas
      </div>
    </div>
  );
}
