"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Protocol, ProtocolStats } from "@/types/atendimento";
import { useProtocols, useProtocolStats, useProtocolsRealtime } from "@/hooks/use-protocols";
import { FileCheck, Search, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ProtocolsClientProps {
  initialProtocols: Protocol[];
  initialStats: ProtocolStats;
}

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "expired", label: "Expirados" },
  { value: "resolved", label: "Resolvidos" },
];

export function ProtocolsClient({ initialProtocols, initialStats }: ProtocolsClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "expired" | "resolved">("all");

  const { data: protocols, isLoading } = useProtocols({
    status: status === "all" ? undefined : status,
  });

  const { data: stats } = useProtocolStats();
  useProtocolsRealtime().subscribe();

  const displayProtocols = protocols?.protocols || initialProtocols;
  const displayStats = stats || initialStats;

  const filteredProtocols = displayProtocols.filter((p) =>
    search === "" ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="w-4 h-4 text-blue-400" />;
      case "resolved": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "expired": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={displayStats.total_protocols} icon={FileCheck} />
        <StatCard title="Ativos" value={displayStats.active_count} icon={Clock} color="blue" />
        <StatCard title="Resolvidos" value={displayStats.resolved_count} icon={CheckCircle} color="emerald" />
        <StatCard title="Expirados" value={displayStats.expired_count} icon={AlertCircle} color="red" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as typeof status)}
          options={statusOptions}
          placeholder="Status"
          className="w-[200px]"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-4">
          {filteredProtocols.map((protocol) => (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(protocol.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{protocol.code}</span>
                      <button
                        onClick={() => copyToClipboard(protocol.code)}
                        className="text-muted-foreground hover:text-emerald-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{protocol.contact_name}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{new Date(protocol.created_at).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs">por {protocol.sent_by_name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "emerald" }: { title: string; value: number; icon: React.ElementType; color?: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    red: "text-red-400",
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
