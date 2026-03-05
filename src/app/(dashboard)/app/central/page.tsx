"use client";

export const dynamic = "force-dynamic";

import { MessageSquare, Clock, CheckCircle, Plus, Send, Filter, Users, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientCentralPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao LIDIA CRM
        </p>
      </div>

      {/* Stats Cards - Valores estáticos por enquanto */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimentos Abertos
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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

      {/* Management Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Gerenciamento</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
            <a href="/app/companies">
              <Building className="h-6 w-6" />
              <span>Empresas</span>
            </a>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
            <a href="/app/users">
              <Users className="h-6 w-6" />
              <span>Usuários</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Primeiros passos</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Crie uma empresa em "Empresas"</li>
          <li>Adicione usuários em "Usuários"</li>
          <li>Configure os canais de comunicação</li>
          <li>Comece a gerenciar seus contatos</li>
        </ul>
      </div>
    </div>
  );
}
