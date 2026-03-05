"use client";

export const dynamic = "force-dynamic";

import { useCallback } from "react";
import { MessageSquare, Clock, CheckCircle, Plus, Send, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";

interface DashboardStats {
  openAttendances: number;
  waitingResponse: number;
  closedToday: number;
}

export default function ClientCentralPage() {
  const today = new Date().toISOString().split("T")[0];

  const fetchStats = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    const today = new Date().toISOString().split("T")[0];

    const [openResult, pendingResult, closedResult] = await Promise.allSettled([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "OPEN"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "CLOSED")
        .gte("updated_at", today),
    ]);

    const openCount = openResult.status === "fulfilled" ? openResult.value.count : 0;
    const waitingCount = pendingResult.status === "fulfilled" ? pendingResult.value.count : 0;
    const closedCount = closedResult.status === "fulfilled" ? closedResult.value.count : 0;

    return {
      openAttendances: openCount || 0,
      waitingResponse: waitingCount || 0,
      closedToday: closedCount || 0,
    };
  }, []);

  const { data: stats, loading, error, refetch } = useSupabaseQuery<DashboardStats>(
    fetchStats,
    [today],
    { timeout: 15000, retries: 3 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central</h1>
          <p className="text-muted-foreground">
            Resumo do dia e atalhos rápidos
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error.message}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
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
            <div className="text-2xl font-bold">{stats?.openAttendances ?? 0}</div>
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
            <div className="text-2xl font-bold">{stats?.waitingResponse ?? 0}</div>
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
            <div className="text-2xl font-bold">{stats?.closedToday ?? 0}</div>
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
