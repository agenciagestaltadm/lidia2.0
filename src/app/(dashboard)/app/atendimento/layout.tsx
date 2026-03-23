import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AtendimentoTabs } from "./components/atendimento-tabs";

export const metadata: Metadata = {
  title: "Atendimento - LIDIA",
  description: "Gestão de atendimentos, funil de vendas, protocolos, avaliações e notas",
};

interface AtendimentoLayoutProps {
  children: React.ReactNode;
}

export default async function AtendimentoLayout({
  children,
}: AtendimentoLayoutProps) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has permission to view attendances
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch counts for badges
  const [{ count: funnelCount }, { count: protocolCount }, { count: ratingCount }, { count: noteCount }] = await Promise.all([
    supabase.from("sales_funnel").select("*", { count: "exact", head: true }),
    supabase.from("protocols").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ratings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notes").select("*", { count: "exact", head: true }),
  ]);

  const counts = {
    funnel: funnelCount || 0,
    protocols: protocolCount || 0,
    ratings: ratingCount || 0,
    notes: noteCount || 0,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Atendimento</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestão completa do funil de vendas, protocolos, avaliações e notas
            </p>
          </div>
          
          <AtendimentoTabs counts={counts} />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}
