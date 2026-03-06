"use client";

import { motion } from "framer-motion";
import { Menu, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/glass-card";
import { AnimatePresence, motion as motionDiv } from "framer-motion";
import { ThemeToggleSwitch } from "./theme-toggle-switch";

interface SuperHeaderProps {
  onMenuClick: () => void;
}

export function SuperHeader({ onMenuClick }: SuperHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "plans";
    const titles: Record<string, string> = {
      plans: "Planos",
      companies: "Empresas",
      "company-users": "Usuários Cadastrados das Empresas",
      "api-waba": "Canal de Conexão",
      settings: "Configurações",
      central: "Dashboard",
    };
    return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <motion.header 
      className="sticky top-0 z-30 h-16 border-b dark:border-emerald-500/15 border-slate-200 dark:bg-black/80 bg-white/80 backdrop-blur-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onMenuClick}
            className="hidden lg:flex p-2 rounded-lg dark:text-slate-400 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            whileTap={{ scale: 0.95 }}
            title="Colapsar sidebar"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
                border: "1px solid rgba(16,185,129,0.4)",
              }}
            >
              <Image
                src="/3.png"
                alt="LIDIA"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Super Admin Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2 mr-2">
            <ThemeToggleSwitch />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg dark:text-slate-400 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 transition-colors"
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
                    <div className="px-3 py-2 border-b dark:border-white/10 border-slate-200">
                      <p className="text-sm font-medium dark:text-white text-slate-900">Super Usuário</p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">super@lidia.com</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/super/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm dark:text-slate-300 text-slate-700 hover:dark:bg-white/5 hover:bg-slate-100 hover:dark:text-emerald-400 hover:text-emerald-600 transition-colors"
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
