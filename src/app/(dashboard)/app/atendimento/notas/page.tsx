import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotesClient } from "./components/notes-client";
import type { Note, NoteStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Notas - LIDIA",
  description: "Gestão de notas e anotações",
};

export default async function NotasPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notesData } = await supabase
    .from("notes")
    .select(`*, contact:contacts(name, phone, avatar), creator:profiles(name, avatar)`)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  const notes: Note[] = (notesData || []).map((item) => ({
    id: item.id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    content: item.content,
    category: item.category,
    created_by: item.created_by,
    created_by_name: item.creator?.name || "Unknown",
    created_by_avatar: item.creator?.avatar,
    created_at: item.created_at,
    updated_at: item.updated_at,
    pinned: item.pinned,
    tags: item.tags,
    conversation_id: item.conversation_id,
  }));

  const stats: NoteStats = {
    total_notes: notes.length,
    notes_by_category: {
      general: notes.filter((n) => n.category === "general").length,
      important: notes.filter((n) => n.category === "important").length,
      followup: notes.filter((n) => n.category === "followup").length,
      complaint: notes.filter((n) => n.category === "complaint").length,
      sale: notes.filter((n) => n.category === "sale").length,
      support: notes.filter((n) => n.category === "support").length,
    },
    recent_notes_count: notes.filter((n) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(n.created_at) > sevenDaysAgo;
    }).length,
    pinned_count: notes.filter((n) => n.pinned).length,
  };

  return <NotesClient initialNotes={notes} initialStats={stats} />;
}
