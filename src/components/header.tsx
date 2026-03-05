"use client";

import { motion } from "framer-motion";
import { Menu, Bell, Search, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  
  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "central";
    const titles: Record<string, string> = {
      central: "Central",
      attendances: "Atendimentos",
      contacts: "Contatos",
      bulk: "Disparo Bulk",
      kanban: "Kanban",
      connection: "Canal de Conexão",
      users: "Usuários",
      settings: "Configurações",
    };
    return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <motion.header 
      className="sticky top-0 z-30 h-16 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onMenuClick}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
            title="Colapsar sidebar"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                LIDIA CRM Futuristic Edition
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Notifications */}
          <Link
            href="/app/attendances"
            className={cn(
              "relative p-2 rounded-lg transition-colors",
              pathname === "/app/attendances"
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </Link>

          {/* User Avatar */}
          <Link
            href="/app/settings"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              U
            </div>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
