import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtocolsClient } from "./components/protocols-client";
import type { Protocol, ProtocolStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Protocolos - LIDIA",
  description: "Gestão de protocolos de atendimento",
};

export default async function ProtocolosPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: protocolsData } = await supabase
    .from("protocols")
    .select(`*, contact:contacts(name, phone, avatar), sender:profiles(name)`)
    .order("created_at", { ascending: false })
    .limit(50);

  const protocols: Protocol[] = (protocolsData || []).map((item) => ({
    id: item.id,
    code: item.code,
    conversation_id: item.conversation_id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    message: item.message,
    sent_by: item.sent_by,
    sent_by_name: item.sender?.name || "Unknown",
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
}
