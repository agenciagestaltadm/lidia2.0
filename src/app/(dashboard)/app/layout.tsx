"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/animations/page-transition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div 
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? "18rem" : "0",
        }}
      >
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
