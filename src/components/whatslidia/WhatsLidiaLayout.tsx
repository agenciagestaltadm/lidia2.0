"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChatView, Conversation, Contact } from "@/types/chat";
import { Sidebar } from "./Sidebar";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { NewConversationModal } from "./NewConversationModal";
import { PreviewConversationModal } from "./PreviewConversationModal";
import { mockConversations, mockContacts } from "@/lib/mock/chat-data";

export function WhatsLidiaLayout() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ChatView>("conversations");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // WABA Status
  const [wabaStatus, setWabaStatus] = useState<"connected" | "disconnected" | "connecting">("connected");
  
  // New conversation modal
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  
  // Preview conversation modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null);
  
  // Active tab state for access control
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'resolved'>('open');

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

  // Check system preference for dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
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

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartNewConversation = (contactData: Contact | { phone: string; name: string }) => {
    // Extract phone and name from union type
    const phone = (contactData as any).phone;
    const name = (contactData as any).name || phone;
    // Check if conversation already exists
    const existingConv = conversations.find(
      (c) => c.contact.phone === phone
    );

    if (existingConv) {
      handleSelectConversation(existingConv.id);
      return;
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      contact: {
        id: `new-${Date.now()}`,
        name: name,
        phone: phone,
        avatar: undefined,
        isRegistered: true,
        source: "whatsapp",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      status: "open",
      priority: "medium",
      unreadCount: 0,
      tags: [],
      channel: "whatsapp",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    handleSelectConversation(newConversation.id);
  };

  // Handle force close conversation (move to resolved)
  const handleForceClose = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'resolved' as const } : c))
    );
    // If the closed conversation was selected, deselect it
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      if (isMobile) {
        setShowChat(false);
      }
    }
  };

  // Handle preview conversation (view without marking as read)
  const handlePreview = (id: string) => {
    setPreviewConversationId(id);
    setIsPreviewModalOpen(true);
    // Note: Not clearing unread count - this is the "preview" behavior
  };

  // Get preview conversation
  const previewConversation = conversations.find(
    (c) => c.id === previewConversationId
  ) || null;

  // Handle open conversation from pending (move to open)
  const handleOpenConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'open' as const, unreadCount: 0, updatedAt: new Date() }
          : c
      )
    );
    // Navigate to Open tab automatically
    setActiveTab('open');
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Handle reopen conversation from resolved (move to open)
  const handleReopenConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'open' as const, updatedAt: new Date() }
          : c
      )
    );
    // Navigate to Open tab automatically
    setActiveTab('open');
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'open' | 'pending' | 'resolved') => {
    setActiveTab(tab);
    // Deselect conversation when changing tabs to prevent confusion
    setSelectedConversationId(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  // Determine if the current conversation is read-only
  const isChatReadOnly = useMemo(() => {
    if (!selectedConversation) return true;
    return selectedConversation.status !== 'open';
  }, [selectedConversation]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                  isDarkMode={isDarkMode}
                  onToggleTheme={handleToggleTheme}
                  wabaStatus={wabaStatus}
                  onForceClose={handleForceClose}
                  onPreview={handlePreview}
                  onOpenConversation={handleOpenConversation}
                  onReopen={handleReopenConversation}
                  onTabChange={handleTabChange}
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
                  isDarkMode={isDarkMode}
                  isReadOnly={isChatReadOnly}
                  onReopen={() => selectedConversationId && handleReopenConversation(selectedConversationId)}
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
            onNewConversation={() => setIsNewConversationModalOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
            wabaStatus={wabaStatus}
            onForceClose={handleForceClose}
            onPreview={handlePreview}
            onOpenConversation={handleOpenConversation}
            onReopen={handleReopenConversation}
            onTabChange={handleTabChange}
          />
          <ChatWindow
            conversation={selectedConversation}
            isDarkMode={isDarkMode}
            isReadOnly={isChatReadOnly}
            onReopen={() => selectedConversationId && handleReopenConversation(selectedConversationId)}
          />
        </>
      );
    }

    // Placeholder for other views
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
      )}>
        <div className="text-center">
          <h2 className={cn(
            "text-2xl font-medium mb-2",
            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
          )}>
            {currentView === "contacts" && "Contatos Cadastrados"}
            {currentView === "notes" && "Comentários Internos"}
            {currentView === "tasks" && "Criar Tarefas"}
            {currentView === "settings" && "Configurações"}
          </h2>
          <p className={isDarkMode ? "text-[#8696a0]" : "text-gray-500"}>
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
    <>
      <div className={cn(
        "fixed inset-0 z-50 flex",
        isDarkMode ? "bg-[#0b141a]" : "bg-white"
      )}>
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

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onStartConversation={handleStartNewConversation}
        isDarkMode={isDarkMode}
      />

      {/* Preview Conversation Modal */}
      <PreviewConversationModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        conversation={previewConversation}
        isDarkMode={isDarkMode}
        onOpenConversation={handleOpenConversation}
      />
    </>
  );
}

