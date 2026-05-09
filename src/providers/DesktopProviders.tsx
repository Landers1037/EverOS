"use client";
import { ThemeInitializer } from "./ThemeInitializer";

export function DesktopProviders({ children }: { children: React.ReactNode }) {
  return <ThemeInitializer>{children}</ThemeInitializer>;
}