"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChatView, Conversation, Contact, Message } from "@/types/chat";
import { Sidebar } from "./Sidebar";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { NewConversationModal } from "./NewConversationModal";
import { PreviewConversationModal } from "./PreviewConversationModal";
import { AttachmentFile } from "./AttachmentMenu";
import { ContactsView } from "./views/ContactsView";
import { SettingsView } from "./views/SettingsView";
import { useWABAConversations, type WABAConversation } from "@/hooks/use-waba-conversations";
import { useWABAMessages } from "@/hooks/use-waba-messages";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface WhatsLidiaLayoutOficialProps {
  connectionType?: "qr" | "oficial";
}

// Convert WABA conversation to UI Conversation format
function convertWABAConversation(wabaConv: WABAConversation): Conversation {
  return {
    id: wabaConv.id,
    contact: {
      id: wabaConv.contact?.id || "",
      name: wabaConv.contact?.name || wabaConv.contact?.phone || "Desconhecido",
      phone: wabaConv.contact?.phone || "",
      avatar: wabaConv.contact?.profile_picture,
      isRegistered: true,
      source: "whatsapp_official" as const,
      createdAt: new Date(wabaConv.contact?.created_at || Date.now()),
      updatedAt: new Date(wabaConv.contact?.updated_at || Date.now()),
    },
    status: wabaConv.status,
    priority: wabaConv.priority,
    unreadCount: wabaConv.unread_count,
    tags: [],
    channel: "whatsapp_official" as const,
    createdAt: new Date(wabaConv.created_at),
    updatedAt: new Date(wabaConv.updated_at),
    lastMessage: wabaConv.last_message ? {
      content: wabaConv.last_message.content,
      timestamp: new Date(wabaConv.last_message.created_at),
      type: (wabaConv.last_message.message_type === "text" ? "text" : "media") as import("@/types/chat").MessageType,
      isFromMe: wabaConv.last_message.direction === "outbound",
      status: wabaConv.last_message.status === "read" ? "read" : 
              wabaConv.last_message.status === "delivered" ? "delivered" : "sent",
    } : undefined,
  };
}

export function WhatsLidiaLayoutOficial({ connectionType }: WhatsLidiaLayoutOficialProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ChatView>("conversations");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'resolved'>('open');

  // WABA Hooks
  const {
    conversations: wabaConversations,
    isLoading: isLoadingConversations,
    openConversation,
    resolveConversation,
    resetUnreadCount,
    findOrCreateContact,
    findOrCreateConversation,
  } = useWABAConversations(user?.companyId, activeTab);

  // Convert WABA conversations to UI format
  const conversations = useMemo(() => {
    return wabaConversations.map(convertWABAConversation);
  }, [wabaConversations]);

  // Selected conversation
  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  // WABA Messages hook for selected conversation
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage,
    markAsRead,
  } = useWABAMessages(selectedConversationId || undefined);

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

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }

    // If conversation is pending, open it
    const conv = wabaConversations.find((c) => c.id === id);
    if (conv?.status === "pending") {
      await openConversation(id);
    }

    // Reset unread count
    await resetUnreadCount(id);
    await markAsRead();
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversationId(null);
  };

  const handleExit = () => {
    router.push("/app/central");
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartNewConversation = async (contactData: Contact | { phone: string; name: string }) => {
    const phone = (contactData as { phone: string }).phone;
    const name = (contactData as { name?: string }).name;

    if (!user?.companyId) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Find or create contact
      const contact = await findOrCreateContact(user.companyId, phone, name);
      
      // Find or create conversation
      const conversation = await findOrCreateConversation(user.companyId, contact.id);

      if (conversation) {
        handleSelectConversation(conversation.id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Erro ao iniciar conversa");
    }
  };

  const handleForceClose = async (id: string) => {
    await resolveConversation(id);
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      if (isMobile) {
        setShowChat(false);
      }
    }
  };

  const handlePreview = (id: string) => {
    setPreviewConversationId(id);
    setIsPreviewModalOpen(true);
  };

  const previewConversation = conversations.find(
    (c) => c.id === previewConversationId
  ) || null;

  const handleOpenConversation = async (id: string) => {
    await openConversation(id);
    setActiveTab('open');
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleReopenConversation = async (id: string) => {
    await openConversation(id);
    setActiveTab('open');
    setSelectedConversationId(id);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleTabChange = (tab: 'open' | 'pending' | 'resolved') => {
    setActiveTab(tab);
    setSelectedConversationId(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) {
      toast.error("Conexão WABA não encontrada");
      return;
    }

    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "text",
      content,
    });
  };

  // Handle sending attachments
  const handleSendAttachments = async (files: AttachmentFile[], caption?: string) => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) {
      toast.error("Conexão WABA não encontrada");
      return;
    }

    // For now, just send text with file info
    // TODO: Implement media upload
    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "text",
      content: caption || `${files.length} arquivo(s) enviado(s)`,
    });
  };

  // Handle sending location
  const handleSendLocation = async (type: "location" | "address" | "request") => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) return;

    const content = type === 'request' ? '📍 Solicitação de localização' : '📍 Localização';
    
    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "text",
      content,
    });
  };

  // Handle sending contact
  const handleSendContact = async () => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) return;

    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "text",
      content: '👤 Contato',
    });
  };

  // Handle sending template
  const handleSendTemplate = async (templateName: string) => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) return;

    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "template",
      content: templateName,
    });
  };

  // Handle sending flow
  const handleSendFlow = async () => {
    if (!selectedConversationId || !selectedConversation) return;

    const wabaConv = wabaConversations.find((c) => c.id === selectedConversationId);
    if (!wabaConv?.waba_connection_id) return;

    await sendMessage({
      conversationId: selectedConversationId,
      connectionId: wabaConv.waba_connection_id,
      phoneNumber: selectedConversation.contact.phone,
      messageType: "text",
      content: '🔀 Flow',
    });
  };

  // Determine if the current conversation is read-only
  const isChatReadOnly = useMemo(() => {
    if (!selectedConversation) return true;
    return selectedConversation.status !== 'open';
  }, [selectedConversation]);

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
                  connectionType={connectionType}
                  loading={isLoadingConversations}
                  activeTab={activeTab}
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
                  onSendMessage={handleSendMessage}
                  onSendAttachments={handleSendAttachments}
                  onSendLocation={handleSendLocation}
                  onSendContact={handleSendContact}
                  onSendTemplate={handleSendTemplate}
                  onSendFlow={handleSendFlow}
                  messages={messages}
                  isLoadingMessages={isLoadingMessages}
                  isSending={isSending}
                  connectionType={connectionType}
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
            connectionType={connectionType}
            loading={isLoadingConversations}
            activeTab={activeTab}
          />
          <ChatWindow
            conversation={selectedConversation}
            isDarkMode={isDarkMode}
            isReadOnly={isChatReadOnly}
            onReopen={() => selectedConversationId && handleReopenConversation(selectedConversationId)}
            onSendMessage={handleSendMessage}
            onSendAttachments={handleSendAttachments}
            onSendLocation={handleSendLocation}
            onSendContact={handleSendContact}
            onSendTemplate={handleSendTemplate}
            onSendFlow={handleSendFlow}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            isSending={isSending}
            connectionType={connectionType}
          />
        </>
      );
    }

    switch (currentView) {
      case "contacts":
        return (
          <ContactsView
            isDarkMode={isDarkMode}
            onBack={() => setCurrentView("conversations")}
            onStartConversation={(contactId) => {
              const existingConv = conversations.find(
                (c) => c.contact.id === contactId
              );
              if (existingConv) {
                handleSelectConversation(existingConv.id);
                setCurrentView("conversations");
              }
            }}
          />
        );
      case "notes":
        setCurrentView("conversations");
        return null;
      case "tasks":
        setCurrentView("conversations");
        return null;
      case "settings":
        return (
          <SettingsView
            isDarkMode={isDarkMode}
            onBack={() => setCurrentView("conversations")}
          />
        );
      default:
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
                Página não encontrada
              </h2>
              <button
                onClick={() => setCurrentView("conversations")}
                className="mt-4 px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#00a884]/90 transition-colors"
              >
                Voltar às Conversas
              </button>
            </div>
          </div>
        );
    }
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
