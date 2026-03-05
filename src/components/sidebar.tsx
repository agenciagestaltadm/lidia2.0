"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Menu,
  X,
  Contact,
  MessageSquare,
  Send,
  Kanban,
  Filter,
  BarChart3,
  Bell,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { drawerSlide, overlayFade, sidebarItem, sidebarSubmenu } from "@/lib/animations";

interface SubMenuItem {
  href: string;
  label: string;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: SubMenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  { href: "/app/central", label: "Central", icon: LayoutDashboard },
  {
    label: "Atendimentos",
    icon: MessageSquare,
    children: [
      { href: "/app/attendances", label: "Todos os Atendimentos" },
      { href: "/app/attendances/active", label: "Em Andamento" },
      { href: "/app/attendances/pending", label: "Pendentes" },
    ],
  },
  { href: "/app/contacts", label: "Contatos", icon: Contact },
  {
    label: "Comunicação",
    icon: Send,
    children: [
      { href: "/app/bulk", label: "Disparo em Bulk" },
      { href: "/app/campaigns", label: "Campanhas" },
      { href: "/app/templates", label: "Templates" },
    ],
  },
  {
    label: "Pipeline",
    icon: Kanban,
    children: [
      { href: "/app/kanban", label: "Kanban" },
      { href: "/app/funnel", label: "Funil" },
    ],
  },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/companies", label: "Empresas", icon: Building2 },
  { href: "/app/users", label: "Usuários", icon: Users },
  { href: "/app/notifications", label: "Notificações", icon: Bell },
];

const bottomNavItems: NavItem[] = [
  { href: "/app/profile", label: "Perfil", icon: User },
  { href: "/app/settings", label: "Configurações", icon: Settings },
];

function NavItemComponent({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const Icon = item.icon;

  // Auto-expand if a child is active
  const hasActiveChild = item.children?.some(child => pathname === child.href);
  const shouldExpand = isExpanded || hasActiveChild;

  if (item.children) {
    return (
      <div>
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            (shouldExpand || isActive)
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
          <motion.div
            animate={{ rotate: shouldExpand ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {shouldExpand && (
            <motion.div
              variants={sidebarSubmenu}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                {item.children.map((child, index) => {
                  const isChildActive = pathname === child.href;
                  return (
                    <motion.div
                      key={child.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={child.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          isChildActive
                            ? "bg-cyan-500/20 text-cyan-400 font-medium"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        )}
                      >
                        <span className="relative">
                          {child.label}
                          {isChildActive && (
                            <motion.span
                              layoutId="activeIndicator"
                              className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"
                            />
                          )}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="sidebarGlow"
          className="absolute inset-0 rounded-lg bg-cyan-500/5 -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-800/80 border border-white/10 text-slate-200"
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        variants={drawerSlide}
        initial={false}
        animate={isOpen ? "visible" : "hidden"}
        className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/10 bg-slate-950/80 backdrop-blur-xl lg:translate-x-0"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <Link href="/app/central" className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,240,255,0.3), rgba(139,92,246,0.3))",
                }}
              >
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold gradient-text">LIDIA</span>
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
            <motion.ul 
              className="space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {navItems.map((item) => {
                const isActive = item.href 
                  ? pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  : item.children?.some(child => pathname === child.href);

                return (
                  <motion.li 
                    key={item.label} 
                    variants={sidebarItem}
                    className="relative"
                  >
                    <NavItemComponent item={item} isActive={!!isActive} />
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-white/10 p-3 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>

            {/* Version */}
            <div className="pt-3 mt-2 border-t border-white/5">
              <p className="text-[10px] text-slate-600 text-center">
                LIDIA CRM v2.0 • Futuristic Edition
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
