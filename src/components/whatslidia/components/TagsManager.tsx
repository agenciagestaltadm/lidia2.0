"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import {
  Tag,
  Plus,
  X,
  Search,
  Palette,
  Check,
  AlertCircle,
} from "lucide-react";

interface TagsManagerProps {
  contactId: string;
  existingTags: string[];
  isDarkMode: boolean;
  onUpdateTags?: (tags: string[]) => Promise<void>;
}

const predefinedTags = [
  { name: "VIP", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.2)", textColor: "#f59e0b" },
  { name: "Cliente Antigo", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.2)", textColor: "#3b82f6" },
  { name: "Reclamação", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)", textColor: "#ef4444" },
  { name: "Prospecção", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.2)", textColor: "#10b981" },
  { name: "Follow-up", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.2)", textColor: "#8b5cf6" },
  { name: "Urgente", color: "#f97316", bgColor: "rgba(249, 115, 22, 0.2)", textColor: "#f97316" },
  { name: "Parceiro", color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.2)", textColor: "#06b6d4" },
  { name: "Inadimplente", color: "#dc2626", bgColor: "rgba(220, 38, 38, 0.2)", textColor: "#dc2626" },
];

const TagSchema = z.string().min(1, "Nome da tag é obrigatório").max(20, "Máximo 20 caracteres");

export function TagsManager({
  contactId,
  existingTags,
  isDarkMode,
  onUpdateTags,
}: TagsManagerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = predefinedTags.filter((tag) => {
    if (!searchQuery) return true;
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleTag = async (tagName: string) => {
    setError(null);
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newTags);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onUpdateTags) {
        await onUpdateTags(newTags);
      }

      if (selectedTags.includes(tagName)) {
        toast.success(`Tag "${tagName}" removida`);
      } else {
        toast.success(`Tag "${tagName}" adicionada`);
      }
    } catch (err) {
      setError("Erro ao atualizar tags");
      toast.error("Erro ao salvar tags");
      // Revert on error
      setSelectedTags(selectedTags);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchQuery.trim()) return;

    // Validate
    const result = TagSchema.safeParse(searchQuery.trim());
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const newTagName = searchQuery.trim();

    // Check if already exists
    if (selectedTags.includes(newTagName)) {
      setError("Esta tag já está aplicada");
      return;
    }

    const newTags = [...selectedTags, newTagName];
    setSelectedTags(newTags);
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onUpdateTags) {
        await onUpdateTags(newTags);
      }

      toast.success(`Nova tag "${newTagName}" criada!`);
      setSearchQuery("");
    } catch (err) {
      setError("Erro ao criar tag");
      toast.error("Erro ao criar tag");
      setSelectedTags(selectedTags);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    const newTags = selectedTags.filter((t) => t !== tagName);
    setSelectedTags(newTags);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onUpdateTags) {
        await onUpdateTags(newTags);
      }

      toast.success(`Tag "${tagName}" removida`);
    } catch (err) {
      toast.error("Erro ao remover tag");
      setSelectedTags(selectedTags);
    } finally {
      setIsLoading(false);
    }
  };

  const getTagStyle = (tagName: string) => {
    const predefined = predefinedTags.find((t) => t.name === tagName);
    if (predefined) {
      return {
        backgroundColor: predefined.bgColor,
        color: predefined.textColor,
        borderColor: predefined.color,
      };
    }
    // Default style for custom tags
    return {
      backgroundColor: isDarkMode ? "rgba(107, 114, 128, 0.2)" : "rgba(107, 114, 128, 0.1)",
      color: isDarkMode ? "#9ca3af" : "#6b7280",
      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            className={cn(
              "text-sm font-medium flex items-center gap-2",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}
          >
            <Tag className="w-4 h-4" />
            Etiquetas
          </label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            className={cn(
              "text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
              isDarkMode
                ? "text-[#00a884] hover:bg-[#00a884]/10"
                : "text-green-600 hover:bg-green-50"
            )}
          >
            <Plus className="w-3 h-3" />
            {isOpen ? "Fechar" : "Gerenciar"}
          </motion.button>
        </div>

        {/* Tags List */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectedTags.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-sm italic",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}
              >
                Nenhuma etiqueta aplicada
              </motion.p>
            ) : (
              selectedTags.map((tag) => {
                const style = getTagStyle(tag);
                return (
                  <motion.span
                    key={tag}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border",
                      "transition-colors"
                    )}
                    style={{
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                      borderColor: style.borderColor,
                    }}
                  >
                    {tag}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isLoading}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </motion.span>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50",
                isDarkMode
                  ? "bg-[#2a3942] border-[#374045]"
                  : "bg-white border-gray-200"
              )}
            >
              {/* Search Input */}
              <div className="p-3 border-b border-[#374045]/50">
                <div className="relative">
                  <Search
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                    )}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setError(null);
                    }}
                    placeholder="Buscar ou criar etiqueta..."
                    className={cn(
                      "w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all",
                      isDarkMode
                        ? "bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0] focus:ring-2 focus:ring-[#00a884]/50"
                        : "bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500/50"
                    )}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-center gap-2 p-3 text-sm",
                    isDarkMode
                      ? "bg-red-500/10 text-red-400"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              {/* Create New Tag Option */}
              {searchQuery && !predefinedTags.some((t) => t.name.toLowerCase() === searchQuery.toLowerCase()) && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleCreateTag}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    isDarkMode
                      ? "bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884]"
                      : "bg-green-50 hover:bg-green-100 text-green-600"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Criar "{searchQuery}"
                  </span>
                </motion.button>
              )}

              {/* Available Tags */}
              <div className="p-2 max-h-48 overflow-y-auto">
                <p
                  className={cn(
                    "px-3 py-2 text-xs font-medium",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}
                >
                  {searchQuery ? "Resultados" : "Etiquetas disponíveis"}
                </p>
                {filteredTags.length === 0 ? (
                  <p
                    className={cn(
                      "px-3 py-4 text-sm text-center",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                    )}
                  >
                    Nenhuma etiqueta encontrada
                  </p>
                ) : (
                  filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <motion.button
                        key={tag.name}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleTag(tag.name)}
                        disabled={isLoading}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                          isSelected
                            ? isDarkMode
                              ? "bg-[#00a884]/20"
                              : "bg-green-50"
                            : isDarkMode
                            ? "hover:bg-[#374045]"
                            : "hover:bg-gray-100"
                        )}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: tag.bgColor }}
                        >
                          <Tag className="w-3 h-3" style={{ color: tag.color }} />
                        </div>
                        <span
                          className={cn(
                            "text-sm flex-1",
                            isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                          )}
                          style={{ color: isSelected ? tag.color : undefined }}
                        >
                          {tag.name}
                        </span>
                        {isSelected && (
                          <Check
                            className={cn(
                              "w-4 h-4",
                              isDarkMode ? "text-[#00a884]" : "text-green-600"
                            )}
                          />
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                className={cn(
                  "px-3 py-2 text-xs text-center border-t",
                  isDarkMode
                    ? "bg-[#1f2c33] border-[#374045] text-[#8696a0]"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                )}
              >
                {selectedTags.length} etiqueta{selectedTags.length !== 1 ? "s" : ""} selecionada
                {selectedTags.length !== 1 ? "s" : ""}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
