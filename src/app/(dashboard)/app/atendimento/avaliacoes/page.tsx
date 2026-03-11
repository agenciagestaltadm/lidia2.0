import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RatingsClient } from "./components/ratings-client";
import type { Rating, RatingStats } from "@/types/atendimento";

export const metadata: Metadata = {
  title: "Avaliações - LIDIA",
  description: "Gestão de avaliações e NPS",
};

export default async function AvaliacoesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ratingsData } = await supabase
    .from("ratings")
    .select(`*, contact:contacts(name, phone, avatar), requester:profiles(name)`)
    .order("requested_at", { ascending: false })
    .limit(50);

  const ratings: Rating[] = (ratingsData || []).map((item) => ({
    id: item.id,
    conversation_id: item.conversation_id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    type: item.type,
    status: item.status,
    score: item.score,
    max_score: item.max_score,
    feedback: item.feedback,
    requested_by: item.requested_by,
    requested_by_name: item.requester?.name || "Unknown",
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
}
