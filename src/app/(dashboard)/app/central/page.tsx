"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { MessageSquare, Clock, CheckCircle, Plus, Send, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  openAttendances: number;
  waitingResponse: number;
  closedToday: number;
}

export default function ClientCentralPage() {
  const [stats, setStats] = useState<DashboardStats>({
    openAttendances: 0,
    waitingResponse: 0,
    closedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Fetch open attendances
      const { count: openCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "OPEN");

      // Fetch waiting response
      const { count: waitingCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      // Fetch closed today
      const { count: closedCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "CLOSED")
        .gte("updated_at", today);

      setStats({
        openAttendances: openCount || 0,
        waitingResponse: waitingCount || 0,
        closedToday: closedCount || 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central</h1>
        <p className="text-muted-foreground">
          Resumo do dia e atalhos rápidos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimentos Abertos
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openAttendances}</div>
            <p className="text-xs text-muted-foreground">
              aguardando atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aguardando Resposta
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingResponse}</div>
            <p className="text-xs text-muted-foreground">
              pendentes de retorno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fechados Hoje
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedToday}</div>
            <p className="text-xs text-muted-foreground">
              atendimentos concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Atalhos Rápidos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
            <a href="/app/contacts/new">
              <Plus className="h-6 w-6" />
              <span>Novo Contato</span>
            </a>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
            <a href="/app/funnel/new">
              <Filter className="h-6 w-6" />
              <span>Novo Negócio</span>
            </a>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
            <a href="/app/bulk/new">
              <Send className="h-6 w-6" />
              <span>Criar Disparo</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
