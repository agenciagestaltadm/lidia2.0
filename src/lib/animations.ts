"use client";

import { Variants, Transition } from "framer-motion";

// ========================================
// EASING CURVES
// ========================================

export const easing = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentle: [0.25, 0.1, 0.25, 1],
  snappy: [0.4, 0, 0.2, 1],
} as const;

// ========================================
// TRANSITION PRESETS
// ========================================

export const transitions: Record<string, Transition> = {
  default: {
    duration: 0.3,
    ease: easing.smooth,
  },
  slow: {
    duration: 0.5,
    ease: easing.gentle,
  },
  fast: {
    duration: 0.15,
    ease: easing.snappy,
  },
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },
  springSoft: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },
};

// ========================================
// FADE ANIMATIONS
// ========================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springSoft,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ========================================
// STAGGER CONTAINER ANIMATIONS
// ========================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ========================================
// CARD ANIMATIONS
// ========================================

export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 240, 255, 0.1)",
    transition: transitions.spring,
  },
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// ========================================
// SIDEBAR ANIMATIONS
// ========================================

export const sidebarSlide: Variants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: -300,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

export const sidebarItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
};

export const sidebarSubmenu: Variants = {
  hidden: { 
    opacity: 0, 
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

// ========================================
// DRAWER ANIMATIONS
// ========================================

export const drawerSlide: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ========================================
// MODAL/ DIALOG ANIMATIONS
// ========================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// ========================================
// BUTTON ANIMATIONS
// ========================================

export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

// ========================================
// PARTICLE ANIMATIONS
// ========================================

export const particleFloat = (delay: number = 0): Variants => ({
  hidden: { 
    opacity: 0, 
    y: 0,
    scale: 0,
  },
  visible: {
    opacity: [0, 0.8, 0],
    y: -100,
    scale: [0, 1, 0.5],
    transition: {
      duration: 4 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
});

// ========================================
// PAGE TRANSITIONS
// ========================================

export const pageTransition: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easing.smooth,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// ========================================
// GRADIENT MESH ANIMATIONS
// ========================================

export const gradientBlob = (duration: number = 8): Variants => ({
  hidden: { 
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 0.5,
    scale: 1,
    x: [0, 30, -20, 0],
    y: [0, -30, 20, 0],
    transition: {
      duration,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
});

// ========================================
// TEXT ANIMATIONS
// ========================================

export const textReveal: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: easing.smooth,
    },
  },
};

export const letterStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const letterReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
};

// ========================================
// INPUT/FORM ANIMATIONS
// ========================================

export const inputFocus = {
  rest: {
    boxShadow: "0 0 0 0px rgba(0, 240, 255, 0)",
  },
  focus: {
    boxShadow: "0 0 0 2px rgba(0, 240, 255, 0.3)",
    transition: { duration: 0.2 },
  },
};

export const formError: Variants = {
  hidden: { 
    opacity: 0, 
    y: -10,
    height: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: { duration: 0.2 },
  },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getRandomDelay(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

export function getStaggerDelay(index: number, baseDelay: number = 0.1): number {
  return index * baseDelay;
}
