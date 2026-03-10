"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, List, Plus, Trash2, Send } from "lucide-react";

interface ListBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (data: { header: string; body: string; footer: string; buttons: string[] }) => void;
}

export function ListBuilderModal({ isOpen, onClose, isDarkMode, onSend }: ListBuilderModalProps) {
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<string[]>([""]);

  const addButton = () => {
    if (buttons.length < 10) {
      setButtons([...buttons, ""]);
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = value;
    setButtons(newButtons);
  };

  const handleSend = () => {
    const validButtons = buttons.filter((b) => b.trim() !== "");
    if (header.trim() && body.trim() && validButtons.length > 0) {
      onSend({
        header: header.trim(),
        body: body.trim(),
        footer: footer.trim(),
        buttons: validButtons,
      });
      // Reset form
      setHeader("");
      setBody("");
      setFooter("");
      setButtons([""]);
      onClose();
    }
  };

  const isValid = header.trim() && body.trim() && buttons.some((b) => b.trim() !== "");

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
              "w-[90%] max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between shrink-0",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                  <List className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Enviar Lista
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
              {/* Header */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Cabeçalho *
                </label>
                <input
                  type="text"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="Título da lista"
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* Body */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Mensagem *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Conteúdo da mensagem"
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none",
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
                  Opções da Lista *
                </label>
                <div className="space-y-2">
                  {buttons.map((button, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs w-5",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}>
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={button}
                        onChange={(e) => updateButton(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                          isDarkMode 
                            ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                            : "bg-gray-100 text-gray-900 placeholder-gray-500"
                        )}
                      />
                      {buttons.length > 1 && (
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
                {buttons.length < 10 && (
                  <button
                    onClick={addButton}
                    className={cn(
                      "mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      isDarkMode 
                        ? "text-teal-400 hover:bg-teal-500/10" 
                        : "text-teal-600 hover:bg-teal-50"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar opção
                  </button>
                )}
              </div>

              {/* Footer */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-1.5",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Rodapé (opcional)
                </label>
                <input
                  type="text"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Texto do rodapé"
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                    isDarkMode 
                      ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
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
                  "bg-teal-500 text-white hover:bg-teal-600",
                  !isValid && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Enviar Lista
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
