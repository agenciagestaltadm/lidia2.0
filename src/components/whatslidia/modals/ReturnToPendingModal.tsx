"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  RotateCcw,
  AlertCircle,
  Check,
  Pause,
} from "lucide-react";

interface ReturnToPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  isDarkMode: boolean;
  onReturn?: () => Promise<void>;
}

export function ReturnToPendingModal({
  isOpen,
  onClose,
  conversationId,
  isDarkMode,
  onReturn,
}: ReturnToPendingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
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

  const handleReturn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (onReturn) {
        await onReturn();
      }

      // Simulate success
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao retornar ticket para pendentes. Tente novamente.");
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
              "relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden",
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
                    isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
                  )}
                >
                  <RotateCcw
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-amber-400" : "text-amber-600"
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
                    Retornar para Pendentes
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
                    Ticket Retornado!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O atendimento foi movido para a fila de pendentes.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Warning Icon */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center",
                        isDarkMode ? "bg-amber-500/10" : "bg-amber-50"
                      )}
                    >
                      <Pause
                        className={cn(
                          "w-10 h-10",
                          isDarkMode ? "text-amber-400" : "text-amber-600"
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
                      Tem certeza?
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      O ticket será retornado para a fila de atendimentos
                      pendentes e poderá ser assumido por outro agente.
                    </p>
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
                      onClick={handleReturn}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        isDarkMode
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200",
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
                            className={cn(
                              "w-4 h-4 border-2 border-t-transparent rounded-full",
                              isDarkMode
                                ? "border-amber-400"
                                : "border-amber-700"
                            )}
                          />
                          Processando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Retornar
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
