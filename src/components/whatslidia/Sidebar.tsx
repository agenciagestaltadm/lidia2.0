"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatView } from "@/types/chat";
import {
  MessageSquare,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  currentView: ChatView;
  onViewChange: (view: ChatView) => void;
  onExit: () => void;
}

interface NavItem {
  id: ChatView;
  icon: React.ElementType;
  label: string;
  number: number;
}

const navItems: NavItem[] = [
  { id: "conversations", icon: MessageSquare, label: "Conversas", number: 1 },
  { id: "contacts", icon: Users, label: "Contatos Cadastrados", number: 2 },
  { id: "tasks", icon: ClipboardCheck, label: "Criar Tarefas", number: 3 },
  { id: "settings", icon: Settings, label: "Configurações", number: 4 },
];

export function Sidebar({ currentView, onViewChange, onExit }: SidebarProps) {
  const { user } = useAuth();

  return (
    <motion.aside
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-[72px] h-full flex flex-col bg-[#1a1a1a] dark:bg-[#1a1a1a] border-r border-[#2a2a2a] dark:border-[#2a2a2a] shrink-0"
    >
      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group",
                isActive
                  ? "bg-[#00a884] text-white shadow-lg shadow-[#00a884]/20"
                  : "text-[#8696a0] hover:bg-[#2a2a2a] hover:text-[#e9edef]"
              )}
              title={item.label}
            >
              {/* Number Badge */}
              <span
                className={cn(
                  "absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                  isActive
                    ? "bg-white text-[#00a884]"
                    : "bg-[#00a884] text-white"
                )}
              >
                {item.number}
              </span>

              <Icon className="w-5 h-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-[#2a2a2a] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                {item.label}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#2a2a2a] rotate-45" />
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center py-4 gap-2 border-t border-[#2a2a2a]">
        {/* Exit Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onExit}
          className="relative w-12 h-12 rounded-xl flex items-center justify-center text-[#8696a0] hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
          title="Sair do Atendimento"
        >
          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
            6
          </span>
          <LogOut className="w-5 h-5" />

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-3 py-2 bg-[#2a2a2a] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
            Sair do Atendimento
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#2a2a2a] rotate-45" />
          </div>
        </motion.button>

        {/* Agent Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 group relative"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#2a2a2a] cursor-pointer hover:ring-[#00a884] transition-all">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#1a1a1a]" />

          {/* Tooltip with agent name */}
          <div className="absolute left-full ml-3 px-3 py-2 bg-[#2a2a2a] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
            {user?.name || "Agente"}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#2a2a2a] rotate-45" />
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}
