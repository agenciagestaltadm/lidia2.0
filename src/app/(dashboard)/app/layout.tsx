"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/animations/page-transition";
import { useSidebarState, SIDEBAR_WIDTHS, SIDEBAR_TRANSITIONS } from "@/hooks/use-sidebar-state";

/**
 * Layout principal do dashboard de agentes.
 * 
 * Features:
 * - Sidebar colapsável no desktop com persistência de estado
 * - Drawer mobile para telas pequenas
 * - Transições suaves entre estados
 * - Background effects futuristas
 * 
 * @param children - Conteúdo da página atual
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    isCollapsed, 
    isMobileOpen, 
    toggleCollapse, 
    closeMobile,
    isHydrated,
  } = useSidebarState();

  // Largura dinâmica baseada no estado de colapso
  // Durante a hidratação, usa a largura expandida para evitar flash
  const sidebarWidth = !isHydrated || !isCollapsed 
    ? SIDEBAR_WIDTHS.EXPANDED 
    : SIDEBAR_WIDTHS.COLLAPSED;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Colapsável no desktop, Drawer no mobile */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={closeMobile}
      />

      {/* Main content area com margin dinâmica */}
      <motion.div
        className="flex flex-col flex-1 min-w-0 relative"
        initial={false}
        animate={{
          marginLeft: sidebarWidth,
        }}
        transition={{
          duration: SIDEBAR_TRANSITIONS.WIDTH / 1000,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <Header
          onMenuClick={toggleCollapse}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="flex-1 overflow-y-auto relative">
          {/* Subtle gradient overlay for seamless feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none" />

          <div className="relative p-4 lg:p-8">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </motion.div>

      {/* Background gradient effects - ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-right glow */}
        <motion.div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Bottom-left glow */}
        <motion.div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Center subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
      </div>
    </div>
  );
}
