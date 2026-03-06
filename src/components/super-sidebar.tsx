"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  CreditCard,
  Building2,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Plug,
  LayoutDashboard,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SuperSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Super user navigation items
const navItems: NavItem[] = [
  { href: "/super/central", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super/plans", label: "Planos", icon: CreditCard },
  { href: "/super/companies", label: "Empresas", icon: Building2 },
  { href: "/super/company-users", label: "Usuários", icon: Users },
  { href: "/super/api-waba", label: "Conexões", icon: Plug },
  { href: "/super/settings", label: "Configurações", icon: Settings },
];

// Width constants
const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

export function SuperSidebar({ isOpen, onToggle }: SuperSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay with blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 dark:bg-black/70 bg-slate-900/70 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <motion.button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl dark:bg-[#0a0a0a]/90 bg-white/90 border dark:border-emerald-500/30 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Desktop Sidebar with smooth width animation */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="fixed left-0 top-0 z-50 h-screen border-r dark:border-emerald-500/15 border-slate-200 dark:bg-gradient-to-b from-black/95 to-black/90 bg-white backdrop-blur-2xl hidden lg:flex flex-col overflow-hidden"
      >
        {/* Glass effect overlay */}
        <div className="absolute inset-0 dark:bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 bg-gradient-to-br from-emerald-500/3 via-transparent to-emerald-500/3 pointer-events-none" />

        {/* Header */}
        <div className="relative flex h-20 items-center justify-between dark:border-emerald-500/15 border-slate-200 px-4 shrink-0">
          <Link href="/super/central" className="flex items-center gap-3 overflow-hidden">
            <motion.div
              className="rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                width: isOpen ? 56 : 44,
                height: isOpen ? 56 : 44,
                background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
                border: "1px solid rgba(16,185,129,0.4)",
                boxShadow: "0 0 20px rgba(16,185,129,0.15)",
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Image
                src={isOpen ? "/2.png" : "/3.png"}
                alt="LIDIA"
                width={isOpen ? 48 : 36}
                height={isOpen ? 48 : 36}
                className="object-contain"
                priority
              />
            </motion.div>
          </Link>

          {/* Collapse toggle button */}
          <motion.button
            onClick={onToggle}
            className="p-1.5 rounded-lg dark:text-slate-500 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            whileTap={{ scale: 0.95 }}
            title={isOpen ? "Recolher menu" : "Expandir menu"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mb-3 px-3"
              >
                <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">
                  Administração
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                      )} />
                    </motion.div>

                    {/* Label with fade animation */}
                    <AnimatePresence mode="wait">
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2, delay: isOpen ? 0.05 : 0 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed state */}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-emerald-500" />
                      </div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="relative border-t border-emerald-500/15 p-3 shrink-0">
          <motion.button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 group-hover:rotate-180 transition-transform duration-300" />
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-3 mt-2 border-t border-white/5"
              >
                <p className="text-[10px] text-slate-600 text-center">
                  LIDIA SUPER v2.0
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Mobile Sidebar - Full width drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-emerald-500/15 bg-gradient-to-b from-black/98 to-black/95 backdrop-blur-2xl lg:hidden flex flex-col"
          >
            {/* Glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

            {/* Mobile Header */}
            <div className="relative flex h-16 items-center justify-between border-b border-emerald-500/15 px-4">
              <Link href="/super/central" className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
                    border: "1px solid rgba(16,185,129,0.4)",
                    boxShadow: "0 0 20px rgba(16,185,129,0.15)",
                  }}
                >
                  <Image
                    src="/3.png"
                    alt="LIDIA"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    LIDIA
                  </span>
                  <span className="text-[10px] text-emerald-500/80 uppercase tracking-wider font-medium">
                    Super Admin
                  </span>
                </div>
              </Link>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="relative flex-1 overflow-auto py-4 px-3">
              <div className="mb-3 px-3">
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
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="relative"
                    >
                      <Link
                        href={item.href}
                        onClick={onToggle}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-emerald-400" : "text-slate-500"
                        )} />
                        <span className="leading-tight">{item.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </nav>

            {/* Mobile Footer */}
            <div className="relative border-t border-emerald-500/15 p-3">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
              <div className="pt-3 mt-2 border-t border-white/5">
                <p className="text-[10px] text-slate-600 text-center">
                  LIDIA SUPER v2.0
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
