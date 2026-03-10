"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, MessageSquare, Plus, Trash2, Send } from "lucide-react";

interface ReplyButtonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (data: { title: string; message: string; buttons: string[] }) => void;
}

export function ReplyButtonsModal({ isOpen, onClose, isDarkMode, onSend }: ReplyButtonsModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<string[]>(["", ""]);

  const addButton = () => {
    if (buttons.length < 5) {
      setButtons([...buttons, ""]);
    }
  };

  const removeButton = (index: number) => {
    if (buttons.length > 2) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  const updateButton = (index: number, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = value;
    setButtons(newButtons);
  };

  const handleSend = () => {
    const validButtons = buttons.filter((b) => b.trim() !== "");
    if (title.trim() && message.trim() && validButtons.length >= 2) {
      onSend({
        title: title.trim(),
        message: message.trim(),
        buttons: validButtons,
      });
      setTitle("");
      setMessage("");
      setButtons(["", ""]);
      onClose();
    }
  };

  const isValid = title.trim() && message.trim() && buttons.filter((b) => b.trim() !== "").length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between shrink-0",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Botões de Resposta
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    "font-medium text-sm mb-1",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                  )}>
                    {title || "Título"}
                  </p>
                  <p className={cn(
                    "text-xs mb-3",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-600"
                  )}>
                    {message || "Sua mensagem aqui..."}
                  </p>
                  <div className="space-y-1">
                    {buttons.map((btn, i) => (
                      <div
                        key={i}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs text-center",
                          btn.trim() 
                            ? isDarkMode ? "bg-[#2a3942] text-[#00a884]" : "bg-gray-100 text-emerald-600"
                            : isDarkMode ? "bg-[#374045] text-[#8696a0]" : "bg-gray-200 text-gray-400"
                        )}
                      >
                        {btn.trim() || `Botão ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da mensagem"
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* Message */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Mensagem *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Conteúdo da mensagem"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* Buttons */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Botões de Resposta (2-5) *
                </label>
                <div className="space-y-2">
                  {buttons.map((button, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={button}
                        onChange={(e) => updateButton(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                          isDarkMode 
                            ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                            : "bg-gray-100 text-gray-900 placeholder-gray-500"
                        )}
                      />
                      {buttons.length > 2 && (
                        <button
                          onClick={() => removeButton(index)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {buttons.length < 5 && (
                  <button
                    onClick={addButton}
                    className={cn(
                      "mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      isDarkMode 
                        ? "text-amber-400 hover:bg-amber-500/10" 
                        : "text-amber-600 hover:bg-amber-50"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar botão
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className={cn(
              "px-4 py-3 border-t flex items-center justify-end gap-2 shrink-0",
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
                  "bg-amber-500 text-white hover:bg-amber-600",
                  !isValid && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
