import { create } from "zustand";
import type { Theme } from "@/types/desktop";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", resolved === "light");
}

const STORAGE_KEY = "everos-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored ?? "system";
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  const resolved = resolveTheme(initial);
  applyTheme(resolved);

  if (typeof window !== "undefined") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (get().theme === "system") {
        const r = getSystemTheme();
        applyTheme(r);
        set({ resolved: r });
      }
    });
  }

  return {
    theme: initial,
    resolved,
    setTheme: (theme) => {
      const resolved = resolveTheme(theme);
      applyTheme(resolved);
      localStorage.setItem(STORAGE_KEY, theme);
      set({ theme, resolved });
    },
    toggleTheme: () => {
      const next = get().resolved === "light" ? "dark" : "light";
      get().setTheme(next);
    },
  };
});