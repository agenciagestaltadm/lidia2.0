"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/chat";
import {
  MoreVertical,
  Search,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Circle,
  CalendarClock,
  RotateCcw,
  CheckCircle,
  UserPlus,
  Trash2,
  Ban,
  X,
  TrendingUp,
  FileCheck,
  Star,
  StickyNote,
  FileDown,
} from "lucide-react";
import { useState } from "react";
import {
  ContactInfoModal,
  ScheduleMessageModal,
  ReturnToPendingModal,
  ResolveTicketModal,
  TransferTicketModal,
  SalesFunnelModal,
  ProtocolModal,
  RatingModal,
  NotesModal,
  ExportChatModal,
} from "./modals";

interface ChatHeaderProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
  isDarkMode?: boolean;
  onResolve?: () => void;
}

interface MenuOption {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  separator?: boolean;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function ChatHeader({
  conversation,
  onBack,
  showBackButton = false,
  isDarkMode = true,
  onResolve,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Modal states
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isReturnPendingOpen, setIsReturnPendingOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  // New feature modal states
  const [isSalesFunnelOpen, setIsSalesFunnelOpen] = useState(false);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!conversation) {
    return (
      <div className={cn(
        "h-16 px-4 flex items-center justify-center border-b transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-white border-gray-200"
      )}>
        <p className={cn(
          "transition-colors duration-300",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}>
          Selecione uma conversa
        </p>
      </div>
    );
  }

  const { contact, isTyping, assignedTo } = conversation;

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
        4,
        9
      )}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Handlers for menu actions
  const handleScheduleMessage = async (data: { date: Date; message: string }) => {
    console.log("Scheduling message:", data);
    // TODO: Implement API call
    // await fetch(`/api/conversations/${conversation.id}/schedule`, {
    //   method: 'POST',
    //   body: JSON.stringify(data)
    // });
  };

  const handleReturnToPending = async () => {
    console.log("Returning to pending:", conversation.id);
    // TODO: Implement API call
    // await fetch(`/api/tickets/${conversation.id}/return-to-pending`, {
    //   method: 'POST'
    // });
  };

  const handleResolveTicket = async (notes?: string) => {
    console.log("Resolving ticket:", conversation.id, notes);
    // Chamar o handler externo se fornecido
    onResolve?.();
  };

  const handleTransferTicket = async (userId: string, userName: string) => {
    console.log("Transferring ticket:", conversation.id, "to", userId, userName);
    // TODO: Implement API call
    // await fetch(`/api/tickets/${conversation.id}/transfer`, {
    //   method: 'POST',
    //   body: JSON.stringify({ userId })
    // });
  };

  // Menu options with new actions
  const menuOptions: MenuOption[] = [
    // Info section
    { 
      label: "Informações do contato", 
      icon: Info, 
      onClick: () => { 
        setIsContactInfoOpen(true); 
        setShowMenu(false); 
      },
      variant: "default"
    },
    { 
      label: "Marcar como não lido", 
      icon: Circle,
      onClick: () => {
        console.log("Mark as unread");
        setShowMenu(false);
      },
      variant: "default"
    },
    { 
      label: "Limpar conversa", 
      icon: Trash2,
      onClick: () => {
        console.log("Clear conversation");
        setShowMenu(false);
      },
      variant: "default",
      separator: true 
    },
    
    // New Actions Section
    { 
      label: "Agendar mensagem", 
      icon: CalendarClock, 
      onClick: () => { 
        setIsScheduleOpen(true); 
        setShowMenu(false); 
      },
      variant: "info"
    },
    { 
      label: "Retornar para pendentes", 
      icon: RotateCcw, 
      onClick: () => { 
        setIsReturnPendingOpen(true); 
        setShowMenu(false); 
      },
      variant: "warning"
    },
    { 
      label: "Resolver ticket", 
      icon: CheckCircle, 
      onClick: () => { 
        setIsResolveOpen(true); 
        setShowMenu(false); 
      },
      variant: "success"
    },
    { 
      label: "Transferir atendimento", 
      icon: UserPlus, 
      onClick: () => { 
        setIsTransferOpen(true); 
        setShowMenu(false); 
      },
      variant: "default",
      separator: true
    },
    
    // Contact Info Features
    { 
      label: "Funil de vendas", 
      icon: TrendingUp,
      onClick: () => {
        setIsSalesFunnelOpen(true);
        setShowMenu(false);
      },
      variant: "info"
    },
    { 
      label: "Gerar protocolo", 
      icon: FileCheck,
      onClick: () => {
        setIsProtocolOpen(true);
        setShowMenu(false);
      },
      variant: "info"
    },
    { 
      label: "Solicitar avaliação", 
      icon: Star,
      onClick: () => {
        setIsRatingOpen(true);
        setShowMenu(false);
      },
      variant: "info"
    },
    { 
      label: "Notas e anotações", 
      icon: StickyNote,
      onClick: () => {
        setIsNotesOpen(true);
        setShowMenu(false);
      },
      variant: "info"
    },
    { 
      label: "Exportar conversa", 
      icon: FileDown,
      onClick: () => {
        setIsExportOpen(true);
        setShowMenu(false);
      },
      variant: "info",
      separator: true
    },
    
    // Danger zone
    { 
      label: "Bloquear contato", 
      icon: Ban,
      onClick: () => {
        console.log("Block contact");
        setShowMenu(false);
      },
      variant: "danger"
    },
    { 
      label: "Fechar conversa", 
      icon: X,
      onClick: () => {
        console.log("Close conversation");
        setShowMenu(false);
      },
      variant: "danger"
    },
  ];

  const getVariantStyles = (variant: MenuOption["variant"]) => {
    switch (variant) {
      case "success":
        return isDarkMode 
          ? "text-[#00a884] hover:bg-[#00a884]/10" 
          : "text-green-600 hover:bg-green-50";
      case "warning":
        return isDarkMode 
          ? "text-amber-400 hover:bg-amber-500/10" 
          : "text-amber-600 hover:bg-amber-50";
      case "danger":
        return isDarkMode 
          ? "text-red-400 hover:bg-red-500/10" 
          : "text-red-600 hover:bg-red-50";
      case "info":
        return isDarkMode 
          ? "text-blue-400 hover:bg-blue-500/10" 
          : "text-blue-600 hover:bg-blue-50";
      default:
        return isDarkMode 
          ? "text-[#e9edef] hover:bg-[#374045]" 
          : "text-gray-900 hover:bg-gray-100";
    }
  };

  const getIconColor = (variant: MenuOption["variant"]) => {
    switch (variant) {
      case "success":
        return isDarkMode ? "text-[#00a884]" : "text-green-600";
      case "warning":
        return isDarkMode ? "text-amber-400" : "text-amber-600";
      case "danger":
        return isDarkMode ? "text-red-400" : "text-red-600";
      case "info":
        return isDarkMode ? "text-blue-400" : "text-blue-600";
      default:
        return isDarkMode ? "text-[#8696a0]" : "text-gray-500";
    }
  };

  return (
    <>
      <div className={cn(
        "h-16 px-4 flex items-center justify-between border-b transition-colors duration-300",
        isDarkMode 
          ? "bg-[#1f2c33] border-[#2a2a2a]" 
          : "bg-white border-gray-200"
      )}>
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className={cn(
                "lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isDarkMode 
                  ? "text-[#aebac1] hover:bg-[#2a3942]" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}

          {/* Avatar - Clickable */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsContactInfoOpen(true)}
            className="relative"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium text-sm cursor-pointer">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            {contact.isRegistered && (
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00a884] rounded-full border-2",
                isDarkMode ? "border-[#1f2c33]" : "border-white"
              )} />
            )}
          </motion.button>

          {/* Contact Info - Clickable */}
          <motion.button
            onClick={() => setIsContactInfoOpen(true)}
            className="flex flex-col items-start"
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.98 }}
          >
            <h2 className={cn(
              "font-medium text-base transition-colors duration-300",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              {contact.name}
            </h2>
            <div className="flex items-center gap-2">
              {isTyping ? (
                <span className="text-[#00a884] text-xs">digitando...</span>
              ) : (
                <span className={cn(
                  "text-xs transition-colors duration-300",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  {formatPhone(contact.phone)}
                </span>
              )}
              {assignedTo && (
                <>
                  <span className={cn(
                    "transition-colors duration-300",
                    isDarkMode ? "text-[#374045]" : "text-gray-300"
                  )}>•</span>
                  <span className={cn(
                    "text-xs transition-colors duration-300",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    {assignedTo.name}
                  </span>
                </>
              )}
            </div>
          </motion.button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Search Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDarkMode 
                ? "text-[#aebac1] hover:bg-[#2a3942]" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {/* Info Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsContactInfoOpen(true)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDarkMode 
                ? "text-[#aebac1] hover:bg-[#2a3942]" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Info className="w-5 h-5" />
          </motion.button>

          {/* Menu Button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isDarkMode 
                  ? "text-[#aebac1] hover:bg-[#2a3942]" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>

            {/* Dropdown Menu with Animation */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl border py-2 z-50 overflow-hidden",
                    isDarkMode 
                      ? "bg-[#2a3942] border-[#374045]" 
                      : "bg-white border-gray-200"
                  )}
                >
                  {menuOptions.map((option, index) => (
                    <div key={option.label}>
                      {option.separator && index > 0 && (
                        <div className={cn(
                          "border-t my-1",
                          isDarkMode ? "border-[#374045]" : "border-gray-200"
                        )} />
                      )}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={option.onClick}
                        className={cn(
                          "w-full px-4 py-2.5 text-left transition-colors text-sm flex items-center gap-3",
                          getVariantStyles(option.variant)
                        )}
                      >
                        <option.icon className={cn(
                          "w-4 h-4",
                          getIconColor(option.variant)
                        )} />
                        <span className="font-medium">{option.label}</span>
                      </motion.button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Click outside to close menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ContactInfoModal
        isOpen={isContactInfoOpen}
        onClose={() => setIsContactInfoOpen(false)}
        conversation={conversation}
        isDarkMode={isDarkMode}
      />

      <ScheduleMessageModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        conversationId={conversation.id}
        isDarkMode={isDarkMode}
        onSchedule={handleScheduleMessage}
      />

      <ReturnToPendingModal
        isOpen={isReturnPendingOpen}
        onClose={() => setIsReturnPendingOpen(false)}
        conversationId={conversation.id}
        isDarkMode={isDarkMode}
        onReturn={handleReturnToPending}
      />

      <ResolveTicketModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        conversationId={conversation.id}
        isDarkMode={isDarkMode}
        onResolve={handleResolveTicket}
      />

      <TransferTicketModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        conversationId={conversation.id}
        isDarkMode={isDarkMode}
        onTransfer={handleTransferTicket}
      />

      {/* New Feature Modals */}
      <SalesFunnelModal
        isOpen={isSalesFunnelOpen}
        onClose={() => setIsSalesFunnelOpen(false)}
        contactId={conversation.id}
        contactName={conversation.contact.name}
        isDarkMode={isDarkMode}
      />

      <ProtocolModal
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
        conversationId={conversation.id}
        contactName={conversation.contact.name}
        isDarkMode={isDarkMode}
      />

      <RatingModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        conversationId={conversation.id}
        contactName={conversation.contact.name}
        isDarkMode={isDarkMode}
      />

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        contactId={conversation.id}
        contactName={conversation.contact.name}
        isDarkMode={isDarkMode}
      />

      <ExportChatModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        conversationId={conversation.id}
        contactName={conversation.contact.name}
        contact={conversation.contact}
        messages={[]}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
