"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  FileCheck,
  Star,
  StickyNote,
  MessageSquare,
  Users,
} from "lucide-react";

interface AtendimentoTabsProps {
  counts: {
    funnel: number;
    protocols: number;
    ratings: number;
    notes: number;
    chat?: number;
  };
}

const tabs = [
  {
    href: "/app/attendances",
    label: "Conversas",
    icon: MessageSquare,
    count: null,
    exact: true,
  },
  {
    href: "/app/atendimento/funil",
    label: "Funil de Vendas",
    icon: TrendingUp,
    countKey: "funnel" as const,
  },
  {
    href: "/app/atendimento/protocolos",
    label: "Protocolos",
    icon: FileCheck,
    countKey: "protocols" as const,
  },
  {
    href: "/app/atendimento/avaliacoes",
    label: "Avaliações",
    icon: Star,
    countKey: "ratings" as const,
  },
  {
    href: "/app/atendimento/notas",
    label: "Notas",
    icon: StickyNote,
    countKey: "notes" as const,
  },
  {
    href: "/app/atendimento/chat",
    label: "Chat Interno",
    icon: Users,
    countKey: "chat" as const,
  },
];

export function AtendimentoTabs({ counts }: AtendimentoTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.exact 
          ? pathname === tab.href 
          : pathname.startsWith(tab.href);
        
        const count = tab.countKey ? counts[tab.countKey] : 0;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
              isActive
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            
            {count && count > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold bg-emerald-500 text-white rounded-full">
                {count > 99 ? "99+" : count}
              </span>
            )}
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
