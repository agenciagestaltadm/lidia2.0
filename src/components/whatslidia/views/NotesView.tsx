"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  StickyNote,
  ArrowLeft,
  Plus,
  MoreVertical,
  Clock,
  User,
  Trash2,
  Edit3,
  Pin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Note {
  id: string;
  content: string;
  contact_id?: string;
  contact_name?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
}

interface NotesViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export function NotesView({ isDarkMode, onBack }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notes")
        .select(`*, contact:contacts(name)`)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      const formattedNotes: Note[] = (data || []).map((note: Record<string, unknown>) => ({
        id: note.id as string,
        content: note.content as string,
        contact_id: note.contact_id as string | undefined,
        contact_name: (note.contact as Record<string, unknown>)?.name as string | undefined,
        created_by: note.created_by as string,
        created_by_name: note.created_by_name as string,
        created_at: note.created_at as string,
        updated_at: note.updated_at as string,
        pinned: note.pinned as boolean | undefined,
      }));
      
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Erro ao carregar notas");
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("notes").insert({
        content: newNote,
        created_by: user?.id,
        pinned: false,
      });

      if (error) throw error;
      
      setNewNote("");
      setIsAdding(false);
      loadNotes();
      toast.success("Nota adicionada");
    } catch (error) {
      toast.error("Erro ao adicionar nota");
    }
  }

  async function deleteNote(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      loadNotes();
      toast.success("Nota removida");
    } catch (error) {
      toast.error("Erro ao remover nota");
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("notes").update({ pinned: !pinned }).eq("id", id);
      if (error) throw error;
      loadNotes();
    } catch (error) {
      toast.error("Erro ao fixar nota");
    }
  }

  const filteredNotes = notes.filter((note) =>
    search === "" ||
    note.content.toLowerCase().includes(search.toLowerCase()) ||
    note.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className={cn("flex-1 flex flex-col", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
        <div className="p-4"><Skeleton className="h-10 w-full" /></div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        <button onClick={onBack} className={cn("p-2 rounded-full", isDarkMode ? "text-[#aebac1] hover:bg-[#2a3942]" : "text-gray-600 hover:bg-gray-100")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className={cn("font-semibold text-lg flex-1", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Comentários Internos</h2>
        <span className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>{filteredNotes.length} notas</span>
      </div>

      {/* Search */}
      <div className={cn("p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        <div className="relative">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />
          <Input
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-10", isDarkMode ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef]" : "bg-gray-100 border-gray-200")}
          />
        </div>
      </div>

      {/* Add Note */}
      <div className={cn("p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        {isAdding ? (
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Digite sua nota..."
              className={cn("w-full p-3 rounded-lg resize-none h-24", isDarkMode ? "bg-[#2a3942] text-[#e9edef] border-[#374045]" : "bg-gray-100 text-gray-900")}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={addNote} className="px-4 py-2 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/90">Adicionar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className={cn("w-full p-3 rounded-lg flex items-center gap-2", isDarkMode ? "bg-[#2a3942] text-[#aebac1]" : "bg-gray-100 text-gray-600")}>
            <Plus className="w-5 h-5" /> Adicionar nova nota
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <StickyNote className={cn("w-16 h-16 mb-4", isDarkMode ? "text-[#374045]" : "text-gray-300")} />
            <p className={cn("text-lg font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Nenhuma nota</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn("p-3 rounded-lg group relative", isDarkMode ? "bg-[#1f2c33]" : "bg-white", note.pinned && "border-l-4 border-l-[#00a884]")}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.pinned && <Pin className="w-4 h-4 text-[#00a884]" />}
                    <User className={cn("w-4 h-4", isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />
                    <span className={cn("text-sm font-medium", isDarkMode ? "text-[#aebac1]" : "text-gray-700")}>{note.created_by_name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePin(note.id, note.pinned || false)} className={cn("p-1 rounded", isDarkMode ? "hover:bg-[#2a3942]" : "hover:bg-gray-100")}>
                      <Pin className={cn("w-4 h-4", note.pinned ? "text-[#00a884]" : isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className={cn("p-1 rounded text-red-400", isDarkMode ? "hover:bg-[#2a3942]" : "hover:bg-gray-100")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className={cn("text-sm", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>{note.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-[#8696a0]">
                  <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: ptBR })}</span>
                  {note.contact_name && <span>Contato: {note.contact_name}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
