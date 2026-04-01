"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Search, Check } from "lucide-react";
import type { WhatsAppContact } from "@/types/whatsapp";

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (phones: string[]) => void;
  contacts: WhatsAppContact[];
  loading?: boolean;
  isDarkMode?: boolean;
}

export function ForwardModal({
  isOpen,
  onClose,
  onForward,
  contacts,
  loading = false,
  isDarkMode = true,
}: ForwardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());

  // Filtra contatos
  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const handleToggleContact = (phone: string) => {
    const newSelected = new Set(selectedPhones);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedPhones(newSelected);
  };

  const handleForward = () => {
    if (selectedPhones.size > 0) {
      onForward(Array.from(selectedPhones));
      setSelectedPhones(new Set());
      setSearchQuery("");
      onClose();
    }
  };

  const handleSelectAll = () => {
    if (selectedPhones.size === filteredContacts.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(filteredContacts.map((c) => c.phone)));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "rounded-lg shadow-xl max-w-md w-full mx-4",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between p-4 border-b",
                isDarkMode ? "border-[#374045]" : "border-gray-200"
              )}
            >
              <h2
                className={cn(
                  "text-lg font-semibold",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}
              >
                Encaminhar para
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isDarkMode
                    ? "hover:bg-[#2a3942] text-[#8696a0]"
                    : "hover:bg-gray-100 text-gray-500"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[#374045]">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
                )}
              >
                <Search className="w-4 h-4 text-[#8696a0]" />
                <input
                  type="text"
                  placeholder="Buscar contato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "flex-1 bg-transparent outline-none text-sm",
                    isDarkMode
                      ? "text-[#e9edef] placeholder-[#8696a0]"
                      : "text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>
            </div>

            {/* Select All */}
            {filteredContacts.length > 0 && (
              <div className="px-4 py-2 border-b border-[#374045]">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    selectedPhones.size === filteredContacts.length
                      ? "text-[#00a884]"
                      : isDarkMode
                      ? "text-[#8696a0] hover:text-[#e9edef]"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {selectedPhones.size === filteredContacts.length
                    ? "Desselecionar tudo"
                    : "Selecionar tudo"}
                </button>
              </div>
            )}

            {/* Contacts List */}
            <div
              className={cn(
                "max-h-96 overflow-y-auto",
                isDarkMode ? "bg-[#1f2c33]" : "bg-white"
              )}
            >
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.phone}
                    onClick={() => handleToggleContact(contact.phone)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 transition-colors border-b",
                      isDarkMode
                        ? "border-[#2a3942] hover:bg-[#2a3942]"
                        : "border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedPhones.has(contact.phone)
                          ? "bg-[#00a884] border-[#00a884]"
                          : isDarkMode
                          ? "border-[#8696a0]"
                          : "border-gray-300"
                      )}
                    >
                      {selectedPhones.has(contact.phone) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className={cn(
                          "font-medium truncate",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        {contact.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs truncate",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        {contact.phone}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div
                  className={cn(
                    "p-8 text-center",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}
                >
                  Nenhum contato encontrado
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={cn(
                "flex gap-2 p-4 border-t",
                isDarkMode ? "border-[#374045]" : "border-gray-200"
              )}
            >
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  isDarkMode
                    ? "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                )}
              >
                Cancelar
              </button>
              <button
                onClick={handleForward}
                disabled={selectedPhones.size === 0 || loading}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  selectedPhones.size > 0 && !loading
                    ? "bg-[#00a884] text-white hover:bg-[#00a884]/90"
                    : "bg-[#374045] text-[#8696a0] cursor-not-allowed"
                )}
              >
                {loading ? "Encaminhando..." : "Encaminhar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
