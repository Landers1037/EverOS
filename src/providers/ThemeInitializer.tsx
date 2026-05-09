"use client";
import { useEffect } from "react";

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("preload");
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}