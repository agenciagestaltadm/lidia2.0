"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Dot {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

export function FloatingGeometric() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const generatedDots: Dot[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 15 + Math.random() * 70,
      top: 10 + Math.random() * 80,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    }));
    
    setDots(generatedDots);
  }, []);

  // Não renderiza nada até estar montado no cliente para evitar mismatch de hidratação
  if (!isMounted) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Hexagon */}
      <motion.div
        className="absolute top-[15%] left-[10%]"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="60" height="68" viewBox="0 0 60 68" fill="none">
          <path
            d="M30 0L59.4449 17V51L30 68L0.555054 51V17L30 0Z"
            stroke="url(#hexGradient)"
            strokeWidth="1.5"
            fill="url(#hexFill)"
            fillOpacity="0.1"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0" y1="0" x2="60" y2="68">
              <stop stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="1" stopColor="#059669" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="hexFill" x1="0" y1="0" x2="60" y2="68">
              <stop stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="1" stopColor="#059669" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating Circle Ring */}
      <motion.div
        className="absolute top-[25%] right-[15%]"
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle
            cx="40"
            cy="40"
            r="38"
            stroke="url(#circleGradient)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
          />
          <defs>
            <linearGradient id="circleGradient" x1="0" y1="0" x2="80" y2="80">
              <stop stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating Triangle */}
      <motion.div
        className="absolute bottom-[20%] left-[15%]"
        animate={{
          y: [0, -20, 0],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <svg width="50" height="44" viewBox="0 0 50 44" fill="none">
          <path
            d="M25 0L49.2487 44H0.751287L25 0Z"
            stroke="url(#triGradient)"
            strokeWidth="1.5"
            fill="url(#triFill)"
            fillOpacity="0.1"
          />
          <defs>
            <linearGradient id="triGradient" x1="0" y1="0" x2="50" y2="44">
              <stop stopColor="#059669" stopOpacity="0.6" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="triFill" x1="0" y1="0" x2="50" y2="44">
              <stop stopColor="#059669" stopOpacity="0.1" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating Square */}
      <motion.div
        className="absolute bottom-[30%] right-[10%]"
        animate={{
          y: [0, 25, 0],
          rotate: [0, 45, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
          <rect
            x="2"
            y="2"
            width="46"
            height="46"
            rx="4"
            stroke="url(#squareGradient)"
            strokeWidth="1.5"
            fill="url(#squareFill)"
            fillOpacity="0.1"
          />
          <defs>
            <linearGradient id="squareGradient" x1="0" y1="0" x2="50" y2="50">
              <stop stopColor="#047857" stopOpacity="0.5" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="squareFill" x1="0" y1="0" x2="50" y2="50">
              <stop stopColor="#047857" stopOpacity="0.1" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating Cross */}
      <motion.div
        className="absolute top-[60%] right-[25%]"
        animate={{
          rotate: [0, 90, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M20 0V40M0 20H40"
            stroke="url(#crossGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="crossGradient" x1="0" y1="0" x2="40" y2="40">
              <stop stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Small dots */}
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
