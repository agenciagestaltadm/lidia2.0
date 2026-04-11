"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SalesFunnelDeal, FunnelStats, FunnelStage } from "@/types/atendimento";
import {
  useSalesFunnel,
  useFunnelStats,
  useMoveDeal,
  useFunnelRealtime,
} from "@/hooks/use-sales-funnel";
import {
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesFunnelClientProps {
  initialDeals: SalesFunnelDeal[];
  initialStats: FunnelStats;
  users: { id: string; name: string; avatar?: string }[];
}

const funnelStages: { id: FunnelStage; label: string; color: string }[] = [
  { id: "new", label: "Novo Lead", color: "#3b82f6" },
  { id: "qualified", label: "Qualificado", color: "#06b6d4" },
  { id: "proposal", label: "Proposta", color: "#8b5cf6" },
  { id: "negotiation", label: "Negociação", color: "#f59e0b" },
  { id: "closed_won", label: "Ganho", color: "#10b981" },
  { id: "closed_lost", label: "Perdido", color: "#ef4444" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function SalesFunnelClient({
  initialDeals,
  initialStats,
  users,
}: SalesFunnelClientProps) {
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<FunnelStage | "all">("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const { data: deals, isLoading, error, refetch } = useSalesFunnel({
    stage: selectedStage === "all" ? undefined : selectedStage,
    assignedTo: selectedUser === "all" ? undefined : selectedUser,
    search: search || undefined,
  });

  const { data: stats } = useFunnelStats();
  const moveDeal = useMoveDeal();

  useEffect(() => {
    const unsubscribe = useFunnelRealtime().subscribe();
    return () => unsubscribe();
  }, []);

  const displayDeals = deals || initialDeals;
  const displayStats = stats || initialStats;

  const filteredDeals = displayDeals.filter((deal: SalesFunnelDeal) => {
    const matchesSearch = 
      search === "" ||
      deal.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      deal.contact_phone.includes(search);
    return matchesSearch;
  });

  const dealsByStage = funnelStages.map((stage) => ({
    ...stage,
    deals: filteredDeals.filter((d: SalesFunnelDeal) => d.stage === stage.id),
    totalValue: filteredDeals
      .filter((d: SalesFunnelDeal) => d.stage === stage.id)
      .reduce((sum: number, d: SalesFunnelDeal) => sum + d.estimated_value, 0),
  }));

  const stageOptions = [
    { value: "all", label: "Todos os estágios" },
    ...funnelStages.map((stage) => ({ value: stage.id, label: stage.label })),
  ];

  const userOptions = [
    { value: "all", label: "Todos" },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Negócios"
          value={displayStats.total_deals}
          icon={Target}
          trend={`${displayStats.deals_by_stage.closed_won} ganhos`}
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(displayStats.total_value)}
          icon={DollarSign}
          trend={`Ponderado: ${formatCurrency(displayStats.weighted_value)}`}
        />
        <StatCard
          title="Taxa de Conversão"
          value={formatPercentage(displayStats.conversion_rate)}
          icon={TrendingUp}
          trend="Baseado em ganhos/perdidos"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(displayStats.avg_deal_value)}
          icon={Users}
          trend="Por negócio"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedStage}
          onValueChange={(v) => setSelectedStage(v as FunnelStage | "all")}
          options={stageOptions}
          placeholder="Estágio"
          className="w-[200px]"
        />
        <Select
          value={selectedUser}
          onValueChange={setSelectedUser}
          options={userOptions}
          placeholder="Responsável"
          className="w-[200px]"
        />
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Negócio
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {dealsByStage.map((stage) => (
            <FunnelColumn
              key={stage.id}
              stage={stage}
              deals={stage.deals}
              totalValue={stage.totalValue}
              onMoveDeal={(dealId, newStage) => moveDeal.mutate({ id: dealId, stage: newStage })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: string;
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-emerald-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}

interface FunnelColumnProps {
  stage: { id: FunnelStage; label: string; color: string };
  deals: SalesFunnelDeal[];
  totalValue: number;
  onMoveDeal: (dealId: string, stage: FunnelStage) => void;
}

function FunnelColumn({ stage, deals, totalValue, onMoveDeal }: FunnelColumnProps) {
  const moveOptions = funnelStages
    .filter((s) => s.id !== stage.id)
    .map((s) => ({ value: s.id, label: `Mover para ${s.label}` }));

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-sm">{stage.label}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
          {deals.length}
        </span>
      </div>
      
      <div className="text-xs text-muted-foreground mb-4">
        {formatCurrency(totalValue)}
      </div>

      <div className="space-y-2">
        {deals.map((deal) => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            moveOptions={moveOptions}
            onMove={onMoveDeal} 
          />
        ))}
      </div>
    </div>
  );
}

interface DealCardProps {
  deal: SalesFunnelDeal;
  moveOptions: { value: string; label: string }[];
  onMove: (dealId: string, stage: FunnelStage) => void;
}

function DealCard({ deal, moveOptions, onMove }: DealCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-3 hover:border-emerald-500/30 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-medium">
            {deal.contact_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{deal.contact_name}</p>
            <p className="text-xs text-muted-foreground">{deal.contact_phone}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-400">
          {formatCurrency(deal.estimated_value)}
        </span>
        <span className="text-xs text-muted-foreground">
          {deal.probability}%
        </span>
      </div>

      {moveOptions.length > 0 && (
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Select
            value=""
            onValueChange={(v) => onMove(deal.id, v as FunnelStage)}
            options={[{ value: "", label: "Mover para..." }, ...moveOptions]}
            placeholder="Mover"
          />
        </div>
      )}

      {deal.assigned_name && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span className="truncate">{deal.assigned_name}</span>
        </div>
      )}
    </motion.div>
  );
}
