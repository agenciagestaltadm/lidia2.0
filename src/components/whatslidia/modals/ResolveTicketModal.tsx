"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  CheckCircle,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";

interface ResolveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  isDarkMode: boolean;
  onResolve?: (notes?: string) => Promise<void>;
}

export function ResolveTicketModal({
  isOpen,
  onClose,
  conversationId,
  isDarkMode,
  onResolve,
}: ResolveTicketModalProps) {
  const [addNotes, setAddNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAddNotes(false);
      setNotes("");
      setError(null);
      setSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
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
  }, [isOpen, onClose, isLoading]);

  const handleResolve = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (onResolve) {
        await onResolve(addNotes ? notes : undefined);
      }

      // Simulate success
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao resolver ticket. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
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
                    isDarkMode ? "bg-[#00a884]/20" : "bg-green-100"
                  )}
                >
                  <CheckCircle
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-[#00a884]" : "text-green-600"
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
                    Resolver Ticket
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
                    Ticket Resolvido!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O atendimento foi movido para a fila de resolvidos.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Success Icon */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center",
                        isDarkMode ? "bg-[#00a884]/10" : "bg-green-50"
                      )}
                    >
                      <CheckCircle
                        className={cn(
                          "w-10 h-10",
                          isDarkMode ? "text-[#00a884]" : "text-green-600"
                        )}
                      />
                    </motion.div>
                  </div>

                  {/* Confirmation Text */}
                  <div className="text-center mb-6">
                    <h3
                      className={cn(
                        "text-lg font-semibold mb-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      Marcar como resolvido?
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      O ticket será movido para a fila de atendimentos
                      resolvidos com timestamp automático.
                    </p>
                  </div>

                  {/* Add Notes Checkbox */}
                  <div className="mb-4">
                    <label
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                        isDarkMode
                          ? "hover:bg-[#2a3942]"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={addNotes}
                        onChange={(e) => setAddNotes(e.target.checked)}
                        disabled={isLoading}
                        className={cn(
                          "w-5 h-5 rounded border-2 transition-colors",
                          isDarkMode
                            ? "border-[#374045] bg-[#2a3942] checked:bg-[#00a884] checked:border-[#00a884]"
                            : "border-gray-300 checked:bg-[#00a884] checked:border-[#00a884]"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        Adicionar notas de resolução
                      </span>
                    </label>
                  </div>

                  {/* Notes Textarea */}
                  <AnimatePresence>
                    {addNotes && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={isLoading}
                          placeholder="Descreva como o problema foi resolvido..."
                          rows={3}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none",
                            "text-sm",
                            isDarkMode
                              ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884]"
                              : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#00a884]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      onClick={onClose}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isDarkMode
                          ? "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleResolve}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        "bg-[#00a884] text-white hover:bg-[#00a884]/90",
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
                          Resolvendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Resolver
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
