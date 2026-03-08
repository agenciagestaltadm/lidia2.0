"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { useAuth } from "@/hooks/use-auth";
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
  const { signOut } = useAuth();
  const { canAccessRoute, isCompanyAdmin, canManageUsers } = usePermissions();

  const handleLogout = async () => {
    await signOut();
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
    <div className="flex flex-col h-full dark:bg-black/90 bg-white backdrop-blur-xl border-r dark:border-emerald-500/10 border-slate-200">
      {/* Logo Only - Medium Size with Dark Mode Support */}
      <div className="flex items-center justify-between p-4 border-b dark:border-emerald-500/10 border-slate-200">
        <Link href="/app/central" className="flex items-center justify-center flex-1">
          <motion.div
            className="flex items-center justify-center overflow-hidden"
            style={{
              width: 120,
              height: 48,
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Image
              src="/3.png"
              alt="LIDIA"
              width={120}
              height={48}
              className="object-contain dark:invert dark:brightness-0 dark:contrast-200 transition-all duration-300"
              priority
            />
          </motion.div>
        </Link>
        <button
          onClick={onToggle}
          className="lg:hidden p-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider">
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
      <div className="p-3 border-t dark:border-emerald-500/10 border-slate-200 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href!}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              pathname === item.href
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg dark:text-slate-400 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
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
      <motion.button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl dark:bg-[#0a0a0a]/90 bg-white/90 border dark:border-emerald-500/30 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Desktop Sidebar with higher z-index to prevent collision */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onToggle}
              className="lg:hidden fixed inset-0 z-40 dark:bg-black/70 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
              : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
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
                          : "dark:text-slate-500 text-slate-500 dark:hover:text-emerald-300 hover:text-emerald-600 dark:hover:bg-white/5 hover:bg-slate-100"
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
          : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
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
