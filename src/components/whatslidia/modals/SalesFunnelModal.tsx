"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import {
  X,
  TrendingUp,
  Target,
  DollarSign,
  Award,
  User,
  FileText,
  Send,
  AlertCircle,
  Check,
  ChevronRight,
} from "lucide-react";

// Zod Schema
const PipelineSchema = z.object({
  stage: z.enum(["new", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]),
  probability: z.number().min(0).max(100),
  estimatedValue: z.number().min(0),
  notes: z.string().optional(),
});

type PipelineData = z.infer<typeof PipelineSchema>;

interface SalesFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  isDarkMode: boolean;
  onUpdatePipeline?: (data: PipelineData) => Promise<void>;
}

const funnelStages = [
  { id: "new", label: "Novo Lead", color: "#3b82f6", icon: User },
  { id: "qualified", label: "Qualificado", color: "#06b6d4", icon: Target },
  { id: "proposal", label: "Proposta Enviada", color: "#8b5cf6", icon: FileText },
  { id: "negotiation", label: "Em Negociação", color: "#f59e0b", icon: TrendingUp },
  { id: "closed_won", label: "Fechado (Ganho)", color: "#10b981", icon: Award },
  { id: "closed_lost", label: "Fechado (Perdido)", color: "#ef4444", icon: X },
];

export function SalesFunnelModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  isDarkMode,
  onUpdatePipeline,
}: SalesFunnelModalProps) {
  const [stage, setStage] = useState<PipelineData["stage"]>("new");
  const [probability, setProbability] = useState(10);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update probability based on stage
  useEffect(() => {
    const stageProbabilities: Record<string, number> = {
      new: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };
    setProbability(stageProbabilities[stage] || 10);
  }, [stage]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage("new");
      setProbability(10);
      setEstimatedValue("");
      setNotes("");
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

  const handleSave = async () => {
    setError(null);

    // Validate with Zod
    const result = PipelineSchema.safeParse({
      stage,
      probability,
      estimatedValue: parseFloat(estimatedValue) || 0,
      notes: notes || undefined,
    });

    if (!result.success) {
      setError("Verifique os dados do formulário");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (onUpdatePipeline) {
        await onUpdatePipeline(result.data);
      }

      toast.success("Funil de vendas atualizado!", {
        description: `O estágio de ${contactName} foi atualizado para "${funnelStages.find((s) => s.id === stage)?.label}".`,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao atualizar funil de vendas");
      toast.error("Erro ao salvar", {
        description: "Não foi possível atualizar o funil de vendas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d]/g, "")) / 100;
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const currentStage = funnelStages.find((s) => s.id === stage);

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
                    isDarkMode ? "bg-blue-500/20" : "bg-blue-100"
                  )}
                >
                  <TrendingUp
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
                    Funil de Vendas
                  </h2>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {contactName}
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
                    Funil Atualizado!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    Os dados do funil de vendas foram salvos com sucesso.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Pipeline Visualization */}
                  <div className="space-y-3">
                    <label
                      className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      <Target className="w-4 h-4" />
                      Estágio do Funil
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {funnelStages.map((funnelStage) => {
                        const Icon = funnelStage.icon;
                        return (
                          <motion.button
                            key={funnelStage.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStage(funnelStage.id as PipelineData["stage"])}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                              stage === funnelStage.id
                                ? isDarkMode
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-blue-500 bg-blue-50"
                                : isDarkMode
                                ? "border-[#374045] hover:border-[#4a545a]"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${funnelStage.color}20` }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: funnelStage.color }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs font-medium flex-1",
                                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                              )}
                            >
                              {funnelStage.label}
                            </span>
                            {stage === funnelStage.id && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Probability and Value */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Probability */}
                    <div className="space-y-3">
                      <label
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        <Target className="w-4 h-4" />
                        Probabilidade
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={probability}
                          onChange={(e) => setProbability(parseInt(e.target.value) || 0)}
                          disabled={isLoading}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all pr-10",
                            "text-base",
                            isDarkMode
                              ? "bg-[#2a3942] border-[#374045] text-[#e9edef] focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        />
                        <span
                          className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 text-sm",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          %
                        </span>
                      </div>
                      {/* Probability Bar */}
                      <div
                        className={cn(
                          "h-2 rounded-full overflow-hidden",
                          isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                        )}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${probability}%` }}
                          transition={{ duration: 0.3 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              probability >= 75
                                ? "#10b981"
                                : probability >= 50
                                ? "#f59e0b"
                                : probability >= 25
                                ? "#3b82f6"
                                : "#ef4444",
                          }}
                        />
                      </div>
                    </div>

                    {/* Estimated Value */}
                    <div className="space-y-3">
                      <label
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        <DollarSign className="w-4 h-4" />
                        Valor Estimado
                      </label>
                      <input
                        type="text"
                        value={estimatedValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, "");
                          setEstimatedValue(value);
                        }}
                        placeholder="R$ 0,00"
                        disabled={isLoading}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all",
                          "text-base",
                          isDarkMode
                            ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-blue-500"
                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      />
                      {estimatedValue && (
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-[#00a884]" : "text-green-600"
                          )}
                        >
                          {formatCurrency(estimatedValue)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <label
                      className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Observações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isLoading}
                      placeholder="Adicione observações sobre o negócio..."
                      rows={3}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none",
                        "text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-blue-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    />
                  </div>

                  {/* Summary Card */}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={cn(
                            "text-xs",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Estágio Atual
                        </p>
                        <p
                          className={cn(
                            "font-medium",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                          style={{ color: currentStage?.color }}
                        >
                          {currentStage?.label}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-5 h-5",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                        )}
                      />
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-xs",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Valor Potencial
                        </p>
                        <p
                          className={cn(
                            "font-medium",
                            isDarkMode ? "text-[#00a884]" : "text-green-600"
                          )}
                        >
                          {estimatedValue
                            ? formatCurrency(estimatedValue)
                            : "R$ 0,00"}
                        </p>
                      </div>
                    </div>
                  </motion.div>

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
                      onClick={handleSave}
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
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Salvar
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
