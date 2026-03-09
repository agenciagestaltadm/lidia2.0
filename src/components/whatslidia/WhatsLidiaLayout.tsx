"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChatView, Conversation } from "@/types/chat";
import { Sidebar } from "./Sidebar";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { mockConversations } from "@/lib/mock/chat-data";

export function WhatsLidiaLayout() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ChatView>("conversations");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  ) || null;

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }

    // Mark as read (mock)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversationId(null);
  };

  const handleExit = () => {
    // Navigate back to dashboard
    router.push("/app/central");
  };

  // Render different views based on currentView state
  const renderMainContent = () => {
    if (currentView === "conversations") {
      if (isMobile) {
        return (
          <AnimatePresence mode="wait">
            {!showChat ? (
              <motion.div
                key="list"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="flex-1"
              >
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversationId}
                  onSelect={handleSelectConversation}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="flex-1"
              >
                <ChatWindow
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                  showBackButton={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        );
      }

      return (
        <>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={handleSelectConversation}
          />
          <ChatWindow conversation={selectedConversation} />
        </>
      );
    }

    // Placeholder for other views
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
        <div className="text-center">
          <h2 className="text-[#e9edef] text-2xl font-medium mb-2">
            {currentView === "contacts" && "Contatos Cadastrados"}
            {currentView === "notes" && "Comentários Internos"}
            {currentView === "tasks" && "Criar Tarefas"}
            {currentView === "settings" && "Configurações"}
          </h2>
          <p className="text-[#8696a0]">
            Funcionalidade em desenvolvimento
          </p>
          <button
            onClick={() => setCurrentView("conversations")}
            className="mt-4 px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#00a884]/90 transition-colors"
          >
            Voltar às Conversas
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0b141a]">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onExit={handleExit}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
}
