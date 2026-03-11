"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  X,
  FileDown,
  FileText,
  Printer,
  Download,
  Eye,
  AlertCircle,
  Check,
  Calendar,
  User,
  MessageSquare,
  Hash,
  Shield,
} from "lucide-react";
import type { Message, Contact } from "@/types/chat";

interface ExportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  contactName: string;
  contact: Contact;
  messages: Message[];
  isDarkMode: boolean;
}

export function ExportChatModal({
  isOpen,
  onClose,
  conversationId,
  contactName,
  contact,
  messages,
  isDarkMode,
}: ExportChatModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setPreviewUrl(null);
      setShowPreview(false);
      setIncludeMedia(true);
      setIncludeTimestamp(true);
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generatePDF = async (download = false): Promise<string | null> => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Header with logo area
      doc.setFillColor(0, 168, 132);
      doc.rect(0, 0, pageWidth, 50, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("HISTÓRICO DE CONVERSA", margin, 30);

      // Reset color and position
      doc.setTextColor(0, 0, 0);
      y = 65;

      // Metadata Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMAÇÕES DO ATENDIMENTO", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const metadata = [
        [`Protocolo:`, conversationId.slice(0, 8).toUpperCase()],
        [`Cliente:`, contactName],
        [`Telefone:`, contact.phone],
        [`Data de Exportação:`, formatDate(new Date())],
        [`Total de Mensagens:`, messages.length.toString()],
      ];

      metadata.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 40, y);
        y += 6;
      });

      y += 10;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Messages Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("HISTÓRICO DE MENSAGENS", margin, y);
      y += 15;

      // Messages
      messages.forEach((msg, index) => {
        // Check for page break
        if (y > pageHeight - 40) {
          doc.addPage();
          y = margin;
        }

        const sender = msg.isFromMe ? "Atendente" : contactName;
        const timestamp = includeTimestamp ? formatDate(msg.timestamp) : "";

        // Message bubble background
        if (msg.isFromMe) {
          doc.setFillColor(0, 168, 132);
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(240, 240, 240);
          doc.setTextColor(0, 0, 0);
        }

        // Calculate text dimensions
        doc.setFontSize(9);
        const textLines = doc.splitTextToSize(
          msg.content,
          pageWidth - margin * 2 - 20
        );
        const textHeight = textLines.length * 5;

        // Draw bubble
        const bubbleWidth = pageWidth - margin * 2;
        doc.roundedRect(margin, y - 2, bubbleWidth, textHeight + 12, 3, 3, "F");

        // Sender name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(sender, margin + 5, y + 4);

        // Message content
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(textLines, margin + 5, y + 10);

        // Timestamp
        if (includeTimestamp) {
          doc.setFontSize(7);
          doc.text(timestamp, margin + bubbleWidth - 50, y + 4);
        }

        // Media indicator
        if (includeMedia && msg.type !== "text") {
          doc.setFontSize(7);
          doc.text(`[${msg.type.toUpperCase()}]`, margin + 5, y + textHeight + 10);
        }

        y += textHeight + 20;
      });

      // Footer with signature
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      } else {
        y += 20;
      }

      doc.setDrawColor(0, 168, 132);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Este documento é uma exportação digital do histórico de conversa.",
        margin,
        y
      );
      y += 6;
      doc.text(
        `Gerado em ${formatDate(new Date())} - Sistema LIDIA`,
        margin,
        y
      );

      // Digital signature hash
      y += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const signature = btoa(
        `${conversationId}${Date.now()}${messages.length}`
      ).slice(0, 32);
      doc.text(`Assinatura Digital: ${signature}`, margin, y);

      if (download) {
        const filename = `conversa_${contactName.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        doc.save(filename);
        return null;
      } else {
        return doc.output("datauristring");
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      throw new Error("Erro ao gerar PDF");
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = await generatePDF(false);
      setPreviewUrl(url);
      setShowPreview(true);
      toast.success("Preview gerado!");
    } catch (err) {
      setError("Erro ao gerar preview do PDF");
      toast.error("Erro ao gerar preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await generatePDF(true);
      toast.success("PDF baixado com sucesso!");
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro ao baixar PDF");
      toast.error("Erro ao baixar");
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
              "relative z-10 w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden",
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
                    isDarkMode ? "bg-purple-500/20" : "bg-purple-100"
                  )}
                >
                  <FileDown
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-purple-400" : "text-purple-600"
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
                    Exportar Conversa
                  </h2>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {messages.length} mensagens
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
                    Exportação Concluída!
                  </h3>
                  <p
                    className={cn(
                      "text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    O PDF foi gerado e baixado com sucesso.
                  </p>
                </motion.div>
              ) : showPreview && previewUrl ? (
                <>
                  {/* PDF Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        <Eye className="w-4 h-4" />
                        Preview do PDF
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPreview(false)}
                        className={cn(
                          "text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                          isDarkMode
                            ? "text-[#8696a0] hover:bg-[#374045]"
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        <X className="w-3 h-3" />
                        Fechar Preview
                      </motion.button>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border overflow-hidden",
                        isDarkMode ? "border-[#374045]" : "border-gray-200"
                      )}
                    >
                      <iframe
                        src={previewUrl}
                        className="w-full h-80"
                        title="PDF Preview"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-colors",
                        isDarkMode
                          ? "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        "bg-purple-500 text-white hover:bg-purple-600",
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
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Baixar PDF
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Options */}
                  <div className="space-y-4">
                    <label
                      className={cn(
                        "text-sm font-medium",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      Opções de Exportação
                    </label>

                    <div className="space-y-3">
                      {/* Include Media */}
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
                          checked={includeMedia}
                          onChange={(e) => setIncludeMedia(e.target.checked)}
                          className={cn(
                            "w-5 h-5 rounded border-2 transition-colors",
                            isDarkMode
                              ? "border-[#374045] bg-[#2a3942] checked:bg-purple-500 checked:border-purple-500"
                              : "border-gray-300 checked:bg-purple-500 checked:border-purple-500"
                          )}
                        />
                        <div className="flex-1">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                            )}
                          >
                            Incluir referências de mídia
                          </span>
                          <p
                            className={cn(
                              "text-xs",
                              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                            )}
                          >
                            Adicionar indicação de fotos, vídeos e documentos
                          </p>
                        </div>
                      </label>

                      {/* Include Timestamp */}
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
                          checked={includeTimestamp}
                          onChange={(e) =>
                            setIncludeTimestamp(e.target.checked)
                          }
                          className={cn(
                            "w-5 h-5 rounded border-2 transition-colors",
                            isDarkMode
                              ? "border-[#374045] bg-[#2a3942] checked:bg-purple-500 checked:border-purple-500"
                              : "border-gray-300 checked:bg-purple-500 checked:border-purple-500"
                          )}
                        />
                        <div className="flex-1">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                            )}
                          >
                            Incluir data e hora
                          </span>
                          <p
                            className={cn(
                              "text-xs",
                              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                            )}
                          >
                            Mostrar timestamp em cada mensagem
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Info Card */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border",
                      isDarkMode
                        ? "bg-[#2a3942]/50 border-[#374045]"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <FileText
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
                        Resumo do Documento
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User
                          className={cn(
                            "w-4 h-4",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}
                        />
                        <span
                          className={cn(
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Cliente:
                        </span>
                        <span
                          className={cn(
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          {contactName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare
                          className={cn(
                            "w-4 h-4",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}
                        />
                        <span
                          className={cn(
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Mensagens:
                        </span>
                        <span
                          className={cn(
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          {messages.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash
                          className={cn(
                            "w-4 h-4",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}
                        />
                        <span
                          className={cn(
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Protocolo:
                        </span>
                        <span
                          className={cn(
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          {conversationId.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar
                          className={cn(
                            "w-4 h-4",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}
                        />
                        <span
                          className={cn(
                            isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                          )}
                        >
                          Exportado em:
                        </span>
                        <span
                          className={cn(
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                        >
                          {formatDate(new Date())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl",
                      isDarkMode
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-purple-50 text-purple-600"
                    )}
                  >
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Documento Assinado Digitalmente</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isDarkMode ? "text-purple-300" : "text-purple-500"
                        )}
                      >
                        O PDF inclui uma assinatura digital única para verificação de autenticidade.
                      </p>
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
                      onClick={handlePreview}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        isDarkMode
                          ? "bg-[#374045] text-[#e9edef] hover:bg-[#4a545a]"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300",
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
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Preview
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        "bg-purple-500 text-white hover:bg-purple-600",
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
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Baixar PDF
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
