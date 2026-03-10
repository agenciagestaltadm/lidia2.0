"use client";

import { useState, useEffect, useCallback } from "react";

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_KEY = "lidia-quick-replies";

const defaultQuickReplies: QuickReply[] = [
  {
    id: "1",
    shortcut: "ola",
    title: "Saudação",
    content: "Olá! Como posso ajudar você hoje?",
    createdAt: Date.now(),
  },
  {
    id: "2",
    shortcut: "aguarde",
    title: "Aguardar",
    content: "Só um momento, por favor. Estou verificando isso para você.",
    createdAt: Date.now(),
  },
  {
    id: "3",
    shortcut: "agrad",
    title: "Agradecimento",
    content: "Obrigado pelo contato! Tenha um ótimo dia.",
    createdAt: Date.now(),
  },
];

export function useQuickReplies() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQuickReplies(parsed);
      } else {
        setQuickReplies(defaultQuickReplies);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultQuickReplies));
      }
    } catch (error) {
      console.error("Error loading quick replies:", error);
      setQuickReplies(defaultQuickReplies);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever quickReplies change
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quickReplies));
    } catch (error) {
      console.error("Error saving quick replies:", error);
    }
  }, [quickReplies, isLoaded]);

  const addQuickReply = useCallback((data: Omit<QuickReply, "id" | "createdAt">): boolean => {
    const normalizedShortcut = data.shortcut.toLowerCase().trim();
    
    // Check for duplicate shortcut
    const exists = quickReplies.some(
      (qr) => qr.shortcut.toLowerCase() === normalizedShortcut
    );
    
    if (exists) {
      return false;
    }

    const newReply: QuickReply = {
      ...data,
      id: `qr-${Date.now()}`,
      shortcut: normalizedShortcut,
      createdAt: Date.now(),
    };

    setQuickReplies((prev) => [...prev, newReply]);
    return true;
  }, [quickReplies]);

  const updateQuickReply = useCallback((id: string, data: Partial<Omit<QuickReply, "id" | "createdAt">>): boolean => {
    const reply = quickReplies.find((qr) => qr.id === id);
    if (!reply) return false;

    // If updating shortcut, check for duplicates
    if (data.shortcut) {
      const normalizedShortcut = data.shortcut.toLowerCase().trim();
      const exists = quickReplies.some(
        (qr) => qr.id !== id && qr.shortcut.toLowerCase() === normalizedShortcut
      );
      if (exists) {
        return false;
      }
      data.shortcut = normalizedShortcut;
    }

    setQuickReplies((prev) =>
      prev.map((qr) =>
        qr.id === id
          ? { ...qr, ...data, updatedAt: Date.now() }
          : qr
      )
    );
    return true;
  }, [quickReplies]);

  const deleteQuickReply = useCallback((id: string) => {
    setQuickReplies((prev) => prev.filter((qr) => qr.id !== id));
  }, []);

  const searchQuickReplies = useCallback((term: string): QuickReply[] => {
    const normalizedTerm = term.toLowerCase().trim();
    if (!normalizedTerm) return quickReplies;

    return quickReplies.filter(
      (qr) =>
        qr.shortcut.toLowerCase().includes(normalizedTerm) ||
        qr.title.toLowerCase().includes(normalizedTerm) ||
        qr.content.toLowerCase().includes(normalizedTerm)
    );
  }, [quickReplies]);

  const getByShortcut = useCallback((shortcut: string): QuickReply | undefined => {
    const normalizedShortcut = shortcut.toLowerCase().trim();
    return quickReplies.find((qr) => qr.shortcut === normalizedShortcut);
  }, [quickReplies]);

  const expandShortcut = useCallback((text: string): string => {
    if (!text.startsWith("/")) return text;
    
    const shortcut = text.slice(1).toLowerCase().trim();
    const reply = getByShortcut(shortcut);
    
    return reply ? reply.content : text;
  }, [getByShortcut]);

  return {
    quickReplies,
    isLoaded,
    addQuickReply,
    updateQuickReply,
    deleteQuickReply,
    searchQuickReplies,
    getByShortcut,
    expandShortcut,
  };
}
