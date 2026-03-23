import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SalesFunnelClient } from "./components/sales-funnel-client";
import { ErrorComponent } from "../components/error-component";
import type { SalesFunnelDeal, FunnelStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Funil de Vendas - LIDIA",
  description: "Gestão do funil de vendas e oportunidades",
};

// Cache deals data for 10 seconds
const getCachedDeals = unstable_cache(
  async (isSuperAdmin: boolean, companyId: string) => {
    const supabase = await createClient();

    let query = supabase
      .from("sales_funnel")
      .select(`
        *,
        contact:contacts(id, name, phone, avatar),
        assignee:profiles(id, name, avatar)
      `)
      .order("updated_at", { ascending: false });

    if (!isSuperAdmin && companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      throw new Error("Falha ao carregar oportunidades do funil");
    }

    return data || [];
  },
  ["sales-funnel-deals"],
  { revalidate: 10 }
);

export default async function FunilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
    // Fetch cached deals data
    const dealsData = await getCachedDeals(isSuperAdmin, profile.company_id || "");

    // Transform data
    const deals: SalesFunnelDeal[] = dealsData.map((item) => ({
      id: item.id,
      contact_id: item.contact_id,
      contact_name: item.contact?.name || "Desconhecido",
      contact_phone: item.contact?.phone || "",
      contact_avatar: item.contact?.avatar,
      stage: item.stage,
      probability: item.probability,
      estimated_value: item.estimated_value,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
      assigned_to: item.assigned_to,
      assigned_name: item.assignee?.name,
      assigned_avatar: item.assignee?.avatar,
      expected_close_date: item.expected_close_date,
      last_activity: item.last_activity,
      tags: item.tags,
    }));

    // Calculate stats
    const stats: FunnelStats = {
      total_deals: deals.length,
      total_value: deals.reduce((sum, d) => sum + d.estimated_value, 0),
      weighted_value: deals.reduce((sum, d) => sum + (d.estimated_value * d.probability / 100), 0),
      conversion_rate: 0,
      avg_deal_value: deals.length > 0 ? deals.reduce((sum, d) => sum + d.estimated_value, 0) / deals.length : 0,
      deals_by_stage: {
        new: deals.filter((d) => d.stage === "new").length,
        qualified: deals.filter((d) => d.stage === "qualified").length,
        proposal: deals.filter((d) => d.stage === "proposal").length,
        negotiation: deals.filter((d) => d.stage === "negotiation").length,
        closed_won: deals.filter((d) => d.stage === "closed_won").length,
        closed_lost: deals.filter((d) => d.stage === "closed_lost").length,
      },
      value_by_stage: {
        new: deals.filter((d) => d.stage === "new").reduce((sum, d) => sum + d.estimated_value, 0),
        qualified: deals.filter((d) => d.stage === "qualified").reduce((sum, d) => sum + d.estimated_value, 0),
        proposal: deals.filter((d) => d.stage === "proposal").reduce((sum, d) => sum + d.estimated_value, 0),
        negotiation: deals.filter((d) => d.stage === "negotiation").reduce((sum, d) => sum + d.estimated_value, 0),
        closed_won: deals.filter((d) => d.stage === "closed_won").reduce((sum, d) => sum + d.estimated_value, 0),
        closed_lost: deals.filter((d) => d.stage === "closed_lost").reduce((sum, d) => sum + d.estimated_value, 0),
      },
    };

    const won = stats.deals_by_stage.closed_won;
    const lost = stats.deals_by_stage.closed_lost;
    stats.conversion_rate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

    // Fetch users for assignment
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, avatar")
      .eq("status", "active");

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    return (
      <SalesFunnelClient
        initialDeals={deals}
        initialStats={stats}
        users={users || []}
      />
    );
  } catch (error) {
    console.error("Error in FunilPage:", error);
    return (
      <ErrorComponent
        error={error instanceof Error ? error.message : "Erro ao carregar o funil de vendas"}
      />
    );
  }
}
