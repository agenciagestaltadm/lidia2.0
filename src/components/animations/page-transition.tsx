"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { pageTransition } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
