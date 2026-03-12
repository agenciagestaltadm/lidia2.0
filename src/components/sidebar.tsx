"use client";

import { useState, useCallback } from "react";
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
import { SIDEBAR_WIDTHS, SIDEBAR_TRANSITIONS } from "@/hooks/use-sidebar-state";

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
  /** Estado de colapso no desktop */
  isCollapsed: boolean;
  /** Estado de abertura no mobile */
  isMobileOpen: boolean;
  /** Callback para alternar colapso no desktop */
  onToggleCollapse: () => void;
  /** Callback para fechar drawer mobile */
  onCloseMobile: () => void;
}

/**
 * Componente Sidebar com suporte a colapso no desktop e drawer no mobile.
 * 
 * Features:
 * - Colapso suave no desktop com animação de largura
 * - Troca dinâmica de logo (1.png colapsado, 3.png expandido)
 * - Tooltips nos itens quando colapsado
 * - Drawer mobile com overlay
 * - Persistência de estado via localStorage
 */
export function Sidebar({ 
  isCollapsed, 
  isMobileOpen, 
  onToggleCollapse, 
  onCloseMobile 
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { canAccessRoute, canManageUsers } = usePermissions();

  const handleLogout = async () => {
    await signOut();
  };

  // Navigation items filtered by permissions
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (canAccessRoute("canViewCentral")) {
      items.push({ 
        href: "/app/central", 
        label: "Página Central", 
        icon: LayoutDashboard, 
        permission: "canViewCentral" 
      });
    }

    if (canAccessRoute("canViewAttendances")) {
      items.push({
        href: "/app/attendances",
        label: "Atendimentos",
        icon: MessageSquare,
        permission: "canViewAttendances"
      });
    }

    if (canAccessRoute("canViewContacts")) {
      items.push({ 
        href: "/app/contacts", 
        label: "Contatos", 
        icon: Contact, 
        permission: "canViewContacts" 
      });
    }

    if (canAccessRoute("canSendBulk")) {
      items.push({ 
        href: "/app/bulk", 
        label: "Disparo em Bulk", 
        icon: Send, 
        permission: "canSendBulk" 
      });
    }

    if (canAccessRoute("canViewKanban")) {
      items.push({ 
        href: "/app/kanban", 
        label: "Kanban", 
        icon: Kanban, 
        permission: "canViewKanban" 
      });
    }

    if (canAccessRoute("canManageConnection")) {
      items.push({ 
        href: "/app/connection", 
        label: "Canal de Conexão", 
        icon: Plug, 
        permission: "canManageConnection" 
      });
    }

    if (canManageUsers()) {
      items.push({ 
        href: "/app/users", 
        label: "Usuários", 
        icon: Users, 
        permission: "canManageUsers" 
      });
    }

    return items;
  };

  const getBottomNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (canAccessRoute("canViewSettings")) {
      items.push({ 
        href: "/app/settings", 
        label: "Configurações", 
        icon: Settings, 
        permission: "canViewSettings" 
      });
    }

    return items;
  };

  const navItems = getNavItems();
  const bottomNavItems = getBottomNavItems();

  // Largura atual baseada no estado
  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED;

  return (
    <>
      {/* Mobile Toggle Button - Fixed position */}
      <motion.button
        onClick={onToggleCollapse}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl dark:bg-[#0a0a0a]/90 bg-white/90 border dark:border-emerald-500/30 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Desktop Sidebar - Collapsible */}
      <aside 
        className="hidden lg:block fixed left-0 top-0 h-screen z-50 sidebar-transition overflow-hidden"
        style={{ 
          width: sidebarWidth,
          transition: `width ${SIDEBAR_TRANSITIONS.WIDTH}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          pathname={pathname}
          onLogout={handleLogout}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onCloseMobile}
              className="lg:hidden fixed inset-0 z-40 dark:bg-black/70 bg-slate-900/70 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.aside
              variants={drawerSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed left-0 top-0 h-screen w-72 z-50"
            >
              <SidebarContent
                isCollapsed={false}
                navItems={navItems}
                bottomNavItems={bottomNavItems}
                pathname={pathname}
                onLogout={handleLogout}
                onToggleCollapse={onCloseMobile}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// SidebarContent Component
// ============================================

interface SidebarContentProps {
  isCollapsed: boolean;
  navItems: NavItem[];
  bottomNavItems: NavItem[];
  pathname: string;
  onLogout: () => void;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}

function SidebarContent({
  isCollapsed,
  navItems,
  bottomNavItems,
  pathname,
  onLogout,
  onToggleCollapse,
  isMobile = false,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full dark:bg-black/95 bg-white backdrop-blur-xl border-r dark:border-emerald-500/10 border-slate-200 relative">
      {/* Header: Logo + Toggle */}
      <div 
        className={cn(
          "flex items-center border-b dark:border-emerald-500/10 border-slate-200 shrink-0",
          isCollapsed && !isMobile ? "justify-center p-3" : "justify-between p-4"
        )}
      >
        {/* Logo */}
        <Link 
          href="/app/central" 
          className={cn(
            "flex items-center",
            isCollapsed && !isMobile ? "justify-center" : "flex-1"
          )}
        >
          <AnimatePresence mode="wait">
            {isCollapsed && !isMobile ? (
              // Collapsed Logo - 1.png
              <motion.div
                key="collapsed-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-12 h-12 rounded-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src="/1.png"
                  alt="LIDIA"
                  width={48}
                  height={48}
                  className="object-contain dark:invert dark:brightness-0 dark:contrast-200"
                  priority
                />
              </motion.div>
            ) : (
              // Expanded Logo - 3.png
              <motion.div
                key="expanded-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center overflow-hidden"
                style={{ width: 120, height: 48 }}
                whileHover={{ scale: 1.05 }}
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
            )}
          </AnimatePresence>
        </Link>



        {/* Close Button - Mobile only */}
        {isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu Label - Hidden when collapsed */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-4 pb-2 shrink-0"
          >
            <p className="text-xs font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider">
              Menu
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 min-h-0">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed && !isMobile}
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className={cn(
        "border-t dark:border-emerald-500/10 border-slate-200 shrink-0",
        isCollapsed && !isMobile ? "p-2 space-y-2" : "p-3 space-y-1"
      )}>
        {bottomNavItems.map((item) => (
          <NavItemLink
            key={item.label}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed && !isMobile}
          />
        ))}
        
        {/* Logout */}
        <LogoutButton 
          onLogout={onLogout} 
          isCollapsed={isCollapsed && !isMobile} 
        />
      </div>
    </div>
  );
}

// ============================================
// NavItemComponent (with submenu support)
// ============================================

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavItemComponent({ item, isActive, isCollapsed }: NavItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const Icon = item.icon;

  const hasActiveChild = item.children?.some(child => pathname === child.href);
  const shouldExpand = isExpanded || hasActiveChild;

  // Collapsed mode: simple link with tooltip
  if (isCollapsed) {
    return (
      <Tooltip label={item.label}>
        <Link
          href={item.href || "#"}
          className={cn(
            "flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative",
            isActive || hasActiveChild
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
          )}
        >
          {isActive && (
            <motion.div
              layoutId="activeIndicatorCollapsed"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Icon className="w-5 h-5" />
        </Link>
      </Tooltip>
    );
  }

  // Expanded mode: with submenu support
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
          <span className="flex-1 text-sm font-medium text-left truncate">
            {item.label}
          </span>
          <motion.div
            animate={{ rotate: shouldExpand ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
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
                        "block px-3 py-2 text-sm rounded-lg transition-all duration-200 truncate",
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

  // Expanded mode: simple link
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
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium truncate">{item.label}</span>
    </Link>
  );
}

// ============================================
// NavItemLink (bottom navigation)
// ============================================

interface NavItemLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavItemLink({ item, isActive, isCollapsed }: NavItemLinkProps) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <Tooltip label={item.label}>
        <Link
          href={item.href!}
          className={cn(
            "flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative",
            isActive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
          )}
        >
          <Icon className="w-5 h-5" />
        </Link>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        isActive
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-emerald-300 hover:text-emerald-600"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

// ============================================
// LogoutButton
// ============================================

interface LogoutButtonProps {
  onLogout: () => void;
  isCollapsed: boolean;
}

function LogoutButton({ onLogout, isCollapsed }: LogoutButtonProps) {
  if (isCollapsed) {
    return (
      <Tooltip label="Sair">
        <button
          onClick={onLogout}
          className="flex items-center justify-center p-3 w-full rounded-xl dark:text-slate-400 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={onLogout}
      className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg dark:text-slate-400 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
    >
      <LogOut className="w-5 h-5" />
      <span className="text-sm font-medium">Sair</span>
    </button>
  );
}

// ============================================
// Tooltip Component
// ============================================

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="group relative">
      {children}
      {/* Tooltip */}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
        {label}
        {/* Arrow */}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
      </div>
    </div>
  );
}
