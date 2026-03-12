"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatRoom } from "./components/ChatRoom";
import { EmptyState } from "./components/EmptyState";
import type { ChatChannel, ChatUser } from "@/types/internal-chat";

export default function ComunicacaoPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelectChannel = (channel: ChatChannel) => {
    setSelectedChannel(channel);
    setSelectedUser(null);
  };

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setSelectedChannel(null);
  };

  const handleBack = () => {
    setSelectedChannel(null);
    setSelectedUser(null);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || typeof window === "undefined" || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-border flex-shrink-0"
          >
            <ChatSidebar
              selectedChannelId={selectedChannel?.id}
              selectedUserId={selectedUser?.id}
              onSelectChannel={handleSelectChannel}
              onSelectUser={handleSelectUser}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel || selectedUser ? (
          <ChatRoom
            channel={selectedChannel}
            directUser={selectedUser}
            onBack={handleBack}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <EmptyState onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        )}
      </div>
    </div>
  );
}
