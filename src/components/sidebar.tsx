"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  CreditCard,
  Radio,
  Menu,
  X,
  Contact,
  MessageSquare,
  Send,
  Kanban,
  Filter,
} from "lucide-react";
import { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onToggle: () => void;
}

const superNavItems: NavItem[] = [
  { href: "/super/central", label: "Central", icon: LayoutDashboard },
  { href: "/super/plans", label: "Planos", icon: CreditCard },
  { href: "/super/companies", label: "Empresas", icon: Building2 },
  { href: "/super/users", label: "Usuários", icon: Users },
  { href: "/super/channels", label: "Canais", icon: Radio },
  { href: "/super/settings", label: "Configurações", icon: Settings },
];

const clientNavItems: NavItem[] = [
  { href: "/app/central", label: "Central", icon: LayoutDashboard },
  { href: "/app/attendances", label: "Atendimentos", icon: MessageSquare },
  { href: "/app/contacts", label: "Contatos", icon: Contact },
  { href: "/app/bulk", label: "Disparo em Bulk", icon: Send },
  { href: "/app/kanban", label: "Kanban", icon: Kanban },
  { href: "/app/funnel", label: "Funil de Vendas", icon: Filter },
  { href: "/app/channels", label: "Canais", icon: Radio },
  { href: "/app/users", label: "Usuários", icon: Users },
  { href: "/app/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ role, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "SUPER_USER" ? superNavItems : clientNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link href={role === "SUPER_USER" ? "/super/central" : "/app/central"} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">L</span>
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">LIDIA 2.0</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 text-center">
              © 2025 LIDIA 2.0
            </p>
          </div>
        </div>
      </aside>

      {/* Toggle button for mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
}
