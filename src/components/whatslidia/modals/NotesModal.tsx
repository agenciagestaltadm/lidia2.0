"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import {
  X,
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  Save,
  Eye,
  Search,
  AlertCircle,
  Check,
  Clock,
  Palette,
  Bold,
  Italic,
  List,
} from "lucide-react";

// Zod Schema
const NoteSchema = z.object({
  content: z.string().min(1, "Conteúdo obrigatório"),
  category: z.enum(["general", "important", "followup", "complaint"]),
});

type NoteData = z.infer<typeof NoteSchema>;

interface Note {
  id: string;
  content: string;
  category: NoteData["category"];
  createdAt: Date;
  updatedAt: Date;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  isDarkMode: boolean;
  onAddNote?: (data: NoteData) => Promise<void>;
  onUpdateNote?: (id: string, data: NoteData) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
}

const categories = [
  { id: "general", label: "Geral", color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.2)" },
  { id: "important", label: "Importante", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)" },
  { id: "followup", label: "Acompanhamento", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.2)" },
  { id: "complaint", label: "Reclamação", color: "#f97316", bgColor: "rgba(249, 115, 22, 0.2)" },
];

// Mock notes - in production this would come from API
const mockNotes: Note[] = [
  {
    id: "1",
    content: "Cliente interessado no plano Premium. Retornar na segunda-feira.",
    category: "followup",
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "2",
    content: "**URGENTE**: Problema com pagamento pendente há 3 dias.",
    category: "important",
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
];

export function NotesModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  isDarkMode,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteData["category"]>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setIsCreating(false);
      setEditingId(null);
      setContent("");
      setCategory("general");
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        if (isCreating || editingId) {
          setIsCreating(false);
          setEditingId(null);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, isLoading, isCreating, editingId]);

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.content.toLowerCase().includes(query);
  });

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setContent("");
    setCategory("general");
    setError(null);
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setIsCreating(false);
    setContent(note.content);
    setCategory(note.category);
    setError(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setContent("");
    setCategory("general");
    setError(null);
  };

  const handleSave = async () => {
    setError(null);

    // Validate with Zod
    const result = NoteSchema.safeParse({ content, category });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (isCreating) {
        const newNote: Note = {
          id: Date.now().toString(),
          content,
          category,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setNotes([newNote, ...notes]);
        if (onAddNote) await onAddNote(result.data);
        toast.success("Nota criada!");
      } else if (editingId) {
        setNotes(
          notes.map((n) =>
            n.id === editingId
              ? { ...n, content, category, updatedAt: new Date() }
              : n
          )
        );
        if (onUpdateNote) await onUpdateNote(editingId, result.data);
        toast.success("Nota atualizada!");
      }

      handleCancel();
    } catch (err) {
      setError("Erro ao salvar nota");
      toast.error("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotes(notes.filter((n) => n.id !== id));
      if (onDeleteNote) await onDeleteNote(id);
      toast.success("Nota excluída!");
    } catch (err) {
      toast.error("Erro ao excluir");
    } finally {
      setIsLoading(false);
    }
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById("note-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;

    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText = "";
    switch (syntax) {
      case "bold":
        newText = `${before}**${selection || "texto negrito"}**${after}`;
        break;
      case "italic":
        newText = `${before}_${selection || "texto itálico"}_${after}`;
        break;
      case "list":
        newText = `${before}\n- ${selection || "item"}${after}`;
        break;
      default:
        return;
    }

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntax.length + 2, end + syntax.length + 2);
    }, 0);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
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
              "relative z-10 w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
              isDarkMode
                ? "bg-[#1f2c33] border border-[#2a2a2a]"
                : "bg-white border border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-6 py-4 border-b shrink-0",
                isDarkMode
                  ? "bg-[#1f2c33] border-[#2a2a2a]"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isDarkMode ? "bg-amber-500/20" : "bg-amber-100"
                  )}
                >
                  <StickyNote
                    className={cn(
                      "w-5 h-5",
                      isDarkMode ? "text-amber-400" : "text-amber-600"
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
                    Notas
                  </h2>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {contactName} • {notes.length} nota{notes.length !== 1 ? "s" : ""}
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
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search Bar */}
              <div className="px-6 py-4 border-b shrink-0">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search
                      className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                      )}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar notas..."
                      className={cn(
                        "w-full pl-10 pr-4 py-2 rounded-xl border-2 outline-none transition-all text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-amber-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500"
                      )}
                    />
                  </div>
                  {!isCreating && !editingId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartCreate}
                      className={cn(
                        "px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors",
                        isDarkMode
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Nova
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Create/Edit Form */}
              <AnimatePresence>
                {(isCreating || editingId) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "px-6 py-4 border-b shrink-0",
                      isDarkMode
                        ? "bg-[#2a3942]/30 border-[#374045]"
                        : "bg-amber-50/50 border-gray-200"
                    )}
                  >
                    {/* Category Selection */}
                    <div className="flex gap-2 mb-3">
                      {categories.map((cat) => (
                        <motion.button
                          key={cat.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCategory(cat.id as NoteData["category"])}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            category === cat.id
                              ? isDarkMode
                                ? "text-white"
                                : "text-white"
                              : isDarkMode
                              ? "text-[#8696a0] hover:bg-[#374045]"
                              : "text-gray-600 hover:bg-gray-200"
                          )}
                          style={{
                            backgroundColor:
                              category === cat.id ? cat.color : "transparent",
                            border: `1px solid ${cat.color}`,
                          }}
                        >
                          {cat.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex gap-1 mb-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => insertMarkdown("bold")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isDarkMode
                            ? "hover:bg-[#374045] text-[#8696a0]"
                            : "hover:bg-gray-200 text-gray-600"
                        )}
                      >
                        <Bold className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => insertMarkdown("italic")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isDarkMode
                            ? "hover:bg-[#374045] text-[#8696a0]"
                            : "hover:bg-gray-200 text-gray-600"
                        )}
                      >
                        <Italic className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => insertMarkdown("list")}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isDarkMode
                            ? "hover:bg-[#374045] text-[#8696a0]"
                            : "hover:bg-gray-200 text-gray-600"
                        )}
                      >
                        <List className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Content Textarea */}
                    <textarea
                      id="note-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Digite sua nota... Use **texto** para negrito e _texto_ para itálico"
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-sm mb-3",
                        isDarkMode
                          ? "bg-[#2a3942] border-[#374045] text-[#e9edef] placeholder-[#8696a0] focus:border-amber-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500"
                      )}
                    />

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg mb-3 text-sm",
                          isDarkMode
                            ? "bg-red-500/10 text-red-400"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          isDarkMode
                            ? "text-[#e9edef] hover:bg-[#374045]"
                            : "text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                          "bg-amber-500 text-white hover:bg-amber-600",
                          "disabled:opacity-70"
                        )}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isCreating ? "Criar" : "Salvar"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {filteredNotes.length === 0 ? (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center py-12",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-400"
                    )}
                  >
                    <StickyNote className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? "Nenhuma nota encontrada" : "Nenhuma nota criada"}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleStartCreate}
                        className={cn(
                          "mt-3 text-sm font-medium transition-colors",
                          isDarkMode
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-amber-600 hover:text-amber-700"
                        )}
                      >
                        Criar primeira nota
                      </button>
                    )}
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const cat = categories.find((c) => c.id === note.category);
                    return (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "p-4 rounded-xl border group",
                          isDarkMode
                            ? "bg-[#2a3942] border-[#374045] hover:border-[#4a545a]"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Category Badge */}
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                              style={{
                                backgroundColor: cat?.bgColor,
                                color: cat?.color,
                              }}
                            >
                              <Palette className="w-3 h-3" />
                              {cat?.label}
                            </div>

                            {/* Content */}
                            <div
                              className={cn(
                                "text-sm whitespace-pre-wrap",
                                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                              )}
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(note.content),
                              }}
                            />

                            {/* Timestamp */}
                            <div
                              className={cn(
                                "flex items-center gap-1 mt-2 text-xs",
                                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                              )}
                            >
                              <Clock className="w-3 h-3" />
                              {formatDate(note.updatedAt)}
                              {note.updatedAt.getTime() !==
                                note.createdAt.getTime() && (
                                <span className="ml-1">(editado)</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleStartEdit(note)}
                              disabled={isCreating || !!editingId}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isDarkMode
                                  ? "hover:bg-[#374045] text-[#8696a0]"
                                  : "hover:bg-gray-200 text-gray-500"
                              )}
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(note.id)}
                              disabled={isCreating || !!editingId}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isDarkMode
                                  ? "hover:bg-red-500/20 text-red-400"
                                  : "hover:bg-red-100 text-red-500"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
