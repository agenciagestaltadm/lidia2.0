"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { X, Search, Phone, User, Plus } from "lucide-react";
import { mockContacts } from "@/lib/mock/chat-data";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (contact: Contact | { phone: string; name: string }) => void;
  isDarkMode: boolean;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onStartConversation,
  isDarkMode,
}: NewConversationModalProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "phone">("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");

  const filteredContacts = mockContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const handleStartWithContact = (contact: Contact) => {
    onStartConversation(contact);
    onClose();
    setSearchQuery("");
  };

  const handleStartWithPhone = () => {
    if (phoneNumber.trim()) {
      onStartConversation({
        phone: phoneNumber.trim(),
        name: contactName.trim() || phoneNumber.trim(),
      });
      onClose();
      setPhoneNumber("");
      setContactName("");
    }
  };

  const formatPhoneInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Formata como +55 XX XXXXX-XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    if (numbers.length <= 9) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
    return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden",
            isDarkMode ? "bg-[#1f2c33]" : "bg-white"
          )}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b flex items-center justify-between",
            isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
          )}>
            <h2 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}>
              Nova Conversa
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isDarkMode 
                  ? "text-[#8696a0] hover:bg-[#2a3942]" 
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className={cn(
            "flex border-b",
            isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
          )}>
            <button
              onClick={() => setActiveTab("contacts")}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === "contacts"
                  ? isDarkMode 
                    ? "text-[#00a884] border-b-2 border-[#00a884]" 
                    : "text-emerald-600 border-b-2 border-emerald-500"
                  : isDarkMode 
                    ? "text-[#8696a0] hover:text-[#e9edef]" 
                    : "text-gray-500 hover:text-gray-700"
              )}
            >
              <User className="w-4 h-4" />
              Contatos
            </button>
            <button
              onClick={() => setActiveTab("phone")}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === "phone"
                  ? isDarkMode 
                    ? "text-[#00a884] border-b-2 border-[#00a884]" 
                    : "text-emerald-600 border-b-2 border-emerald-500"
                  : isDarkMode 
                    ? "text-[#8696a0] hover:text-[#e9edef]" 
                    : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Phone className="w-4 h-4" />
              Número
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "contacts" ? (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                  )} />
                  <input
                    type="text"
                    placeholder="Buscar contato..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-full h-10 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]/50",
                      isDarkMode 
                        ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                        : "bg-gray-100 text-gray-900 placeholder-gray-400"
                    )}
                  />
                </div>

                {/* Contacts List */}
                <div className={cn(
                  "max-h-64 overflow-y-auto space-y-1 scrollbar-thin",
                  isDarkMode ? "scrollbar-thumb-[#374045]" : "scrollbar-thumb-gray-300"
                )}>
                  {filteredContacts.length === 0 ? (
                    <div className={cn(
                      "text-center py-8 text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}>
                      Nenhum contato encontrado
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <motion.button
                        key={contact.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleStartWithContact(contact)}
                        className={cn(
                          "w-full p-3 rounded-lg flex items-center gap-3 transition-colors text-left",
                          isDarkMode 
                            ? "hover:bg-[#2a3942]" 
                            : "hover:bg-gray-100"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium text-sm">
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}>
                            {contact.name}
                          </p>
                          <p className={cn(
                            "text-sm truncate",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}>
                            {contact.phone}
                          </p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Phone Input */}
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-700"
                  )}>
                    Número do WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                    )} />
                    <input
                      type="tel"
                      placeholder="+55 99 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                      className={cn(
                        "w-full h-10 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]/50",
                        isDarkMode 
                          ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                          : "bg-gray-100 text-gray-900 placeholder-gray-400"
                      )}
                    />
                  </div>
                </div>

                {/* Name Input (Optional) */}
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-700"
                  )}>
                    Nome (opcional)
                  </label>
                  <div className="relative">
                    <User className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                    )} />
                    <input
                      type="text"
                      placeholder="Nome do contato"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={cn(
                        "w-full h-10 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]/50",
                        isDarkMode 
                          ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                          : "bg-gray-100 text-gray-900 placeholder-gray-400"
                      )}
                    />
                  </div>
                </div>

                {/* Start Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartWithPhone}
                  disabled={!phoneNumber.trim()}
                  className={cn(
                    "w-full h-11 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
                    phoneNumber.trim()
                      ? "bg-[#00a884] text-white hover:bg-[#00a884]/90"
                      : isDarkMode 
                        ? "bg-[#2a3942] text-[#8696a0] cursor-not-allowed" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  Iniciar Conversa
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
