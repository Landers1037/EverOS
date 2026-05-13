"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useSettingsStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("preload");
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
