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

interface ChatHeaderProps {
  conversation: Conversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({
  conversation,
  onBack,
  showBackButton = false,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (!conversation) {
    return (
      <div className="h-16 px-4 flex items-center justify-center bg-[#1f2c33] border-b border-[#2a2a2a]">
        <p className="text-[#8696a0]">Selecione uma conversa</p>
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
    { label: "Informações do contato", icon: Info },
    { label: "Marcar como não lido", icon: Circle },
    { label: "Limpar conversa", icon: Circle },
    { label: "Bloquear contato", icon: Circle },
  ];

  return (
    <div className="h-16 px-4 flex items-center justify-between bg-[#1f2c33] border-b border-[#2a2a2a]">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942]"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}

        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium text-sm">
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
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#1f2c33]" />
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col">
          <h2 className="text-[#e9edef] font-medium text-base">
            {contact.name}
          </h2>
          <div className="flex items-center gap-2">
            {isTyping ? (
              <span className="text-[#00a884] text-xs">digitando...</span>
            ) : (
              <span className="text-[#8696a0] text-xs">
                {formatPhone(contact.phone)}
              </span>
            )}
            {assignedTo && (
              <>
                <span className="text-[#374045]">•</span>
                <span className="text-[#8696a0] text-xs">
                  {assignedTo.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942] transition-colors"
        >
          <Search className="w-5 h-5" />
        </motion.button>

        {/* Info Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942] transition-colors"
        >
          <Info className="w-5 h-5" />
        </motion.button>

        {/* Menu Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942] transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>

          {/* Dropdown Menu */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-56 bg-[#2a3942] rounded-lg shadow-xl border border-[#374045] py-2 z-50"
            >
              {menuOptions.map((option, index) => (
                <button
                  key={option.label}
                  className="w-full px-4 py-2.5 text-left text-[#e9edef] hover:bg-[#374045] transition-colors text-sm flex items-center gap-3"
                >
                  <option.icon className="w-4 h-4 text-[#8696a0]" />
                  {option.label}
                </button>
              ))}
              <div className="border-t border-[#374045] my-1" />
              <button className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-[#374045] transition-colors text-sm">
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
  );
}
