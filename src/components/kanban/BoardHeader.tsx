"use client";

import { useState } from "react";
import { KanbanBoard } from "@/hooks/use-kanban";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Users,
  Settings,
  Wifi,
  WifiOff,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanFilters } from "./KanbanFilters";

interface BoardHeaderProps {
  board: KanbanBoard;
  isConnected: boolean;
  onAddColumn: () => void;
}

export function BoardHeader({ board, isConnected, onAddColumn }: BoardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Row - Title and Actions */}
      <GlassCard className="p-4" hover={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <GlowBadge variant="green">Kanban</GlowBadge>
                {!isConnected && (
                  <GlowBadge variant="red" className="text-xs">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </GlowBadge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {board.name}
              </h1>
              {board.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                isConnected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}
            >
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              {isConnected ? "Sincronizado" : "Desconectado"}
            </div>

            {/* Members Button */}
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Membros</span>
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Configurações do Board</DropdownMenuItem>
                <DropdownMenuItem>Gerenciar Etiquetas</DropdownMenuItem>
                <DropdownMenuItem>Arquivar Cards Concluídos</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Arquivar Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Column Button */}
            <Button
              onClick={onAddColumn}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Coluna</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="w-4 h-4" />
                  Mais
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exportar Board</DropdownMenuItem>
                <DropdownMenuItem>Duplicar Board</DropdownMenuItem>
                <DropdownMenuItem>Ver Atividade</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </GlassCard>

      {/* Filters Panel */}
      {showFilters && (
        <KanbanFilters
          onClose={() => setShowFilters(false)}
          boardId={board.id}
        />
      )}
    </div>
  );
}
