"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, FileType, Search, Send } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (template: { name: string; content: string }) => void;
}

// Mock templates
const mockTemplates: Template[] = [
  { id: "1", name: "Saudação", content: "Olá! Como posso ajudar você hoje?", category: "Geral" },
  { id: "2", name: "Aguardando", content: "Só um momento, por favor. Estou verificando isso para você.", category: "Geral" },
  { id: "3", name: "Agradecimento", content: "Obrigado pelo contato! Tenha um ótimo dia.", category: "Geral" },
  { id: "4", name: "Horário Comercial", content: "Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.", category: "Informação" },
  { id: "5", name: "Prazo Entrega", content: "O prazo de entrega é de 3 a 5 dias úteis.", category: "Vendas" },
  { id: "6", name: "Pagamento", content: "Aceitamos pagamento via PIX, cartão de crédito e boleto.", category: "Vendas" },
];

export function TemplatePickerModal({ isOpen, onClose, isDarkMode, onSend }: TemplatePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const categories = ["Todos", ...Array.from(new Set(mockTemplates.map((t) => t.category)))];

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSend = (template: Template) => {
    onSend({ name: template.name, content: template.content });
    onClose();
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
              "w-[90%] max-w-lg rounded-2xl shadow-2xl overflow-hidden",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <FileType className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Templates
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

            {/* Search & Filter */}
            <div className={cn(
              "px-4 py-3 border-b space-y-3",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
              )}>
                <Search className={cn(
                  "w-4 h-4",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                )} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar template..."
                  className={cn(
                    "flex-1 bg-transparent text-sm outline-none",
                    isDarkMode ? "text-[#e9edef] placeholder-[#8696a0]" : "text-gray-900 placeholder-gray-500"
                  )}
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                      selectedCategory === category
                        ? "bg-indigo-500 text-white"
                        : isDarkMode
                          ? "bg-[#2a3942] text-[#8696a0] hover:bg-[#374045]"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}>
                    Nenhum template encontrado
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "p-3 rounded-xl",
                        isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className={cn(
                            "font-medium text-sm",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}>
                            {template.name}
                          </h4>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            isDarkMode ? "bg-[#374045] text-[#8696a0]" : "bg-gray-200 text-gray-600"
                          )}>
                            {template.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSend(template)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            "bg-indigo-500 text-white hover:bg-indigo-600"
                          )}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className={cn(
                        "text-xs line-clamp-2",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}>
                        {template.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
