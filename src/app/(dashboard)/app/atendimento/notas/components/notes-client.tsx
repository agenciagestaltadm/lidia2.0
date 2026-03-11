"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Note, NoteStats, NoteCategory } from "@/types/atendimento";
import { useNotes, useNoteStats, useNotesRealtime } from "@/hooks/use-notes";
import { StickyNote, Search, Pin, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesClientProps {
  initialNotes: Note[];
  initialStats: NoteStats;
}

const categoryOptions = [
  { value: "all", label: "Todas" },
  { value: "general", label: "Geral" },
  { value: "important", label: "Importante" },
  { value: "followup", label: "Acompanhamento" },
  { value: "complaint", label: "Reclamação" },
  { value: "sale", label: "Venda" },
  { value: "support", label: "Suporte" },
];

const categoryColors: Record<NoteCategory, string> = {
  general: "bg-slate-500",
  important: "bg-red-500",
  followup: "bg-amber-500",
  complaint: "bg-orange-500",
  sale: "bg-emerald-500",
  support: "bg-blue-500",
};

export function NotesClient({ initialNotes, initialStats }: NotesClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NoteCategory | "all">("all");

  const { data: notes, isLoading } = useNotes({
    category: category === "all" ? undefined : category,
  });

  const { data: stats } = useNoteStats();
  useNotesRealtime().subscribe();

  const displayNotes = notes?.notes || initialNotes;
  const displayStats = stats || initialStats;

  const filteredNotes = displayNotes.filter((n) =>
    search === "" ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={displayStats.total_notes} icon={StickyNote} />
        <StatCard title="Fixadas" value={displayStats.pinned_count} icon={Pin} color="amber" />
        <StatCard title="Recentes (7d)" value={displayStats.recent_notes_count} icon={Calendar} color="blue" />
        <StatCard title="Importantes" value={displayStats.notes_by_category.important} icon={Pin} color="red" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as NoteCategory | "all")}
          options={categoryOptions}
          placeholder="Categoria"
          className="w-[200px]"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 ${note.pinned ? "border-l-4 border-l-amber-400" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {note.pinned && <Pin className="w-4 h-4 text-amber-400" />}
                  <div className={`w-3 h-3 rounded-full ${categoryColors[note.category]}`} />
                  <span className="text-xs font-medium uppercase text-muted-foreground">{note.category}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              
              <p className="mt-3 text-sm">{note.content}</p>
              
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{note.contact_name}</span>
                </div>
                <span>por {note.created_by_name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "emerald" }: { title: string; value: number; icon: React.ElementType; color?: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${colorClasses[color] || colorClasses.emerald}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
