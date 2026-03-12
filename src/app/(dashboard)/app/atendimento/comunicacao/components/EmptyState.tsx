"use client";

import { MessageSquare, Users, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onToggleSidebar: () => void;
}

export function EmptyState({ onToggleSidebar }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <MessageSquare className="w-10 h-10 text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        Comunicação Interna
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-8">
        Selecione um canal ou um membro da equipe para iniciar uma conversa.
        Use o chat para comunicação rápida e colaboração em tempo real.
      </p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span>Canais</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span>Mensagens Diretas</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-8 lg:hidden"
        onClick={onToggleSidebar}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Abrir Menu
      </Button>
    </div>
  );
}
