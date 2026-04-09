"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface WebhookEvent {
  id: string;
  label: string;
  version: string;
  description: string;
}

interface WebhookEventToggleProps {
  event: WebhookEvent;
  isActive: boolean;
  onToggle: (eventId: string, isActive: boolean) => void;
  disabled?: boolean;
}

export function WebhookEventToggle({
  event,
  isActive,
  onToggle,
  disabled = false
}: WebhookEventToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      onToggle(event.id, !isActive);
    }
  }, [event.id, isActive, onToggle, disabled]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all",
          isActive
            ? "dark:bg-emerald-500/10 bg-emerald-50 dark:border-emerald-500/30 border-emerald-200"
            : "dark:bg-white/5 bg-slate-50 dark:border-white/10 border-slate-200",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:dark:bg-white/10 hover:bg-slate-100"
        )}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isActive ? "bg-emerald-500" : "bg-slate-400"
            )}
          />
          
          {/* Event Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium text-sm",
                isActive ? "dark:text-white text-slate-900" : "dark:text-slate-300 text-slate-600"
              )}>
                {event.label}
              </span>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="dark:text-slate-500 text-slate-400 hover:dark:text-slate-300 hover:text-slate-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{event.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <span className="text-xs dark:text-slate-500 text-slate-400">
              {event.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Version Badge */}
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            isActive
              ? "dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-600"
              : "dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500"
          )}>
            {event.version}
          </span>

          {/* Toggle Switch */}
          <div
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              isActive ? "bg-emerald-500" : "dark:bg-slate-600 bg-slate-300"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                isActive ? "translate-x-6" : "translate-x-1"
              )}
            />
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-600"
                : "dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500"
            )}
          >
            {isActive ? (
              <>
                <Check className="w-3 h-3" />
                <span>Assinado</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                <span>Não assinado</span>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Group of webhook events
interface WebhookEventGroupProps {
  title: string;
  description?: string;
  events: WebhookEvent[];
  activeEvents: string[];
  onToggle: (eventId: string, isActive: boolean) => void;
  disabled?: boolean;
}

export function WebhookEventGroup({
  title,
  description,
  events,
  activeEvents,
  onToggle,
  disabled
}: WebhookEventGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium dark:text-white text-slate-900">{title}</h4>
          {description && (
            <p className="text-sm dark:text-slate-400 text-slate-500">{description}</p>
          )}
        </div>
        <span className="text-xs dark:text-slate-500 text-slate-400">
          {activeEvents.filter(id => events.some(e => e.id === id)).length} de {events.length} ativos
        </span>
      </div>
      
      <div className="space-y-2">
        {events.map((event) => (
          <WebhookEventToggle
            key={event.id}
            event={event}
            isActive={activeEvents.includes(event.id)}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Main webhook configuration component
interface WebhookConfigurationProps {
  events: WebhookEvent[];
  activeEvents: string[];
  onEventsChange: (events: string[]) => void;
  disabled?: boolean;
}

export function WebhookConfiguration({
  events,
  activeEvents,
  onEventsChange,
  disabled
}: WebhookConfigurationProps) {
  const handleToggle = useCallback((eventId: string, isActive: boolean) => {
    if (isActive) {
      onEventsChange([...activeEvents, eventId]);
    } else {
      onEventsChange(activeEvents.filter(id => id !== eventId));
    }
  }, [activeEvents, onEventsChange]);

  // Group events by category
  const messageEvents = events.filter(e => 
    e.id.includes("message") || e.id === "messaging_handovers"
  );
  
  const accountEvents = events.filter(e => 
    e.id.includes("account") || e.id.includes("business")
  );
  
  const phoneEvents = events.filter(e => 
    e.id.includes("phone")
  );
  
  const otherEvents = events.filter(e => 
    !messageEvents.includes(e) && 
    !accountEvents.includes(e) && 
    !phoneEvents.includes(e)
  );

  return (
    <div className="space-y-6">
      <WebhookEventGroup
        title="Mensagens"
        description="Eventos relacionados ao recebimento e status de mensagens"
        events={messageEvents}
        activeEvents={activeEvents}
        onToggle={handleToggle}
        disabled={disabled}
      />
      
      <div className="border-t dark:border-white/10 border-slate-200" />
      
      <WebhookEventGroup
        title="Conta e Negócio"
        description="Eventos relacionados à conta WhatsApp Business"
        events={accountEvents}
        activeEvents={activeEvents}
        onToggle={handleToggle}
        disabled={disabled}
      />
      
      <div className="border-t dark:border-white/10 border-slate-200" />
      
      <WebhookEventGroup
        title="Número de Telefone"
        description="Eventos relacionados ao número de telefone"
        events={phoneEvents}
        activeEvents={activeEvents}
        onToggle={handleToggle}
        disabled={disabled}
      />
      
      {otherEvents.length > 0 && (
        <>
          <div className="border-t dark:border-white/10 border-slate-200" />
          <WebhookEventGroup
            title="Outros Eventos"
            events={otherEvents}
            activeEvents={activeEvents}
            onToggle={handleToggle}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}
