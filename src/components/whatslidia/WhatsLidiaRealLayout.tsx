"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useWhatsAppSessions } from "@/hooks/use-whatsapp-sessions";
import { useWhatsAppContacts } from "@/hooks/use-whatsapp-contacts";
import { useWhatsAppMessages } from "@/hooks/use-whatsapp-messages";
import { toast } from "sonner";

interface WhatsLidiaRealLayoutProps {
  sessionId: string;
}

// Helper to convert WhatsApp contact to Conversation
const createConversationFromContact = (contact: any, sessionId: string): Conversation => {
  return {
    id: `conv-${contact.phone}`,
    contact: {
      id: contact.phone,
      name: contact.name,
      phone: contact.phone,
      avatar: contact.profile_picture,
      isRegistered: true,
      source: "whatsapp",
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at),
    },
    status: "open",
    priority: "medium",
    unreadCount: 0,
    tags: [],
    channel: "whatsapp",
    createdAt: new Date(contact.created_at),
    updatedAt: new Date(contact.last_message_at || contact.updated_at),
  };
};

// Helper to convert WhatsApp message to Message type
const createMessageFromWhatsAppMessage = (msg: any): Message => {
  return {
    id: msg.id,
    conversationId: msg.contact_phone,
    content: msg.content,
    type: msg.type === 'text' ? 'text' : 
          msg.type === 'image' ? 'image' :
          msg.type === 'video' ? 'video' :
          msg.type === 'audio' ? 'audio' :
          msg.type === 'document' ? 'document' : 'text',
    status: msg.status === 'read' ? 'read' :
            msg.status === 'delivered' ? 'delivered' :
            msg.status === 'sent' ? 'sent' : 'sent',
    isFromMe: msg.direction === 'outgoing',
    timestamp: new Date(msg.timestamp),
    sender: msg.direction === 'outgoing' ? undefined : {
      id: msg.contact_phone,
      name: msg.contact_name || msg.contact_phone,
    },
  };
};

export function WhatsLidiaRealLayout({ sessionId }: WhatsLidiaRealLayoutProps) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ChatView>("conversations");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // New conversation modal
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  
  // Preview conversation modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null);
  
  // Active tab state for access control
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'resolved'>('open');

  // Load WhatsApp session data
  const { sessions, loading: sessionsLoading } = useWhatsAppSessions();
  const session = useMemo(() => 
    sessions.find(s => s.id === sessionId),
    [sessions, sessionId]
  );

  // Load contacts from WhatsApp
  const { contacts, loading: contactsLoading } = useWhatsAppContacts(sessionId);

  // Load messages for selected conversation
  const selectedContactPhone = selectedConversationId?.replace('conv-', '') || null;
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage: sendWhatsAppMessage 
  } = useWhatsAppMessages(sessionId, selectedContactPhone);

  // Convert contacts to conversations
  const conversations = useMemo(() => {
    return contacts.map(contact => createConversationFromContact(contact, sessionId));
  }, [contacts, sessionId]);

  // Get current messages for selected conversation
  const currentMessages = useMemo(() => {
    if (!selectedContactPhone) return [];
    return messages.map(createMessageFromWhatsAppMessage);
  }, [messages, selectedContactPhone]);

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

  const handleStartNewConversation = useCallback(async (contactData: Contact | { phone: string; name: string }) => {
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

    // For new conversations, just select the contact if it exists
    const existingContact = contacts.find(c => c.phone === phone);
    if (existingContact) {
      const conversation = createConversationFromContact(existingContact, sessionId);
      handleSelectConversation(conversation.id);
    } else {
      toast.error("Contato não encontrado. Sincronize seus contatos primeiro.");
    }
  }, [conversations, contacts, sessionId]);

  // Handle sending message via API
  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedContactPhone || !sessionId) return;
    
    const success = await sendWhatsAppMessage({
      phone: selectedContactPhone,
      message: content,
    });

    if (!success) {
      toast.error("Erro ao enviar mensagem");
    }
  }, [selectedContactPhone, sessionId, sendWhatsAppMessage]);

  // Handle sending attachments
  const handleSendAttachments = async (files: AttachmentFile[], caption?: string) => {
    if (!selectedContactPhone || !sessionId) return;
    
    for (const file of files) {
      try {
        // Converte arquivo para base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          
          const success = await sendWhatsAppMessage({
            phone: selectedContactPhone,
            message: caption || file.file.name,
            mediaType: file.type,
            mediaUrl: base64Data,
            fileName: file.file.name,
          } as any);

          if (!success) {
            toast.error(`Erro ao enviar ${file.file.name}`);
          } else {
            toast.success(`${file.file.name} enviado com sucesso`);
          }
        };
        reader.readAsDataURL(file.file);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error(`Erro ao processar ${file.file.name}`);
      }
    }
  };

  // Handle sending location
  const handleSendLocation = (type: "location" | "address" | "request") => {
    toast.info("Envio de localização em desenvolvimento");
  };

  // Handle sending contact
  const handleSendContact = () => {
    toast.info("Envio de contato em desenvolvimento");
  };

  // Handle sending template
  const handleSendTemplate = (type: string) => {
    toast.info("Envio de template em desenvolvimento");
  };

  // Handle sending flow
  const handleSendFlow = () => {
    toast.info("Envio de flow em desenvolvimento");
  };

  // Handle tab change
  const handleTabChange = (tab: 'open' | 'pending' | 'resolved') => {
    setActiveTab(tab);
    setSelectedConversationId(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  // Determine if the current conversation is read-only
  const isChatReadOnly = useMemo(() => {
    if (!session) return true;
    return session.status !== 'active';
  }, [session]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Get WABA status from session
  const wabaStatus = useMemo(() => {
    if (!session) return "disconnected" as const;
    if (session.status === 'active') return "connected" as const;
    if (session.status === 'connecting' || session.status === 'waiting_qr') return "connecting" as const;
    return "disconnected" as const;
  }, [session]);

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
                  onTabChange={handleTabChange}
                  connectionType="qr"
                  loading={contactsLoading}
                  hideTabs={true}
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
                  externalMessages={currentMessages}
                  onBack={handleBackToList}
                  showBackButton={true}
                  isDarkMode={isDarkMode}
                  isReadOnly={isChatReadOnly}
                  onSendMessage={handleSendMessage}
                  onSendAttachments={handleSendAttachments}
                  onSendLocation={handleSendLocation}
                  onSendContact={handleSendContact}
                  onSendTemplate={handleSendTemplate}
                  onSendFlow={handleSendFlow}
                  loading={messagesLoading}
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
                  onTabChange={handleTabChange}
                  connectionType="qr"
                  loading={contactsLoading}
                  hideTabs={true}
                />
          <ChatWindow
            conversation={selectedConversation}
                  externalMessages={currentMessages}
            isDarkMode={isDarkMode}
            isReadOnly={isChatReadOnly}
            onSendMessage={handleSendMessage}
            onSendAttachments={handleSendAttachments}
            onSendLocation={handleSendLocation}
            onSendContact={handleSendContact}
            onSendTemplate={handleSendTemplate}
            onSendFlow={handleSendFlow}
            loading={messagesLoading}
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

  if (sessionsLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b141a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b141a]">
        <div className="text-center">
          <p className="text-white mb-4">Sessão não encontrada</p>
          <button
            onClick={() => router.push("/app/connection")}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Voltar às Conexões
          </button>
        </div>
      </div>
    );
  }

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
        conversation={null}
        isDarkMode={isDarkMode}
        onOpenConversation={() => {}}
      />
    </>
  );
}
