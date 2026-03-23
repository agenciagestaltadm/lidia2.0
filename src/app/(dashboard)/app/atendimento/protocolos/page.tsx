import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ProtocolsClient } from "./components/protocols-client";
import { ErrorComponent } from "../components/error-component";
import type { Protocol, ProtocolStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Protocolos - LIDIA",
  description: "Gestão de protocolos de atendimento",
};

// Cache protocols data for 10 seconds
const getCachedProtocols = unstable_cache(
  async (isSuperAdmin: boolean, companyId: string) => {
    const supabase = await createClient();

    let query = supabase
      .from("protocols")
      .select(`*, contact:contacts(name, phone, avatar), sender:profiles(name)`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!isSuperAdmin && companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching protocols:", error);
      throw new Error("Falha ao carregar protocolos");
    }

    return data || [];
  },
  ["protocols-data"],
  { revalidate: 10 }
);

export default async function ProtocolosPage() {
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
    const protocolsData = await getCachedProtocols(isSuperAdmin, profile.company_id || "");

    const protocols: Protocol[] = protocolsData.map((item) => ({
      id: item.id,
      code: item.code,
      conversation_id: item.conversation_id,
      contact_id: item.contact_id,
      contact_name: item.contact?.name || "Desconhecido",
      contact_phone: item.contact?.phone || "",
      contact_avatar: item.contact?.avatar,
      message: item.message,
      sent_by: item.sent_by,
      sent_by_name: item.sender?.name || "Desconhecido",
      sent_at: item.sent_at,
      created_at: item.created_at,
      status: item.status,
      expires_at: item.expires_at,
      resolved_at: item.resolved_at,
      resolved_by: item.resolved_by,
      notes: item.notes,
    }));

    const stats: ProtocolStats = {
      total_protocols: protocols.length,
      active_count: protocols.filter((p) => p.status === "active").length,
      expired_count: protocols.filter((p) => p.status === "expired").length,
      resolved_count: protocols.filter((p) => p.status === "resolved").length,
      avg_resolution_time_hours: 0,
    };

    return <ProtocolsClient initialProtocols={protocols} initialStats={stats} />;
  } catch (error) {
    console.error("Error in ProtocolosPage:", error);
    return (
      <ErrorComponent
        error={error instanceof Error ? error.message : "Erro ao carregar protocolos"}
      />
    );
  }
}
