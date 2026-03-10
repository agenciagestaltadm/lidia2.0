"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, User, Search, Send } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (contact: { name: string; phone: string }) => void;
}

// Mock contacts - in a real app, this would come from an API or context
const mockContacts: Contact[] = [
  { id: "1", name: "João Silva", phone: "+55 11 98765-4321" },
  { id: "2", name: "Maria Santos", phone: "+55 11 91234-5678" },
  { id: "3", name: "Carlos Ferreira", phone: "+55 11 99876-5432" },
  { id: "4", name: "Ana Paula", phone: "+55 11 98765-1234" },
  { id: "5", name: "Pedro Costa", phone: "+55 11 95432-8765" },
  { id: "6", name: "Juliana Lima", phone: "+55 11 96789-0123" },
];

export function ContactPickerModal({ isOpen, onClose, isDarkMode, onSend }: ContactPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = mockContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const handleSend = () => {
    if (selectedContact) {
      onSend({ name: selectedContact.name, phone: selectedContact.phone });
      onClose();
      setSelectedContact(null);
      setSearchQuery("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Enviar Contato
                </h3>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded-full hover:bg-black/10 transition-colors",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className={cn(
              "px-4 py-3 border-b",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
              )}>
                <Search className={cn(
                  "w-4 h-4",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                )} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className={cn(
                    "flex-1 bg-transparent text-sm outline-none",
                    isDarkMode ? "text-[#e9edef] placeholder-[#8696a0]" : "text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Nenhum contato encontrado
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                        selectedContact?.id === contact.id
                          ? isDarkMode
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : "bg-blue-50 border border-blue-200"
                          : isDarkMode
                            ? "hover:bg-[#2a3942]"
                            : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                        isDarkMode ? "bg-[#2a3942] text-[#e9edef]" : "bg-gray-200 text-gray-700"
                      )}>
                        {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "font-medium text-sm",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}>
                          {contact.name}
                        </p>
                        <p className={cn(
                          "text-xs",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}>
                          {contact.phone}
                        </p>
                      </div>
                      {selectedContact?.id === contact.id && (
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          "bg-blue-500 text-white"
                        )}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn(
              "px-4 py-3 border-t flex items-center justify-end gap-2",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isDarkMode 
                    ? "text-[#e9edef] hover:bg-[#2a3942]" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedContact}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  "bg-blue-500 text-white hover:bg-blue-600",
                  !selectedContact && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
