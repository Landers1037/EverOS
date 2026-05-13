import { create } from "zustand";
import type { SidebarState, Wallpaper } from "@/types/desktop";
import { WALLPAPERS } from "@/mock/wallpapers";

export type WallpaperMode = "cover" | "stretch" | "center";

interface DesktopState {
  bootComplete: boolean;
  sidebarState: SidebarState;
  wallpaper: string;
  wallpapers: Wallpaper[];
  customWallpaper: string | null;
  wallpaperMode: WallpaperMode;
  wallpaperBlur: number;
  contextMenu: { x: number; y: number } | null;

  completeBoot: () => void;
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  setWallpaper: (id: string) => void;
  setCustomWallpaper: (dataUrl: string | null) => void;
  setWallpaperMode: (mode: WallpaperMode) => void;
  setWallpaperBlur: (blur: number) => void;
  showContextMenu: (x: number, y: number) => void;
  hideContextMenu: () => void;
}

const STORAGE_KEY = "everos-wallpaper";
const CUSTOM_WALLPAPER_KEY = "everos-custom-wallpaper";
const WALLPAPER_MODE_KEY = "everos-wallpaper-mode";
const WALLPAPER_BLUR_KEY = "everos-wallpaper-blur";

function getInitialWallpaper(): string {
  if (typeof window === "undefined") return "wp-deep-space";
  return localStorage.getItem(STORAGE_KEY) ?? "wp-deep-space";
}

function getInitialCustomWallpaper(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOM_WALLPAPER_KEY);
}

function getInitialWallpaperMode(): WallpaperMode {
  if (typeof window === "undefined") return "cover";
  const stored = localStorage.getItem(WALLPAPER_MODE_KEY);
  if (stored === "cover" || stored === "stretch" || stored === "center") {
    return stored as WallpaperMode;
  }
  return "cover";
}

function getInitialWallpaperBlur(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(WALLPAPER_BLUR_KEY);
  if (stored) {
    const val = parseInt(stored, 10);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  bootComplete: false,
  sidebarState: "expanded",
  wallpaper: getInitialWallpaper(),
  wallpapers: WALLPAPERS,
  customWallpaper: getInitialCustomWallpaper(),
  wallpaperMode: getInitialWallpaperMode(),
  wallpaperBlur: getInitialWallpaperBlur(),
  contextMenu: null,

  completeBoot: () => set({ bootComplete: true }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarState:
        state.sidebarState === "expanded" ? "collapsed" : "expanded",
    })),

  setSidebarState: (sidebarState) => set({ sidebarState }),

  setWallpaper: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    set({ wallpaper: id });
  },

  setCustomWallpaper: (dataUrl) => {
    if (dataUrl) {
      localStorage.setItem(CUSTOM_WALLPAPER_KEY, dataUrl);
    } else {
      localStorage.removeItem(CUSTOM_WALLPAPER_KEY);
    }
    set({ customWallpaper: dataUrl });
  },

  setWallpaperMode: (mode) => {
    localStorage.setItem(WALLPAPER_MODE_KEY, mode);
    set({ wallpaperMode: mode });
  },

  setWallpaperBlur: (blur) => {
    localStorage.setItem(WALLPAPER_BLUR_KEY, blur.toString());
    set({ wallpaperBlur: blur });
  },

  showContextMenu: (x, y) => set({ contextMenu: { x, y } }),
  hideContextMenu: () => set({ contextMenu: null }),
}));