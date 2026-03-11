"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";
import { ContactInfoModal } from "./modals";

interface ChatHeaderProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
  isDarkMode?: boolean;
}

export function ChatHeader({
  conversation,
  onBack,
  showBackButton = false,
  isDarkMode = true,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);

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
    // Format: +55 XX XXXXX-XXXX
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
        4,
        9
      )}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const menuOptions = [
    { label: "Informações do contato", icon: Info, onClick: () => { setIsContactInfoOpen(true); setShowMenu(false); } },
    { label: "Marcar como não lido", icon: Circle },
    { label: "Limpar conversa", icon: Circle },
    { label: "Bloquear contato", icon: Circle },
  ];

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

            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl border py-2 z-50",
                  isDarkMode 
                    ? "bg-[#2a3942] border-[#374045]" 
                    : "bg-white border-gray-200"
                )}
              >
                {menuOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={option.onClick}
                    className={cn(
                      "w-full px-4 py-2.5 text-left transition-colors text-sm flex items-center gap-3",
                      isDarkMode 
                        ? "text-[#e9edef] hover:bg-[#374045]" 
                        : "text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <option.icon className={cn(
                      "w-4 h-4",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )} />
                    {option.label}
                  </button>
                ))}
                <div className={cn(
                  "border-t my-1",
                  isDarkMode ? "border-[#374045]" : "border-gray-200"
                )} />
                <button className={cn(
                  "w-full px-4 py-2.5 text-left text-red-400 transition-colors text-sm",
                  isDarkMode ? "hover:bg-[#374045]" : "hover:bg-gray-100"
                )}>
                  Fechar conversa
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Click outside to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>

      {/* Contact Info Modal */}
      <ContactInfoModal
        isOpen={isContactInfoOpen}
        onClose={() => setIsContactInfoOpen(false)}
        conversation={conversation}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
