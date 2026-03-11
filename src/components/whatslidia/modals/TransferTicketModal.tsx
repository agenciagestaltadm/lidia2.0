"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  UserPlus,
  Search,
  AlertCircle,
  Check,
  ArrowRightLeft,
  User,
  Circle,
} from "lucide-react";

// Mock users data - in production this would come from API
const mockUsers = [
  { id: "1", name: "Ana Silva", role: "Agente", isOnline: true, avatar: null },
  { id: "2", name: "Carlos Santos", role: "Gerente", isOnline: true, avatar: null },
  { id: "3", name: "Maria Oliveira", role: "Agente", isOnline: false, avatar: null },
  { id: "4", name: "Pedro Costa", role: "Agente", isOnline: true, avatar: null },
  { id: "5", name: "Juliana Lima", role: "Supervisor", isOnline: false, avatar: null },
  { id: "6", name: "Roberto Ferreira", role: "Agente", isOnline: true, avatar: null },
  { id: "7", name: "Fernanda Souza", role: "Agente", isOnline: false, avatar: null },
  { id: "8", name: "Lucas Mendes", role: "Gerente", isOnline: true, avatar: null },
];

interface User {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  avatar?: string | null;
}

interface TransferTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  isDarkMode: boolean;
  currentUserId?: string;
  companyId?: string;
  onTransfer?: (userId: string, userName: string) => Promise<void>;
}

export function TransferTicketModal({
  isOpen,
  onClose,
  conversationId,
  isDarkMode,
  currentUserId,
  onTransfer,
}: TransferTicketModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter users based on search and exclude current user
  const filteredUsers = useMemo(() => {
    return mockUsers
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        );
      });
  }, [searchQuery, currentUserId]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUser(null);
      setError(null);
      setSuccess(false);
      setShowConfirm(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        if (showConfirm) {
          setShowConfirm(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isLoading, showConfirm]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const handleTransfer = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onTransfer) {
        await onTransfer(selectedUser.id, selectedUser.name);
      }

      // Simulate success
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao transferir ticket. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden",
              isDarkMode
                ? "bg-[#1f2c33] border border-[#2a2a2a]"
                : "bg-white border border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-6 py-4 border-b",
                isDarkMode
                  ? "bg-[#1f2c33] border-[#2a2a2a]"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isDarkMode ? "bg-blue-500/20" : "bg-blue-100"
                  )}
                >
                  <UserPlus
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    )}
                  />
                </div>
                <div>
                  <h2
                    className={cn(
                      "font-semibold text-lg",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    Transferir Atendimento
                  </h2>
                </div>
              </div>
              {!isLoading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDarkMode
                      ? "text-[#aebac1] hover:bg-[#2a3942]"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                      isDarkMode ? "bg-[#00a884]/20" : "bg-green-100"
                    )}
                  >
                    <Check
                      className={cn(
                        "w-8 h-8",
                        isDarkMode ? "text-[#00a884]" : "text-green-600"
                      )}
                    />
                  </div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-2",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    Transferência Concluída!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O atendimento foi transferido com sucesso.
                  </p>
                </motion.div>
              ) : showConfirm && selectedUser ? (
                <>
                  {/* Confirmation View */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                        isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
                      )}
                    >
                      <ArrowRightLeft
                        className={cn(
                          "w-10 h-10",
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        )}
                      />
                    </motion.div>
                    <h3
                      className={cn(
                        "text-lg font-semibold mb-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      Confirmar Transferência
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Transferir este atendimento para:
                    </p>
                  </div>

                  {/* Selected User Card */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border mb-6",
                      isDarkMode
                        ? "bg-[#2a3942] border-[#374045]"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium",
                          isDarkMode
                            ? "bg-gradient-to-br from-[#00a884] to-[#005c4b] text-white"
                            : "bg-gradient-to-br from-[#00a884] to-[#005c4b] text-white"
                        )}
                      >
                        {selectedUser.avatar ? (
                          <img
                            src={selectedUser.avatar}
                            alt={selectedUser.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(selectedUser.name)
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-medium",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          {selectedUser.name}
                        </p>
                        <p
                          className={cn(
                            "text-sm",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          {selectedUser.role}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                          selectedUser.isOnline
                            ? isDarkMode
                              ? "bg-green-500/20 text-green-400"
                              : "bg-green-100 text-green-700"
                            : isDarkMode
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        <Circle
                          className={cn(
                            "w-2 h-2",
                            selectedUser.isOnline ? "fill-current" : ""
                          )}
                        />
                        {selectedUser.isOnline ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl mb-4",
                        isDarkMode
                          ? "bg-red-500/10 text-red-400"
                          : "bg-red-50 text-red-600"
                      )}
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isDarkMode
                          ? "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        "bg-blue-500 text-white hover:bg-blue-600",
                        "disabled:opacity-70 disabled:cursor-not-allowed"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Transferindo...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-4 h-4" />
                          Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Search
                      className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                      )}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar funcionário..."
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all",
                        "text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-blue-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                      )}
                    />
                  </div>

                  {/* Users List */}
                  <div
                    className={cn(
                      "max-h-64 overflow-y-auto rounded-xl border",
                      isDarkMode
                        ? "bg-[#2a3942] border-[#374045]"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center">
                        <User
                          className={cn(
                            "w-8 h-8 mx-auto mb-2",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}
                        />
                        <p
                          className={cn(
                            "text-sm",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Nenhum funcionário encontrado
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#374045]/50">
                        {filteredUsers.map((user) => (
                          <motion.button
                            key={user.id}
                            whileHover={{ backgroundColor: isDarkMode ? "rgba(55, 64, 69, 0.5)" : "rgba(0,0,0,0.02)" }}
                            onClick={() => handleSelectUser(user)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 text-left transition-colors",
                              isDarkMode
                                ? "hover:bg-[#374045]/50"
                                : "hover:bg-gray-100"
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium",
                                isDarkMode
                                  ? "bg-gradient-to-br from-[#00a884] to-[#005c4b] text-white"
                                  : "bg-gradient-to-br from-[#00a884] to-[#005c4b] text-white"
                              )}
                            >
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-medium text-sm truncate",
                                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                                )}
                              >
                                {user.name}
                              </p>
                              <p
                                className={cn(
                                  "text-xs truncate",
                                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                                )}
                              >
                                {user.role}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                                user.isOnline
                                  ? isDarkMode
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-green-100 text-green-700"
                                  : isDarkMode
                                  ? "bg-gray-500/20 text-gray-400"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              <Circle
                                className={cn(
                                  "w-1.5 h-1.5",
                                  user.isOnline ? "fill-current" : ""
                                )}
                              />
                              {user.isOnline ? "Online" : "Offline"}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <p
                    className={cn(
                      "text-xs text-center mt-4",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {filteredUsers.length} funcionário
                    {filteredUsers.length !== 1 ? "s" : ""} disponível
                    {filteredUsers.length !== 1 ? "s" : ""}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
