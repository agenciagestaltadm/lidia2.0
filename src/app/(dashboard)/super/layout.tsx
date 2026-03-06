"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SuperSidebar } from "@/components/super-sidebar";
import { SuperHeader } from "@/components/super-header";
import { PageTransition } from "@/components/animations/page-transition";

// Width constants matching sidebar
const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SuperSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main content area with seamless integration */}
      <motion.div
        className="flex flex-col flex-1 min-w-0 relative"
        initial={false}
        animate={{
          marginLeft: isSidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      >
        <SuperHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
