"use client";

import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "lidia-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("dark");
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme from localStorage or system preference
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as "light" | "dark" | "system" | null;
    if (stored) {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Resolve theme based on system preference
  const getResolvedTheme = React.useCallback((currentTheme: "light" | "dark" | "system"): "light" | "dark" => {
    if (currentTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return currentTheme;
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const resolved = getResolvedTheme(theme);
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    
    // Add transition class for smooth color transitions
    root.classList.add("theme-transition");
    
    // Apply new theme
    root.classList.add(resolved);
    setResolvedTheme(resolved);
    
    // Store preference
    localStorage.setItem(storageKey, theme);

    // Remove transition class after animation
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);

    return () => clearTimeout(timeout);
  }, [theme, mounted, storageKey, getResolvedTheme]);

  // Listen for system preference changes
  React.useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const resolved = mediaQuery.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  // Set theme function
  const setTheme = React.useCallback((newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
  }, []);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const resolved = getResolvedTheme(prev);
      return resolved === "light" ? "dark" : "light";
    });
  }, [getResolvedTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  // Prevent flash by rendering children immediately
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
