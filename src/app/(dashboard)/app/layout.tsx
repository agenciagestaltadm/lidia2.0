"use client";

import { motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/animations/page-transition";
import { useSidebarState, SIDEBAR_WIDTHS, SIDEBAR_TRANSITIONS } from "@/hooks/use-sidebar-state";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile, isHydrated } =
    useSidebarState();

  const sidebarWidth =
    !isHydrated || !isCollapsed
      ? SIDEBAR_WIDTHS.EXPANDED
      : SIDEBAR_WIDTHS.COLLAPSED;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleCollapse={toggleCollapse}
          onCloseMobile={closeMobile}
        />

        <motion.div
          className="flex flex-col flex-1 min-w-0 relative"
          initial={false}
          animate={{ marginLeft: sidebarWidth }}
          transition={{
            duration: SIDEBAR_TRANSITIONS.WIDTH / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Header onMenuClick={toggleCollapse} isSidebarCollapsed={isCollapsed} />

          <main className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none" />

            <div className="relative p-4 lg:p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </motion.div>

        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
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

          <motion.div
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
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

          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
