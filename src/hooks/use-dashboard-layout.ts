"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lidia-dashboard-layout";

export type WidgetType =
  | "queue"
  | "user"
  | "status"
  | "channel-connection"
  | "channel-name"
  | "demand"
  | "channel-evolution"
  | "attendance-evolution"
  | "values-evolution"
  | "summary-cards"
  | "team-performance";

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: "queue", title: "Atendimento por Fila", visible: true, order: 1 },
    { id: "user", title: "Atendimento por Usuário", visible: true, order: 2 },
    { id: "status", title: "Atendimento por Status", visible: true, order: 3 },
    { id: "channel-connection", title: "Atendimento por Canal (Conexão)", visible: true, order: 4 },
    { id: "channel-name", title: "Atendimento por Canal (Nome)", visible: true, order: 5 },
    { id: "demand", title: "Atendimento por Demanda", visible: true, order: 6 },
    { id: "channel-evolution", title: "Evolução por Canal", visible: true, order: 7 },
    { id: "attendance-evolution", title: "Evolução de Atendimentos", visible: true, order: 8 },
    { id: "values-evolution", title: "Evolução de Valores", visible: true, order: 9 },
    { id: "summary-cards", title: "Resumo", visible: true, order: 0 },
    { id: "team-performance", title: "Desempenho da Equipe", visible: true, order: 10 },
  ],
};

export interface UseDashboardLayoutReturn {
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  isHydrated: boolean;
  toggleWidget: (id: WidgetType) => void;
  reorderWidgets: (newOrder: WidgetType[]) => void;
  resetLayout: () => void;
  getVisibleWidgets: () => WidgetConfig[];
}

/**
 * Hook para gerenciar o layout do dashboard com persistência em localStorage.
 * 
 * Features:
 * - Persiste a visibilidade e ordem dos widgets
 * - Permite reorganizar widgets
 * - Permite mostrar/ocultar widgets individualmente
 * - Hidratação segura para SSR
 */
export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratação do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Merge com o default para garantir que novos widgets apareçam
        const merged: DashboardLayout = {
          widgets: DEFAULT_LAYOUT.widgets.map((defaultWidget) => {
            const storedWidget = parsed.widgets.find((w) => w.id === defaultWidget.id);
            return storedWidget || defaultWidget;
          }),
        };
        setLayout(merged);
      }
    } catch (error) {
      console.warn("[useDashboardLayout] Failed to hydrate from localStorage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Persistir mudanças
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.warn("[useDashboardLayout] Failed to persist to localStorage:", error);
    }
  }, [layout, isHydrated]);

  const toggleWidget = useCallback((id: WidgetType) => {
    setLayout((prev) => ({
      widgets: prev.widgets.map((widget) =>
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      ),
    }));
  }, []);

  const reorderWidgets = useCallback((newOrder: WidgetType[]) => {
    setLayout((prev) => ({
      widgets: prev.widgets.map((widget) => ({
        ...widget,
        order: newOrder.indexOf(widget.id),
      })),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const getVisibleWidgets = useCallback(() => {
    return layout.widgets
      .filter((widget) => widget.visible)
      .sort((a, b) => a.order - b.order);
  }, [layout.widgets]);

  return {
    layout,
    widgets: layout.widgets,
    isHydrated,
    toggleWidget,
    reorderWidgets,
    resetLayout,
    getVisibleWidgets,
  };
}
