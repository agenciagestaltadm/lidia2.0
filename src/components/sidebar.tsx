"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Contact,
  Send,
  Kanban,
  Plug,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/hooks/use-permissions";
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
  permission?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessRoute, isCompanyAdmin, canManageUsers } = usePermissions();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Navigation items filtered by permissions
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    // Página Central - available to all
    if (canAccessRoute("canViewCentral")) {
      items.push({ href: "/app/central", label: "Página Central", icon: LayoutDashboard, permission: "canViewCentral" });
    }

    // Atendimentos
    if (canAccessRoute("canViewAttendances")) {
      items.push({ href: "/app/attendances", label: "Atendimentos", icon: MessageSquare, permission: "canViewAttendances" });
    }

    // Contatos
    if (canAccessRoute("canViewContacts")) {
      items.push({ href: "/app/contacts", label: "Contatos", icon: Contact, permission: "canViewContacts" });
    }

    // Disparo em Bulk
    if (canAccessRoute("canSendBulk")) {
      items.push({ href: "/app/bulk", label: "Disparo em Bulk", icon: Send, permission: "canSendBulk" });
    }

    // Kanban
    if (canAccessRoute("canViewKanban")) {
      items.push({ href: "/app/kanban", label: "Kanban", icon: Kanban, permission: "canViewKanban" });
    }

    // Canal de Conexão
    if (canAccessRoute("canManageConnection")) {
      items.push({ href: "/app/connection", label: "Canal de Conexão", icon: Plug, permission: "canManageConnection" });
    }

    // Usuários - requires canManageUsers permission (admins always have this)
    if (canManageUsers()) {
      items.push({ href: "/app/users", label: "Usuários", icon: Users, permission: "canManageUsers" });
    }

    return items;
  };

  // Bottom navigation items
  const getBottomNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (canAccessRoute("canViewSettings")) {
      items.push({ href: "/app/settings", label: "Configurações", icon: Settings, permission: "canViewSettings" });
    }

    return items;
  };

  const navItems = getNavItems();
  const bottomNavItems = getBottomNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-black font-bold text-xl">L</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-md -z-10" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">LIDIA</h1>
            <p className="text-xs text-emerald-400/80 font-medium">CRM</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Menu
          </p>
        </div>
        {navItems.map((item) => (
          <motion.div key={item.label} variants={sidebarItem}>
            <NavItemComponent
              item={item}
              isActive={pathname === item.href}
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href!}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              pathname === item.href
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-emerald-300"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-slate-400 hover:text-white transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayFade}
              onClick={onToggle}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={drawerSlide}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// NavItem Component
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
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group",
            hasActiveChild
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:bg-white/5 hover:text-emerald-300"
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
          <motion.div
            animate={{ rotate: shouldExpand ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {shouldExpand && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sidebarSubmenu}
              className="overflow-hidden"
            >
              <div className="mt-1 ml-4 pl-4 border-l border-emerald-500/20 space-y-1">
                {item.children.map((child) => {
                  const isChildActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-lg transition-all duration-200",
                        isChildActive
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-slate-500 hover:text-emerald-300 hover:bg-white/5"
                      )}
                    >
                      {child.label}
                    </Link>
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
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
        isActive
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "text-slate-400 hover:bg-white/5 hover:text-emerald-300"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}
