"use client";

import { useState } from "react";
import { SuperSidebar } from "@/components/super-sidebar";
import { SuperHeader } from "@/components/super-header";
import { PageTransition } from "@/components/animations/page-transition";

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <SuperSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div 
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? "18rem" : "0",
        }}
      >
        <SuperHeader
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
