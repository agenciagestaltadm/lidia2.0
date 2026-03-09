"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lidia-sidebar-collapsed";

interface SidebarState {
  /** Estado de colapso da sidebar no desktop */
  isCollapsed: boolean;
  /** Estado de abertura da sidebar no mobile (drawer) */
  isMobileOpen: boolean;
  /** Indica se o estado já foi hidratado do localStorage */
  isHydrated: boolean;
}

interface SidebarStateReturn extends SidebarState {
  /** Alterna o estado colapsado no desktop */
  toggleCollapse: () => void;
  /** Define explicitamente o estado colapsado */
  setCollapsed: (value: boolean) => void;
  /** Abre o drawer mobile */
  openMobile: () => void;
  /** Fecha o drawer mobile */
  closeMobile: () => void;
  /** Alterna o drawer mobile */
  toggleMobile: () => void;
}

/**
 * Hook para gerenciar o estado da sidebar com persistência em localStorage.
 * 
 * Features:
 * - Persiste a preferência de colapso do usuário
 * - Gerencia estado separado para desktop (colapsável) e mobile (drawer)
 * - Hidratação segura para SSR
 * - Animações suaves entre estados
 * 
 * @returns Objeto com estado e funções de controle da sidebar
 * 
 * @example
 * ```tsx
 * const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebarState();
 * 
 * // Desktop: colapsar/expandir
 * <button onClick={toggleCollapse}>Toggle Sidebar</button>
 * 
 * // Mobile: abrir drawer
 * <button onClick={openMobile}>Menu</button>
 * ```
 */
export function useSidebarState(): SidebarStateReturn {
  // Estado inicial (será sobrescrito após hidratação)
  const [state, setState] = useState<SidebarState>({
    isCollapsed: false,
    isMobileOpen: false,
    isHydrated: false,
  });

  // Hidratação do localStorage no cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const isCollapsed = stored === "true";
      
      setState(prev => ({
        ...prev,
        isCollapsed,
        isHydrated: true,
      }));
    } catch (error) {
      // Fallback silencioso se localStorage não estiver disponível
      console.warn("[useSidebarState] Failed to hydrate from localStorage:", error);
      setState(prev => ({ ...prev, isHydrated: true }));
    }
  }, []);

  // Persistir mudanças no localStorage
  useEffect(() => {
    if (!state.isHydrated) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, String(state.isCollapsed));
    } catch (error) {
      console.warn("[useSidebarState] Failed to persist to localStorage:", error);
    }
  }, [state.isCollapsed, state.isHydrated]);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isCollapsed: value }));
  }, []);

  const openMobile = useCallback(() => {
    setState(prev => ({ ...prev, isMobileOpen: true }));
  }, []);

  const closeMobile = useCallback(() => {
    setState(prev => ({ ...prev, isMobileOpen: false }));
  }, []);

  const toggleMobile = useCallback(() => {
    setState(prev => ({ ...prev, isMobileOpen: !prev.isMobileOpen }));
  }, []);

  return {
    isCollapsed: state.isCollapsed,
    isMobileOpen: state.isMobileOpen,
    isHydrated: state.isHydrated,
    toggleCollapse,
    setCollapsed,
    openMobile,
    closeMobile,
    toggleMobile,
  };
}

/**
 * Larguras da sidebar em diferentes estados
 */
export const SIDEBAR_WIDTHS = {
  /** Largura quando expandida (256px = 16rem = w-64) */
  EXPANDED: 256,
  /** Largura quando colapsada (80px = 5rem = w-20) */
  COLLAPSED: 80,
  /** Largura do drawer mobile (288px = 18rem = w-72) */
  MOBILE: 288,
} as const;

/**
 * Durações de transição para animações da sidebar
 */
export const SIDEBAR_TRANSITIONS = {
  /** Transição de largura */
  WIDTH: 300,
  /** Fade de conteúdo */
  CONTENT_FADE: 200,
  /** Troca de logo */
  LOGO_SWAP: 150,
} as const;

/**
 * Curvas de easing para animações
 */
export const SIDEBAR_EASING = {
  /** Easing suave para transições de largura */
  SMOOTH: [0.4, 0, 0.2, 1] as const,
  /** Easing para fade */
  FADE: [0.25, 0.1, 0.25, 1] as const,
  /** Spring para elementos interativos */
  SPRING: { type: "spring" as const, stiffness: 400, damping: 30 },
} as const;
