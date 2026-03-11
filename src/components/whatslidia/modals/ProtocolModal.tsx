"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  X,
  FileCheck,
  Hash,
  Clock,
  Send,
  Copy,
  Check,
  AlertCircle,
  History,
  User,
  MessageSquare,
} from "lucide-react";

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  contactName: string;
  isDarkMode: boolean;
  onSendProtocol?: (protocol: string, message: string) => Promise<void>;
}

interface ProtocolHistory {
  code: string;
  timestamp: Date;
  sentBy: string;
}

// Mock history - in production this would come from API
const mockHistory: ProtocolHistory[] = [
  { code: "ABC12345", timestamp: new Date(Date.now() - 86400000 * 2), sentBy: "Ana Silva" },
  { code: "XYZ98765", timestamp: new Date(Date.now() - 86400000 * 5), sentBy: "Carlos Santos" },
];

export function ProtocolModal({
  isOpen,
  onClose,
  conversationId,
  contactName,
  isDarkMode,
  onSendProtocol,
}: ProtocolModalProps) {
  const [protocol, setProtocol] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Generate protocol on open
  useEffect(() => {
    if (isOpen) {
      generateProtocol();
      setError(null);
      setSuccess(false);
      setCopied(false);
      setShowHistory(false);
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

  const generateProtocol = () => {
    // Generate 8 character alphanumeric code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setProtocol(result);
  };

  const formatProtocolMessage = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return `🎫 *PROTOCOLO DE ATENDIMENTO*

📋 Código: *${protocol}*
📅 Data: ${dateStr}
🕐 Horário: ${timeStr}
👤 Cliente: ${contactName}

✅ Seu atendimento foi registrado em nosso sistema.
⏰ Retornaremos o mais breve possível.

_Obrigado por entrar em contato!_`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatProtocolMessage());
      setCopied(true);
      toast.success("Protocolo copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar");
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSendProtocol) {
        await onSendProtocol(protocol, formatProtocolMessage());
      }

      toast.success("Protocolo enviado!", {
        description: `O protocolo ${protocol} foi enviado para ${contactName}.`,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Erro ao enviar protocolo");
      toast.error("Erro ao enviar", {
        description: "Não foi possível enviar o protocolo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
                    isDarkMode ? "bg-[#00a884]/20" : "bg-green-100"
                  )}
                >
                  <FileCheck
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
                    Gerar Protocolo
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
                    Protocolo Enviado!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O protocolo {protocol} foi enviado com sucesso.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Protocol Code Display */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={cn(
                        "inline-flex items-center gap-3 px-6 py-4 rounded-2xl border-2",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#00a884]/50"
                          : "bg-green-50 border-green-200"
                      )}
                    >
                      <Hash
                        className={cn(
                          "w-6 h-6",
                          isDarkMode ? "text-[#00a884]" : "text-green-600"
                        )}
                      />
                      <span
                        className={cn(
                          "text-3xl font-bold tracking-wider font-mono",
                          isDarkMode ? "text-[#00a884]" : "text-green-600"
                        )}
                      >
                        {protocol}
                      </span>
                    </motion.div>
                    <p
                      className={cn(
                        "text-xs mt-3",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Código gerado automaticamente
                    </p>
                  </div>

                  {/* Message Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Preview da Mensagem
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className={cn(
                          "text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                          isDarkMode
                            ? "text-[#8696a0] hover:bg-[#374045]"
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar
                          </>
                        )}
                      </motion.button>
                    </div>
                    <div
                      className={cn(
                        "p-4 rounded-xl border whitespace-pre-wrap font-mono text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef]"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      )}
                    >
                      {formatProtocolMessage()}
                    </div>
                  </div>

                  {/* History Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                      isDarkMode
                        ? "bg-[#2a3942] hover:bg-[#374045]"
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <History
                        className={cn(
                          "w-4 h-4",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        Histórico de Protocolos
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: showHistory ? 180 : 0 }}
                      className={cn(
                        "text-sm",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      ▼
                    </motion.div>
                  </motion.button>

                  {/* History List */}
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "rounded-xl border overflow-hidden",
                          isDarkMode
                            ? "bg-[#2a3942] border-[#374045]"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        {mockHistory.map((item, index) => (
                          <div
                            key={item.code}
                            className={cn(
                              "flex items-center justify-between p-3",
                              index !== mockHistory.length - 1 &&
                                (isDarkMode
                                  ? "border-b border-[#374045]"
                                  : "border-b border-gray-200")
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Hash
                                className={cn(
                                  "w-4 h-4",
                                  isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                                )}
                              />
                              <span
                                className={cn(
                                  "font-mono text-sm font-medium",
                                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                                )}
                              >
                                {item.code}
                              </span>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                                )}
                              >
                                {formatDate(item.timestamp)}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                                )}
                              >
                                por {item.sentBy}
                              </p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      onClick={handleSend}
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
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Protocolo
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
