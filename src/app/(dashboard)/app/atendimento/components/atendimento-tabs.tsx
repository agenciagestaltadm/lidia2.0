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
} from "lucide-react";

type UserRole = "super_admin" | "admin" | "attendant" | "user";

interface AtendimentoTabsProps {
  counts: {
    funnel: number;
    protocols: number;
    ratings: number;
    notes: number;
  };
  userRole: UserRole;
}

interface TabConfig {
  href: string;
  label: string;
  icon: React.ElementType;
  countKey?: keyof AtendimentoTabsProps["counts"];
  exact?: boolean;
  allowedRoles: UserRole[];
}

const tabs: TabConfig[] = [
  {
    href: "/app/attendances",
    label: "Conversas",
    icon: MessageSquare,
    exact: true,
    allowedRoles: ["super_admin", "admin", "attendant", "user"],
  },
  {
    href: "/app/atendimento/funil",
    label: "Funil de Vendas",
    icon: TrendingUp,
    countKey: "funnel",
    allowedRoles: ["super_admin", "admin", "attendant"],
  },
  {
    href: "/app/atendimento/protocolos",
    label: "Protocolos",
    icon: FileCheck,
    countKey: "protocols",
    allowedRoles: ["super_admin", "admin", "attendant"],
  },
  {
    href: "/app/atendimento/avaliacoes",
    label: "Avaliações",
    icon: Star,
    countKey: "ratings",
    allowedRoles: ["super_admin", "admin", "attendant"],
  },
  {
    href: "/app/atendimento/notas",
    label: "Notas",
    icon: StickyNote,
    countKey: "notes",
    allowedRoles: ["super_admin", "admin", "attendant"],
  },
];

export function AtendimentoTabs({ counts, userRole }: AtendimentoTabsProps) {
  const pathname = usePathname();

  // Filter tabs based on user role
  const visibleTabs = tabs.filter((tab) => tab.allowedRoles.includes(userRole));

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {visibleTabs.map((tab) => {
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

            {count > 0 && (
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
