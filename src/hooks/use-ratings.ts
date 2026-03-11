"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Rating, RatingStats, RatingType, RatingStatus } from "@/types/atendimento";
import { toast } from "sonner";

// Query keys
export const ratingKeys = {
  all: ["ratings"] as const,
  list: (filters?: Record<string, unknown>) => [...ratingKeys.all, "list", filters] as const,
  stats: () => [...ratingKeys.all, "stats"] as const,
  detail: (id: string) => [...ratingKeys.all, "detail", id] as const,
};

// Fetch ratings with filters
async function fetchRatings(filters?: {
  status?: RatingStatus;
  type?: RatingType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from("ratings")
    .select(`
      *,
      contact:contacts(name, phone, avatar),
      requester:profiles(name)
    `, { count: "exact" })
    .order("requested_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  
  if (filters?.dateFrom) {
    query = query.gte("requested_at", filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    query = query.lte("requested_at", filters.dateTo);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  const ratings: Rating[] = (data || []).map((item) => ({
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
  
  return { ratings, count: count || 0 };
}

// Fetch rating stats
async function fetchRatingStats(): Promise<RatingStats> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("ratings")
    .select("type, score, max_score, status");
  
  if (error) throw error;
  
  const stats: RatingStats = {
    total_requests: data?.length || 0,
    total_responses: 0,
    response_rate: 0,
    avg_nps_score: 0,
    avg_star_rating: 0,
    nps_distribution: { promoters: 0, passives: 0, detractors: 0 },
    ratings_by_period: [],
  };
  
  let npsScores: number[] = [];
  let starScores: number[] = [];
  
  data?.forEach((rating) => {
    if (rating.status === "responded") {
      stats.total_responses++;
      
      if (rating.type === "nps" && rating.score !== null) {
        npsScores.push(rating.score);
        
        // NPS categories
        if (rating.score >= 9) stats.nps_distribution.promoters++;
        else if (rating.score >= 7) stats.nps_distribution.passives++;
        else stats.nps_distribution.detractors++;
      }
      
      if (rating.type === "stars" && rating.score !== null) {
        starScores.push(rating.score);
      }
    }
  });
  
  stats.response_rate = stats.total_requests > 0 
    ? (stats.total_responses / stats.total_requests) * 100 
    : 0;
  
  // Calculate NPS score (-100 to 100)
  if (stats.total_responses > 0) {
    const promoterPct = (stats.nps_distribution.promoters / stats.total_responses) * 100;
    const detractorPct = (stats.nps_distribution.detractors / stats.total_responses) * 100;
    stats.avg_nps_score = promoterPct - detractorPct;
  }
  
  // Calculate average star rating
  if (starScores.length > 0) {
    stats.avg_star_rating = starScores.reduce((a, b) => a + b, 0) / starScores.length;
  }
  
  return stats;
}

// Request rating
async function requestRating(data: {
  conversation_id: string;
  contact_id: string;
  type: RatingType;
  message?: string;
  requested_by: string;
}) {
  const supabase = createClient();
  
  const maxScore = data.type === "nps" ? 10 : data.type === "stars" ? 5 : 5;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
  
  const { data: rating, error } = await supabase
    .from("ratings")
    .insert({
      conversation_id: data.conversation_id,
      contact_id: data.contact_id,
      type: data.type,
      max_score: maxScore,
      status: "pending",
      requested_by: data.requested_by,
      requested_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      message_sent: data.message,
    })
    .select()
    .single();
  
  if (error) throw error;
  return rating;
}

// ============================================
// Hooks
// ============================================

export function useRatings(filters?: {
  status?: RatingStatus;
  type?: RatingType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ratingKeys.list(filters),
    queryFn: () => fetchRatings(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRatingStats() {
  return useQuery({
    queryKey: ratingKeys.stats(),
    queryFn: fetchRatingStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestRating() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: requestRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      toast.success("Avaliação solicitada!");
    },
    onError: (error) => {
      toast.error("Erro ao solicitar avaliação", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

// Realtime subscription
export function useRatingsRealtime() {
  const queryClient = useQueryClient();
  
  return {
    subscribe: () => {
      const supabase = createClient();
      
      const subscription = supabase
        .channel("ratings_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ratings" },
          () => {
            queryClient.invalidateQueries({ queryKey: ratingKeys.all });
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    },
  };
}
