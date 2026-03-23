import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NotesClient } from "./components/notes-client";
import { ErrorComponent } from "../components/error-component";
import type { Note, NoteStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Notas - LIDIA",
  description: "Gestão de notas e anotações",
};

// Cache notes data for 10 seconds
const getCachedNotes = unstable_cache(
  async (isSuperAdmin: boolean, companyId: string) => {
    const supabase = await createClient();

    let query = supabase
      .from("notes")
      .select(`*, contact:contacts(name, phone, avatar), creator:profiles(name, avatar)`)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!isSuperAdmin && companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
      throw new Error("Falha ao carregar notas");
    }

    return data || [];
  },
  ["notes-data"],
  { revalidate: 10 }
);

export default async function NotasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    redirect("/login");
  }

  // Check permissions
  const isSuperAdmin = profile.role === "super_admin";
  const isAdmin = profile.role === "admin";
  const isAttendant = profile.role === "attendant";

  if (!isSuperAdmin && !isAdmin && !isAttendant) {
    redirect("/app/central");
  }

  try {
    const notesData = await getCachedNotes(isSuperAdmin, profile.company_id || "");

    const notes: Note[] = notesData.map((item) => ({
      id: item.id,
      contact_id: item.contact_id,
      contact_name: item.contact?.name || "Desconhecido",
      contact_phone: item.contact?.phone || "",
      contact_avatar: item.contact?.avatar,
      content: item.content,
      category: item.category,
      created_by: item.created_by,
      created_by_name: item.creator?.name || "Desconhecido",
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
  } catch (error) {
    console.error("Error in NotasPage:", error);
    return (
      <ErrorComponent
        error={error instanceof Error ? error.message : "Erro ao carregar notas"}
      />
    );
  }
}
