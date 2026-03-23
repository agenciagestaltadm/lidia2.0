import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RatingsClient } from "./components/ratings-client";
import { ErrorComponent } from "../components/error-component";
import type { Rating, RatingStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Avaliações - LIDIA",
  description: "Gestão de avaliações e NPS",
};

// Cache ratings data for 10 seconds
const getCachedRatings = unstable_cache(
  async (isSuperAdmin: boolean, companyId: string) => {
    const supabase = await createClient();

    let query = supabase
      .from("ratings")
      .select(`*, contact:contacts(name, phone, avatar), requester:profiles(name)`)
      .order("requested_at", { ascending: false })
      .limit(50);

    if (!isSuperAdmin && companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching ratings:", error);
      throw new Error("Falha ao carregar avaliações");
    }

    return data || [];
  },
  ["ratings-data"],
  { revalidate: 10 }
);

export default async function AvaliacoesPage() {
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
    const ratingsData = await getCachedRatings(isSuperAdmin, profile.company_id || "");

    const ratings: Rating[] = ratingsData.map((item) => ({
      id: item.id,
      conversation_id: item.conversation_id,
      contact_id: item.contact_id,
      contact_name: item.contact?.name || "Desconhecido",
      contact_phone: item.contact?.phone || "",
      contact_avatar: item.contact?.avatar,
      type: item.type,
      status: item.status,
      score: item.score,
      max_score: item.max_score,
      feedback: item.feedback,
      requested_by: item.requested_by,
      requested_by_name: item.requester?.name || "Desconhecido",
      requested_at: item.requested_at,
      responded_at: item.responded_at,
      created_at: item.created_at,
      expires_at: item.expires_at,
      message_sent: item.message_sent,
    }));

    const stats: RatingStats = {
      total_requests: ratings.length,
      total_responses: ratings.filter((r) => r.status === "responded").length,
      response_rate: ratings.length > 0 ? (ratings.filter((r) => r.status === "responded").length / ratings.length) * 100 : 0,
      avg_nps_score: 0,
      avg_star_rating: 0,
      nps_distribution: { promoters: 0, passives: 0, detractors: 0 },
      ratings_by_period: [],
    };

    return <RatingsClient initialRatings={ratings} initialStats={stats} />;
  } catch (error) {
    console.error("Error in AvaliacoesPage:", error);
    return (
      <ErrorComponent
        error={error instanceof Error ? error.message : "Erro ao carregar avaliações"}
      />
    );
  }
}
