"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Link, Send, ExternalLink } from "lucide-react";

interface CTABuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (data: { text: string; buttonText: string; url: string }) => void;
}

export function CTABuilderModal({ isOpen, onClose, isDarkMode, onSend }: CTABuilderModalProps) {
  const [text, setText] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [url, setUrl] = useState("");

  const handleSend = () => {
    if (text.trim() && buttonText.trim() && url.trim()) {
      onSend({ text: text.trim(), buttonText: buttonText.trim(), url: url.trim() });
      setText("");
      setButtonText("");
      setUrl("");
      onClose();
    }
  };

  const isValid = text.trim() && buttonText.trim() && url.trim();

  // Add https:// if not present
  const formatUrl = (input: string) => {
    if (input && !input.startsWith('http://') && !input.startsWith('https://')) {
      return 'https://' + input;
    }
    return input;
  };

  const handleUrlBlur = () => {
    setUrl(formatUrl(url));
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
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
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <Link className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  CTA URL
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

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Preview */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode ? "bg-[#2a3942] border-[#374045]" : "bg-gray-50 border-gray-200"
              )}>
                <p className={cn(
                  "text-xs font-medium mb-2",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Pré-visualização
                </p>
                <div className={cn(
                  "p-3 rounded-lg max-w-xs",
                  isDarkMode ? "bg-[#202c33]" : "bg-white shadow-sm"
                )}>
                  <p className={cn(
                    "text-sm mb-3",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                  )}>
                    {text || "Sua mensagem aparecerá aqui..."}
                  </p>
                  <button
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2",
                      isDarkMode 
                        ? "bg-[#00a884] text-white" 
                        : "bg-emerald-500 text-white"
                    )}
                  >
                    {buttonText || "Botão CTA"}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Texto da Mensagem *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite o texto que acompanhará o botão"
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* Button Text */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Texto do Botão *
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Ex: Visitar Site"
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* URL */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  URL de Destino *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://exemplo.com"
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>
            </div>

            {/* Footer Actions */}
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
                disabled={!isValid}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  "bg-cyan-500 text-white hover:bg-cyan-600",
                  !isValid && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Enviar CTA
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
