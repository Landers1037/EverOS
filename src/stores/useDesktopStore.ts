import { create } from "zustand";
import type { SidebarState, Wallpaper } from "@/types/desktop";
import { WALLPAPERS } from "@/mock/wallpapers";

interface DesktopState {
  bootComplete: boolean;
  sidebarState: SidebarState;
  wallpaper: string;
  wallpapers: Wallpaper[];
  contextMenu: { x: number; y: number } | null;

  completeBoot: () => void;
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  setWallpaper: (id: string) => void;
  showContextMenu: (x: number, y: number) => void;
  hideContextMenu: () => void;
}

const STORAGE_KEY = "everos-wallpaper";

function getInitialWallpaper(): string {
  if (typeof window === "undefined") return "wp-gradient-1";
  return localStorage.getItem(STORAGE_KEY) ?? "wp-deep-space";
}

export const useDesktopStore = create<DesktopState>((set) => ({
  bootComplete: false,
  sidebarState: "expanded",
  wallpaper: getInitialWallpaper(),
  wallpapers: WALLPAPERS,
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

  showContextMenu: (x, y) => set({ contextMenu: { x, y } }),
  hideContextMenu: () => set({ contextMenu: null }),
}));