"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Rating, RatingStats, RatingStatus } from "@/types/atendimento";
import { useRatings, useRatingStats, useRatingsRealtime } from "@/hooks/use-ratings";
import { Star, Search, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface RatingsClientProps {
  initialRatings: Rating[];
  initialStats: RatingStats;
}

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "responded", label: "Respondidos" },
];

export function RatingsClient({ initialRatings, initialStats }: RatingsClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RatingStatus | "all">("all");

  const { data: ratings, isLoading } = useRatings({
    status: status === "all" ? undefined : status,
  });

  const { data: stats } = useRatingStats();
  useRatingsRealtime().subscribe();

  const displayRatings = ratings?.ratings || initialRatings;
  const displayStats = stats || initialStats;

  const filteredRatings = displayRatings.filter((r) =>
    search === "" || r.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-amber-400" />;
      case "responded": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "expired": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const renderStars = (score: number | undefined, max: number) => {
    if (score === undefined) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < score ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={displayStats.total_requests} icon={TrendingUp} />
        <StatCard title="Respostas" value={displayStats.total_responses} icon={CheckCircle} color="emerald" />
        <StatCard title="Taxa de Resposta" value={`${displayStats.response_rate.toFixed(1)}%`} icon={Star} color="amber" />
        <StatCard title="NPS" value={displayStats.avg_nps_score.toFixed(0)} icon={TrendingUp} color="blue" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as RatingStatus | "all")}
          options={statusOptions}
          placeholder="Status"
          className="w-[200px]"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-4">
          {filteredRatings.map((rating) => (
            <motion.div
              key={rating.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(rating.status)}
                  <div>
                    <p className="font-medium">{rating.contact_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rating.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {rating.score !== undefined && renderStars(rating.score, rating.max_score)}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(rating.requested_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              {rating.feedback && (
                <p className="mt-3 text-sm text-muted-foreground border-t border-border/50 pt-2">
                  "{rating.feedback}"
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "emerald" }: { title: string; value: string | number; icon: React.ElementType; color?: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
  };
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${colorClasses[color] || colorClasses.emerald}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
