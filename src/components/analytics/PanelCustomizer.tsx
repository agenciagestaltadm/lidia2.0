"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboardLayout, WidgetType, WidgetConfig } from "@/hooks/use-dashboard-layout";

interface PanelCustomizerProps {
  layout: ReturnType<typeof useDashboardLayout>;
}

/**
 * Componente para personalizar os painéis do dashboard.
 * 
 * Permite:
 * - Mostrar/ocultar widgets individualmente
 * - Reorganizar a ordem dos widgets (drag & drop básico)
 * - Restaurar layout padrão
 */
export function PanelCustomizer({ layout }: PanelCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { widgets, toggleWidget, resetLayout } = layout;

  const visibleCount = widgets.filter((w) => w.visible).length;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "dark:border-emerald-500/30 border-emerald-200",
          isOpen && "dark:bg-emerald-500/20 bg-emerald-100"
        )}
      >
        <Settings2 className="w-4 h-4 mr-2" />
        Personalizar Painéis
        <span className="ml-2 text-xs dark:text-slate-400 text-slate-500">
          ({visibleCount}/{widgets.length})
        </span>
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute right-0 top-full mt-2 w-80 z-50 rounded-xl shadow-xl",
                "dark:bg-[#0a0a0a] bg-white",
                "border dark:border-emerald-500/20 border-slate-200",
                "overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-emerald-500/10 border-slate-200">
                <h3 className="font-medium dark:text-slate-200 text-slate-800">
                  Configurar Painéis
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetLayout}
                    className="h-8 px-2 dark:text-slate-400 text-slate-500"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restaurar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 dark:text-slate-400 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Widget List */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget) => (
                    <WidgetItem
                      key={widget.id}
                      widget={widget}
                      onToggle={() => toggleWidget(widget.id)}
                    />
                  ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t dark:border-emerald-500/10 border-slate-200 bg-slate-50/50 dark:bg-white/5">
                <p className="text-xs dark:text-slate-500 text-slate-400">
                  {visibleCount} de {widgets.length} painéis visíveis
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface WidgetItemProps {
  widget: WidgetConfig;
  onToggle: () => void;
}

function WidgetItem({ widget, onToggle }: WidgetItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1",
        "transition-colors duration-200",
        "hover:dark:bg-white/5 hover:bg-slate-100",
        widget.visible ? "opacity-100" : "opacity-60"
      )}
    >
      {/* Drag Handle */}
      <GripVertical className="w-4 h-4 dark:text-slate-600 text-slate-400 cursor-grab" />

      {/* Widget Name */}
      <span className="flex-1 text-sm dark:text-slate-300 text-slate-700 truncate">
        {widget.title}
      </span>

      {/* Toggle Visibility */}
      <button
        onClick={onToggle}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          widget.visible
            ? "dark:text-emerald-400 text-emerald-600 dark:bg-emerald-500/10 bg-emerald-100"
            : "dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600"
        )}
        title={widget.visible ? "Ocultar painel" : "Mostrar painel"}
      >
        {widget.visible ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
