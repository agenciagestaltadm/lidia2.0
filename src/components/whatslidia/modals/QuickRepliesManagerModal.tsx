"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Zap, Plus, Trash2, Edit2, Save, MessageSquare, AlertCircle } from "lucide-react";
import type { QuickReply } from "@/hooks/use-quick-replies";

interface QuickRepliesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  quickReplies: QuickReply[];
  onAdd: (data: { shortcut: string; title: string; content: string }) => boolean;
  onUpdate: (id: string, data: { shortcut: string; title: string; content: string }) => boolean;
  onDelete: (id: string) => void;
}

export function QuickRepliesManagerModal({
  isOpen,
  onClose,
  isDarkMode,
  quickReplies,
  onAdd,
  onUpdate,
  onDelete,
}: QuickRepliesManagerModalProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    shortcut: "",
    title: "",
    content: "",
  });

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(null);
      setIsCreating(false);
      setError(null);
      setFormData({ shortcut: "", title: "", content: "" });
    }
  }, [isOpen]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({ shortcut: "", title: "", content: "" });
    setError(null);
  };

  const handleStartEdit = (reply: QuickReply) => {
    setIsEditing(reply.id);
    setIsCreating(false);
    setFormData({
      shortcut: reply.shortcut,
      title: reply.title,
      content: reply.content,
    });
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsCreating(false);
    setError(null);
    setFormData({ shortcut: "", title: "", content: "" });
  };

  const handleSave = () => {
    setError(null);

    // Validation
    if (!formData.shortcut.trim()) {
      setError("O atalho é obrigatório");
      return;
    }
    if (!formData.title.trim()) {
      setError("O título é obrigatório");
      return;
    }
    if (!formData.content.trim()) {
      setError("O conteúdo é obrigatório");
      return;
    }

    // Remove / if user added it
    const cleanShortcut = formData.shortcut.replace(/^\//, "").trim();

    let success;
    if (isCreating) {
      success = onAdd({
        shortcut: cleanShortcut,
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      if (success) {
        setIsCreating(false);
        setFormData({ shortcut: "", title: "", content: "" });
      } else {
        setError(`O atalho "/${cleanShortcut}" já existe`);
      }
    } else if (isEditing) {
      success = onUpdate(isEditing, {
        shortcut: cleanShortcut,
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      if (success) {
        setIsEditing(null);
        setFormData({ shortcut: "", title: "", content: "" });
      } else {
        setError(`O atalho "/${cleanShortcut}" já existe`);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta mensagem rápida?")) {
      onDelete(id);
    }
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
              "w-[90%] max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between shrink-0",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Mensagens Rápidas
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "mb-4 p-3 rounded-lg flex items-center gap-2 text-sm",
                      isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                    )}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create/Edit Form */}
              <AnimatePresence>
                {(isCreating || isEditing) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "mb-4 p-4 rounded-xl border",
                      isDarkMode 
                        ? "bg-[#2a3942] border-[#374045]" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <h4 className={cn(
                      "font-medium mb-3",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}>
                      {isCreating ? "Nova Mensagem Rápida" : "Editar Mensagem Rápida"}
                    </h4>

                    <div className="space-y-3">
                      {/* Shortcut */}
                      <div>
                        <label className={cn(
                          "block text-xs mb-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}>
                          Atalho (digite / + atalho no chat)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-lg font-mono",
                            isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                          )}>/</span>
                          <input
                            type="text"
                            value={formData.shortcut}
                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                            placeholder="ex: ola"
                            className={cn(
                              "flex-1 px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#00a884]/50",
                              isDarkMode 
                                ? "bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0]" 
                                : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200"
                            )}
                          />
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className={cn(
                          "block text-xs mb-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}>
                          Título
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="ex: Saudação"
                          className={cn(
                            "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#00a884]/50",
                            isDarkMode 
                              ? "bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0]" 
                              : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200"
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <label className={cn(
                          "block text-xs mb-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}>
                          Conteúdo da mensagem
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Digite o conteúdo completo da mensagem..."
                          rows={3}
                          className={cn(
                            "w-full px-3 py-2 text-sm rounded-lg resize-none outline-none focus:ring-2 focus:ring-[#00a884]/50",
                            isDarkMode 
                              ? "bg-[#1f2c33] text-[#e9edef] placeholder-[#8696a0]" 
                              : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200"
                          )}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCancel}
                          className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                            isDarkMode 
                              ? "text-[#e9edef] hover:bg-[#374045]" 
                              : "text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#00a884] text-white hover:bg-[#00a884]/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Button */}
              {!isCreating && !isEditing && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleStartCreate}
                  className={cn(
                    "w-full mb-4 p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors",
                    isDarkMode 
                      ? "border-[#374045] hover:border-[#00a884] text-[#8696a0] hover:text-[#00a884]" 
                      : "border-gray-300 hover:border-[#00a884] text-gray-500 hover:text-[#00a884]"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Nova Mensagem Rápida</span>
                </motion.button>
              )}

              {/* List */}
              <div className="space-y-2">
                <h4 className={cn(
                  "text-xs font-medium uppercase tracking-wider mb-3",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Mensagens Cadastradas ({quickReplies.length})
                </h4>

                {quickReplies.length === 0 ? (
                  <div className={cn(
                    "p-8 text-center rounded-xl border-2 border-dashed",
                    isDarkMode 
                      ? "border-[#374045] text-[#8696a0]" 
                      : "border-gray-200 text-gray-400"
                  )}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem rápida cadastrada</p>
                    <p className="text-xs mt-1 opacity-70">Clique em "Nova Mensagem Rápida" para criar</p>
                  </div>
                ) : (
                  quickReplies
                    .sort((a, b) => a.shortcut.localeCompare(b.shortcut))
                    .map((reply) => (
                      <motion.div
                        key={reply.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "p-3 rounded-xl border group transition-colors",
                          isEditing === reply.id
                            ? isDarkMode
                              ? "bg-[#00a884]/10 border-[#00a884]/50"
                              : "bg-[#00a884]/5 border-[#00a884]/30"
                            : isDarkMode
                              ? "bg-[#2a3942] border-[#374045] hover:border-[#4a5a62]"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className={cn(
                                "px-1.5 py-0.5 rounded text-xs font-mono",
                                isDarkMode 
                                  ? "bg-[#00a884]/20 text-[#00a884]" 
                                  : "bg-[#00a884]/10 text-[#00a884]"
                              )}>
                                /{reply.shortcut}
                              </code>
                              <span className={cn(
                                "font-medium text-sm truncate",
                                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                              )}>
                                {reply.title}
                              </span>
                            </div>
                            <p className={cn(
                              "text-xs line-clamp-2",
                              isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                            )}>
                              {reply.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(reply)}
                              disabled={isEditing === reply.id || isCreating}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isDarkMode 
                                  ? "hover:bg-[#374045] text-[#8696a0]" 
                                  : "hover:bg-gray-200 text-gray-500"
                              )}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(reply.id)}
                              disabled={isEditing === reply.id || isCreating}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isDarkMode 
                                  ? "hover:bg-red-500/20 text-red-400" 
                                  : "hover:bg-red-100 text-red-500"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={cn(
              "px-4 py-3 border-t text-xs text-center",
              isDarkMode ? "border-[#2a2a2a] text-[#8696a0]" : "border-gray-200 text-gray-500"
            )}>
              Digite <code className={isDarkMode ? "text-[#00a884]" : "text-[#00a884]"}>/atalho</code> no chat para usar uma mensagem rápida
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
