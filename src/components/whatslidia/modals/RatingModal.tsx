"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  X,
  Star,
  ThumbsUp,
  MessageCircle,
  BarChart3,
  Send,
  AlertCircle,
  Check,
  TrendingUp,
  Users,
} from "lucide-react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  contactName: string;
  isDarkMode: boolean;
  onRequestRating?: (type: "nps" | "stars", message?: string) => Promise<void>;
}

type RatingType = "nps" | "stars";

interface RatingStats {
  totalRequests: number;
  responses: number;
  averageScore: number;
  npsScore: number;
}

// Mock stats - in production this would come from API
const mockStats: RatingStats = {
  totalRequests: 12,
  responses: 8,
  averageScore: 4.2,
  npsScore: 75,
};

export function RatingModal({
  isOpen,
  onClose,
  conversationId,
  contactName,
  isDarkMode,
  onRequestRating,
}: RatingModalProps) {
  const [ratingType, setRatingType] = useState<RatingType>("stars");
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRatingType("stars");
      setCustomMessage("");
      setError(null);
      setSuccess(false);
      setHoveredStar(0);
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

  const generateRatingMessage = () => {
    if (ratingType === "stars") {
      return (
        customMessage ||
        `Olá ${contactName}! 👋\n\nComo foi sua experiência com nosso atendimento?\n\nAvalie de 1 a 5 estrelas respondendo a esta mensagem.\n\n⭐ = Muito insatisfeito\n⭐⭐ = Insatisfeito\n⭐⭐⭐ = Neutro\n⭐⭐⭐⭐ = Satisfeito\n⭐⭐⭐⭐⭐ = Muito satisfeito\n\nSua opinião é muito importante para nós! 🙏`
      );
    } else {
      return (
        customMessage ||
        `Olá ${contactName}! 👋\n\nEm uma escala de 0 a 10, qual a probabilidade de você recomendar nosso atendimento para um amigo ou colega?\n\n0-6 = Precisamos melhorar\n7-8 = Estamos no caminho certo\n9-10 = Excelente!\n\nSua opinião é muito importante para nós! 🙏`
      );
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onRequestRating) {
        await onRequestRating(ratingType, customMessage || undefined);
      }

      toast.success("Avaliação solicitada!", {
        description: `Pedido de avaliação enviado para ${contactName}.`,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Erro ao solicitar avaliação");
      toast.error("Erro ao enviar", {
        description: "Não foi possível solicitar a avaliação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StarIcon = ({ filled, index }: { filled: boolean; index: number }) => (
    <motion.button
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onMouseEnter={() => setHoveredStar(index)}
      onMouseLeave={() => setHoveredStar(0)}
      className="focus:outline-none"
    >
      <Star
        className={cn(
          "w-8 h-8 transition-colors",
          filled
            ? "fill-yellow-400 text-yellow-400"
            : isDarkMode
            ? "text-[#374045]"
            : "text-gray-300"
        )}
      />
    </motion.button>
  );

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
              "relative z-10 w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden",
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
                    isDarkMode ? "bg-yellow-500/20" : "bg-yellow-100"
                  )}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-yellow-400" : "text-yellow-600"
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
                    Solicitar Avaliação
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
                    Solicitação Enviada!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O pedido de avaliação foi enviado para {contactName}.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Rating Type Selection */}
                  <div className="space-y-3">
                    <label
                      className={cn(
                        "text-sm font-medium",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      Tipo de Avaliação
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRatingType("stars")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          ratingType === "stars"
                            ? isDarkMode
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-yellow-500 bg-yellow-50"
                            : isDarkMode
                            ? "border-[#374045] hover:border-[#4a545a]"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i <= 3
                                  ? "fill-yellow-400 text-yellow-400"
                                  : isDarkMode
                                  ? "text-[#374045]"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          Estrelas (1-5)
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRatingType("nps")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          ratingType === "nps"
                            ? isDarkMode
                              ? "border-[#00a884] bg-[#00a884]/10"
                              : "border-[#00a884] bg-green-50"
                            : isDarkMode
                            ? "border-[#374045] hover:border-[#4a545a]"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div
                          className={cn(
                            "text-lg font-bold",
                            isDarkMode ? "text-[#00a884]" : "text-green-600"
                          )}
                        >
                          0-10
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          NPS (Net Promoter Score)
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Preview Stars (for stars type) */}
                  {ratingType === "stars" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center gap-2 py-2"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          filled={star <= (hoveredStar || 3)}
                          index={star}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* NPS Scale Preview (for NPS type) */}
                  {ratingType === "nps" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-xs">
                        <span
                          className={cn(
                            "text-red-400 font-medium",
                            isDarkMode ? "text-red-400" : "text-red-600"
                          )}
                        >
                          Detratores (0-6)
                        </span>
                        <span
                          className={cn(
                            "text-yellow-400 font-medium",
                            isDarkMode ? "text-yellow-400" : "text-yellow-600"
                          )}
                        >
                          Neutros (7-8)
                        </span>
                        <span
                          className={cn(
                            "text-green-400 font-medium",
                            isDarkMode ? "text-green-400" : "text-green-600"
                          )}
                        >
                          Promotores (9-10)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 11 }, (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 h-8 rounded flex items-center justify-center text-xs font-medium",
                              i <= 6
                                ? isDarkMode
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-red-100 text-red-600"
                                : i <= 8
                                ? isDarkMode
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-600"
                                : isDarkMode
                                ? "bg-green-500/20 text-green-400"
                                : "bg-green-100 text-green-600"
                            )}
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Custom Message */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Mensagem Personalizada (opcional)
                      </label>
                    </div>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Digite uma mensagem personalizada ou deixe em branco para usar o padrão..."
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-yellow-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500"
                      )}
                    />
                    <p
                      className={cn(
                        "text-xs",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Preview: {customMessage ? "Personalizado" : "Padrão do sistema"}
                    </p>
                  </div>

                  {/* Stats Card */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border",
                      isDarkMode
                        ? "bg-[#2a3942]/50 border-[#374045]"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3
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
                        Estatísticas de Avaliações
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            isDarkMode ? "text-[#00a884]" : "text-green-600"
                          )}
                        >
                          {mockStats.totalRequests}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Solicitações
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          )}
                        >
                          {mockStats.responses}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Respostas
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            isDarkMode ? "text-yellow-400" : "text-yellow-600"
                          )}
                        >
                          {mockStats.averageScore.toFixed(1)}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Média
                        </p>
                      </div>
                    </div>
                  </div>

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
                        "bg-yellow-500 text-white hover:bg-yellow-600",
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
                          Solicitar Avaliação
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
