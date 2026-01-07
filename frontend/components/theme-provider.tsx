"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Default context value for SSR
const defaultContextValue: ThemeContextValue = {
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultContextValue);

export function useTheme() {
  return React.useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(defaultTheme === "system" ? "dark" : defaultTheme);
  const [mounted, setMounted] = React.useState(false);

  // Get system preference
  const getSystemTheme = React.useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  // Resolve theme
  const resolveTheme = React.useCallback((t: Theme): "light" | "dark" => {
    if (t === "system") return getSystemTheme();
    return t;
  }, [getSystemTheme]);

  // Apply theme to document
  const applyTheme = React.useCallback((resolved: "light" | "dark") => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, []);

  // Initialize theme from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored || defaultTheme;
    setThemeState(initial);
    const resolved = resolveTheme(initial);
    applyTheme(resolved);
    setMounted(true);
  }, [defaultTheme, resolveTheme, applyTheme]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (theme !== "system" || !mounted) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(getSystemTheme());
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme, getSystemTheme, applyTheme, mounted]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
    applyTheme(resolveTheme(newTheme));
  }, [resolveTheme, applyTheme]);

  const toggleTheme = React.useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  // Provide context value
  const contextValue = React.useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

