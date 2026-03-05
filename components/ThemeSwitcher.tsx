"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "givah-theme";

function useThemeFallback() {
  const ctx = useContext(ThemeContext);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const isDark = stored === "dark" || (!stored && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    setThemeState(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  if (ctx) return { theme: ctx.theme, toggleTheme: ctx.toggleTheme };
  return { theme, toggleTheme };
}

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useThemeFallback();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 inline-flex items-center justify-center transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" aria-hidden />
      ) : (
        <Moon className="w-5 h-5" aria-hidden />
      )}
    </button>
  );
}
