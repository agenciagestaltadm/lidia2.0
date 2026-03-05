"use client";

import { motion } from "framer-motion";
import { gradientBlob } from "@/lib/animations";

export function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blob 1 - Emerald Green */}
      <motion.div
        variants={gradientBlob(10)}
        initial="hidden"
        animate="visible"
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      {/* Blob 2 - Dark Green */}
      <motion.div
        variants={gradientBlob(12)}
        initial="hidden"
        animate="visible"
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(5, 150, 105, 0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      
      {/* Blob 3 - Light Green */}
      <motion.div
        variants={gradientBlob(14)}
        initial="hidden"
        animate="visible"
        className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      
      {/* Blob 4 - Deep Green accent */}
      <motion.div
        variants={gradientBlob(16)}
        initial="hidden"
        animate="visible"
        className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(4, 120, 87, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}
