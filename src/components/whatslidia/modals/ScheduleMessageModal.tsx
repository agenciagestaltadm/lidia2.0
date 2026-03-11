"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  Check,
} from "lucide-react";

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  isDarkMode: boolean;
  onSchedule?: (data: { date: Date; message: string }) => Promise<void>;
}

export function ScheduleMessageModal({
  isOpen,
  onClose,
  conversationId,
  isDarkMode,
  onSchedule,
}: ScheduleMessageModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default date to 1 hour from now
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      oneHourFromNow.setMinutes(0);
      setSelectedDate(formatDateTimeLocal(oneHourFromNow));
      setMessage("");
      setError(null);
      setSuccess(false);
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

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateForm = (): boolean => {
    if (!selectedDate) {
      setError("Selecione uma data e hora para o agendamento");
      return false;
    }

    const scheduledDate = new Date(selectedDate);
    const now = new Date();

    if (scheduledDate <= now) {
      setError("A data deve ser no futuro");
      return false;
    }

    if (!message.trim()) {
      setError("Digite uma mensagem para agendar");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSchedule) {
        await onSchedule({
          date: new Date(selectedDate),
          message: message.trim(),
        });
      }

      // Simulate success
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao agendar mensagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPreviewDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                    isDarkMode ? "bg-[#00a884]/20" : "bg-[#00a884]/10"
                  )}
                >
                  <Calendar
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-[#00a884]" : "text-[#00a884]"
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
                    Agendar Mensagem
                  </h2>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    Programe o envio automático
                  </p>
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
            <div className="p-6 space-y-6">
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
                    Mensagem Agendada!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    A mensagem será enviada no horário programado.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Date and Time Selection */}
                  <div className="space-y-3">
                    <label
                      className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Data e Hora
                    </label>
                    <input
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all",
                        "text-base",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] focus:border-[#00a884]"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    />
                  </div>

                  {/* Message Input */}
                  <div className="space-y-3">
                    <label
                      className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      <Send className="w-4 h-4" />
                      Mensagem
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      placeholder="Digite a mensagem a ser agendada..."
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none",
                        "text-base",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884]"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#00a884]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    />
                    <div
                      className={cn(
                        "text-xs text-right",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      {message.length} caracteres
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedDate && message && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-xl border",
                        isDarkMode
                          ? "bg-[#2a3942]/50 border-[#374045]"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-medium mb-2",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        Preview do agendamento
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          isDarkMode ? "text-[#00a884]" : "text-[#00a884]"
                        )}
                      >
                        {formatPreviewDate(selectedDate)}
                      </p>
                      <p
                        className={cn(
                          "text-sm mt-2 line-clamp-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        &ldquo;{message}&rdquo;
                      </p>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl",
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
                  <div className="flex gap-3 pt-2">
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
                      onClick={handleSchedule}
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
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Agendar
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
