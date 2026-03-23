"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <GlassCard className="p-6" hover={false}>
        <div className="space-y-4">
          <div className="h-8 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-1/2 animate-pulse" />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-4" hover={false}>
            <div className="space-y-3">
              <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-20 animate-pulse" />
              <div className="h-8 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-16 animate-pulse" />
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6" hover={false}>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-1/3 animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-10 w-32 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded-lg animate-pulse shrink-0"
        />
      ))}
    </div>
  );
}
