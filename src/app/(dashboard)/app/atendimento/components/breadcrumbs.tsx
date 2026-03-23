"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeNames: Record<string, string> = {
  "/app/attendances": "Conversas",
  "/app/atendimento": "Atendimento",
  "/app/atendimento/funil": "Funil de Vendas",
  "/app/atendimento/protocolos": "Protocolos",
  "/app/atendimento/avaliacoes": "Avaliações",
  "/app/atendimento/notas": "Notas",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Build breadcrumb items
  const items: { label: string; href: string }[] = [];

  if (pathname.startsWith("/app/atendimento")) {
    items.push({ label: "Atendimento", href: "/app/atendimento/funil" });

    if (pathname === "/app/atendimento/funil") {
      items.push({ label: "Funil de Vendas", href: "/app/atendimento/funil" });
    } else if (pathname === "/app/atendimento/protocolos") {
      items.push({ label: "Protocolos", href: "/app/atendimento/protocolos" });
    } else if (pathname === "/app/atendimento/avaliacoes") {
      items.push({ label: "Avaliações", href: "/app/atendimento/avaliacoes" });
    } else if (pathname === "/app/atendimento/notas") {
      items.push({ label: "Notas", href: "/app/atendimento/notas" });
    }
  } else if (pathname === "/app/attendances") {
    items.push({ label: "Conversas", href: "/app/attendances" });
  }

  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Link
        href="/app/central"
        className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Central</span>
      </Link>

      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {index === items.length - 1 ? (
            <span className="text-emerald-400 font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
