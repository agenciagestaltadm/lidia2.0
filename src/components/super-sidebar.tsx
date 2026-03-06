"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Building2,
  Users,
  Webhook,
  Settings,
  Menu,
  X,
  LogOut,
  Crown,
  Plug,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { drawerSlide, overlayFade, sidebarItem } from "@/lib/animations";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SuperSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Super user navigation items as per specification
const navItems: NavItem[] = [
  { href: "/super/plans", label: "Planos", icon: CreditCard },
  { href: "/super/companies", label: "Empresas", icon: Building2 },
  { href: "/super/company-users", label: "Usuários Cadastrados das Empresas", icon: Users },
  { href: "/super/api-waba", label: "Canal de Conexão", icon: Plug },
  { href: "/super/settings", label: "Configurações", icon: Settings },
];

export function SuperSidebar({ isOpen, onToggle }: SuperSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <motion.button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#0a0a0a]/80 border border-emerald-500/20 text-emerald-400"
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        variants={drawerSlide}
        initial={false}
        animate={isOpen ? "visible" : "hidden"}
        className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-emerald-500/15 bg-black/90 backdrop-blur-xl lg:translate-x-0"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-emerald-500/15 px-4">
            <Link href="/super/plans" className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
                  border: "1px solid rgba(16,185,129,0.4)",
                }}
              >
                <Crown className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-bold gradient-text">LIDIA</span>
                <span className="text-xs text-emerald-400 ml-1">SUPER</span>
              </div>
            </Link>
            <button
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-auto py-4 px-3">
            <div className="mb-4 px-3">
              <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">
                Administração
              </p>
            </div>
            <motion.ul 
              className="space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <motion.li 
                    key={item.href} 
                    variants={sidebarItem}
                    className="relative"
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="leading-tight">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="superActiveIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-400 rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-emerald-500/15 p-3">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
            <div className="pt-3 mt-2 border-t border-white/5">
              <p className="text-[10px] text-slate-600 text-center">
                LIDIA SUPER v2.0
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
