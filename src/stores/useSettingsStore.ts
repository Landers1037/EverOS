import { create } from "zustand";
import type { DockStyle } from "@/types/desktop";

export type SettingsCategory = "appearance" | "system" | "notifications";
export type ZoomLevel = 75 | 90 | 100 | 125 | 150;
export type LogLevel = "debug" | "info" | "warn" | "error";
export type NotifLevel = "all" | "important" | "none";
export type NotifScope = "all" | "system" | "custom";
export type NotifStyle = "banner" | "alert" | "none";

export interface SystemConfig {
  host: string;
  port: number;
  password: string;
  username: string;
  logLevel: LogLevel;
  logRetention: number;
}

export interface NotificationConfig {
  level: NotifLevel;
  scope: NotifScope;
  style: NotifStyle;
}

export interface DockConfig {
  style: DockStyle;
}

interface SettingsState {
  isOpen: boolean;
  activeCategory: SettingsCategory;

  // Appearance
  zoom: ZoomLevel;
  accentColor: string;
  dock: DockConfig;

  // System
  system: SystemConfig;

  // Notifications
  notifications: NotificationConfig;

  // Actions
  open: () => void;
  close: () => void;
  setCategory: (cat: SettingsCategory) => void;
  setZoom: (zoom: ZoomLevel) => void;
  setDockStyle: (style: DockStyle) => void;
  setAccentColor: (color: string) => void;
  updateSystem: (config: Partial<SystemConfig>) => void;
  updateNotifications: (config: Partial<NotificationConfig>) => void;
}

const SYSTEM_STORAGE_KEY = "everos-settings-system";
const NOTIF_STORAGE_KEY = "everos-settings-notifications";
const ZOOM_STORAGE_KEY = "everos-settings-zoom";
const ACCENT_STORAGE_KEY = "everos-settings-accent";
const DOCK_STORAGE_KEY = "everos-settings-dock";

function getInitialSystem(): SystemConfig {
  if (typeof window === "undefined") return { host: "localhost", port: 8080, password: "", username: "admin", logLevel: "info", logRetention: 7 };
  const stored = localStorage.getItem(SYSTEM_STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  return { host: "localhost", port: 8080, password: "", username: "admin", logLevel: "info", logRetention: 7 };
}

function getInitialNotifications(): NotificationConfig {
  if (typeof window === "undefined") return { level: "all", scope: "all", style: "banner" };
  const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  return { level: "all", scope: "all", style: "banner" };
}

function getInitialZoom(): ZoomLevel {
  if (typeof window === "undefined") return 100;
  const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
  if (stored) {
    const n = parseInt(stored, 10);
    if ([75, 90, 100, 125, 150].includes(n)) return n as ZoomLevel;
  }
  return 100;
}

function getInitialAccent(): string {
  if (typeof window === "undefined") return "#AAB4C3";
  return localStorage.getItem(ACCENT_STORAGE_KEY) ?? "#AAB4C3";
}

function getInitialDock(): DockConfig {
  if (typeof window === "undefined") return { style: "standard" };
  const stored = localStorage.getItem(DOCK_STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  return { style: "standard" };
}

function applyAccentColor(color: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--accent", color);

  // Generate hover/muted variants
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const hover = `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;
  const muted = `rgba(${r}, ${g}, ${b}, 0.15)`;
  root.style.setProperty("--accent-hover", hover);
  root.style.setProperty("--accent-muted", muted);
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Apply saved accent on init
  const savedAccent = getInitialAccent();
  applyAccentColor(savedAccent);

  return {
    isOpen: false,
    activeCategory: "appearance",

    zoom: getInitialZoom(),
    accentColor: savedAccent,
    dock: getInitialDock(),

    system: getInitialSystem(),
    notifications: getInitialNotifications(),

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),

    setCategory: (activeCategory) => set({ activeCategory }),

    setZoom: (zoom) => {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
      set({ zoom });
    },

    setDockStyle: (style) => {
      const dock = { style };
      localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(dock));
      set({ dock });
    },

    setAccentColor: (accentColor) => {
      localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
      applyAccentColor(accentColor);
      set({ accentColor });
    },

    updateSystem: (config) => {
      const next = { ...get().system, ...config };
      localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(next));
      set({ system: next });
    },

    updateNotifications: (config) => {
      const next = { ...get().notifications, ...config };
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      set({ notifications: next });
    },
  };
});