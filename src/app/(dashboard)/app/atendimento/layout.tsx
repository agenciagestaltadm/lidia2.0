import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AtendimentoTabs } from "./components/atendimento-tabs";
import { Breadcrumbs } from "./components/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Atendimento - LIDIA",
  description: "Gestão de atendimentos, funil de vendas, protocolos, avaliações e notas",
};

interface AtendimentoLayoutProps {
  children: React.ReactNode;
}

// Cache counts for 30 seconds to reduce database load
const getCachedCounts = unstable_cache(
  async (companyId: string, isSuperAdmin: boolean) => {
    const supabase = await createClient();

    // Build queries with company filter for non-super admins
    const funnelQuery = isSuperAdmin
      ? supabase.from("sales_funnel").select("*", { count: "exact", head: true })
      : supabase.from("sales_funnel").select("*", { count: "exact", head: true }).eq("company_id", companyId);

    const protocolQuery = isSuperAdmin
      ? supabase.from("protocols").select("*", { count: "exact", head: true }).eq("status", "active")
      : supabase.from("protocols").select("*", { count: "exact", head: true }).eq("status", "active").eq("company_id", companyId);

    const ratingQuery = isSuperAdmin
      ? supabase.from("ratings").select("*", { count: "exact", head: true }).eq("status", "pending")
      : supabase.from("ratings").select("*", { count: "exact", head: true }).eq("status", "pending").eq("company_id", companyId);

    const noteQuery = isSuperAdmin
      ? supabase.from("notes").select("*", { count: "exact", head: true })
      : supabase.from("notes").select("*", { count: "exact", head: true }).eq("company_id", companyId);

    const [
      { count: funnelCount, error: funnelError },
      { count: protocolCount, error: protocolError },
      { count: ratingCount, error: ratingError },
      { count: noteCount, error: noteError },
    ] = await Promise.all([funnelQuery, protocolQuery, ratingQuery, noteQuery]);

    // Log errors but don't fail - return 0 for failed queries
    if (funnelError) console.error("Error fetching funnel count:", funnelError);
    if (protocolError) console.error("Error fetching protocol count:", protocolError);
    if (ratingError) console.error("Error fetching rating count:", ratingError);
    if (noteError) console.error("Error fetching note count:", noteError);

    return {
      funnel: funnelCount || 0,
      protocols: protocolCount || 0,
      ratings: ratingCount || 0,
      notes: noteCount || 0,
    };
  },
  ["atendimento-counts"],
  { revalidate: 30 }
);

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

  // Get user profile with role and company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    redirect("/login");
  }

  // Check permissions - super_admin can access everything
  // admin and attendant can access based on their company
  const isSuperAdmin = profile.role === "super_admin";
  const isAdmin = profile.role === "admin";
  const isAttendant = profile.role === "attendant";

  if (!isSuperAdmin && !isAdmin && !isAttendant) {
    // User doesn't have permission to access atendimento
    redirect("/app/central");
  }

  // Ensure company_id exists for non-super admins
  if (!isSuperAdmin && !profile.company_id) {
    console.error("Non-super admin user without company_id:", user.id);
    redirect("/app/central");
  }

  // Fetch cached counts
  let counts;
  try {
    counts = await getCachedCounts(profile.company_id || "", isSuperAdmin);
  } catch (error) {
    console.error("Error fetching counts:", error);
    // Fallback to zero counts if cache fails
    counts = { funnel: 0, protocols: 0, ratings: 0, notes: 0 };
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col gap-4 px-6 py-4">
          <Breadcrumbs />
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Atendimento</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestão completa do funil de vendas, protocolos, avaliações e notas
            </p>
          </div>

          <AtendimentoTabs counts={counts} userRole={profile.role} />
        </div>
      </div>

      {/* Page content with error boundary */}
      <div className="flex-1 p-6 overflow-auto">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
