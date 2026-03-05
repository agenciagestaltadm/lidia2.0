"use client";

import { motion } from "framer-motion";
import { Menu, Bell, Crown, ChevronDown, LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/glass-card";
import { AnimatePresence, motion as motionDiv } from "framer-motion";

interface SuperHeaderProps {
  onMenuClick: () => void;
}

export function SuperHeader({ onMenuClick }: SuperHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "plans";
    const titles: Record<string, string> = {
      plans: "Planos do Super Usuário",
      companies: "Empresas",
      "company-users": "Usuários Cadastrados na Empresa",
      "api-waba": "API WABA: Canal de Conexão",
      settings: "Configurações de Tudo",
    };
    return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <motion.header 
      className="sticky top-0 z-30 h-16 border-b border-emerald-500/15 bg-black/80 backdrop-blur-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onMenuClick}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
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
                border: "1px solid rgba(16,185,129,0.4)",
              }}
            >
              <Crown className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Super Admin Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Online toggle */}
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-300",
                isOnline ? "bg-emerald-500/30" : "bg-slate-700"
              )}
            >
              <motion.div
                animate={{ x: isOnline ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full transition-colors",
                  isOnline ? "bg-emerald-400" : "bg-slate-500"
                )}
              />
            </button>
            <span className={cn(
              "text-sm hidden sm:block",
              isOnline ? "text-emerald-400" : "text-slate-500"
            )}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                }}
              >
                S
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                showProfileMenu && "rotate-180"
              )} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motionDiv.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 z-50"
                >
                  <GlassCard className="p-2" hover={false}>
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-sm font-medium text-white">Super Usuário</p>
                      <p className="text-xs text-slate-400">super@lidia.com</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/super/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Configurações
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </GlassCard>
                </motionDiv.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
