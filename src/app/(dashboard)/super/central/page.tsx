"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Building2, Users, Radio, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  totalChannels: number;
  activeCompanies: number;
}

interface RecentEvent {
  id: string;
  action: string;
  created_by: string;
  created_at: string;
}

export default function SuperCentralPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalUsers: 0,
    totalChannels: 0,
    activeCompanies: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch companies count
      const { count: companiesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      const { count: activeCompaniesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch channels count
      const { count: channelsCount } = await supabase
        .from("channels")
        .select("*", { count: "exact", head: true });

      // Fetch recent events
      const { data: events } = await supabase
        .from("audit_logs")
        .select("id, action, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalCompanies: companiesCount || 0,
        totalUsers: usersCount || 0,
        totalChannels: channelsCount || 0,
        activeCompanies: activeCompaniesCount || 0,
      });

      setRecentEvents(events || []);
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
          Visão geral do sistema LIDIA 2.0
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas Ativas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCompanies}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalCompanies} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              em todas as empresas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Canais Conectados
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChannels}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp, Email, SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              nenhum alerta ativo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado recentemente.
            </p>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      por {event.created_by}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
