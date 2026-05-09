import { create } from "zustand";
import type { AppDefinition, AppInstance, WindowState } from "@/types/app";
import { APP_DEFINITIONS } from "@/mock/apps";
import { SYSTEM_BAR_HEIGHT, DOCK_HEIGHT, DEFAULT_WINDOW_Z_INDEX } from "@/utils/constants";

let nextId = 1;
function generateInstanceId(): string {
  return `win-${Date.now()}-${nextId++}`;
}

interface AppState {
  instances: AppInstance[];
  nextZIndex: number;
  appDefinitions: AppDefinition[];

  openApp: (appId: string) => string | null;
  closeApp: (instanceId: string) => void;
  minimizeApp: (instanceId: string) => void;
  maximizeApp: (instanceId: string) => void;
  restoreApp: (instanceId: string) => void;
  focusApp: (instanceId: string) => void;
  updatePosition: (instanceId: string, position: { x: number; y: number }) => void;
  updateSize: (instanceId: string, size: { width: number; height: number }) => void;
  getActiveApp: () => AppInstance | null;
  removeClosingInstance: (instanceId: string) => void;
}

function cascadePosition(
  instances: AppInstance[],
  appDef: AppDefinition
): { x: number; y: number } {
  const baseX = 60;
  const baseY = SYSTEM_BAR_HEIGHT + 20;
  const offset = 28;

  if (instances.length === 0) return { x: baseX, y: baseY };

  const last = instances[instances.length - 1];
  let x = last.position.x + offset;
  let y = last.position.y + offset;

  const maxX = typeof window !== "undefined" ? window.innerWidth - appDef.minWidth : 800;
  const maxY = typeof window !== "undefined" ? window.innerHeight - DOCK_HEIGHT - SYSTEM_BAR_HEIGHT - appDef.minHeight : 600;

  if (x + appDef.defaultWidth > maxX || y + appDef.defaultHeight > maxY) {
    x = baseX;
    y = baseY;
  }

  return { x, y };
}

export const useAppStore = create<AppState>((set, get) => ({
  instances: [],
  nextZIndex: DEFAULT_WINDOW_Z_INDEX,
  appDefinitions: APP_DEFINITIONS,

  openApp: (appId) => {
    const { instances, appDefinitions, nextZIndex } = get();
    const existing = instances.find(
      (inst) => inst.appId === appId && inst.state !== "closing"
    );

    if (existing) {
      get().focusApp(existing.id);
      if (existing.state === "minimized") {
        get().restoreApp(existing.id);
      }
      return existing.id;
    }

    const appDef = appDefinitions.find((a) => a.id === appId);
    if (!appDef) return null;

    const id = generateInstanceId();
    const position = cascadePosition(instances, appDef);

    const newInstance: AppInstance = {
      id,
      appId: appDef.id,
      title: appDef.nameKey,
      state: "open",
      position,
      size: { width: appDef.defaultWidth, height: appDef.defaultHeight },
      zIndex: nextZIndex,
      isFocused: true,
    };

    const updatedInstances = instances.map((inst) => ({
      ...inst,
      isFocused: false,
    }));

    set({
      instances: [...updatedInstances, newInstance],
      nextZIndex: nextZIndex + 1,
    });

    return id;
  },

  closeApp: (instanceId) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId ? { ...inst, state: "closing" as WindowState } : inst
      ),
    }));

    setTimeout(() => {
      get().removeClosingInstance(instanceId);
    }, 200);
  },

  removeClosingInstance: (instanceId) => {
    set((state) => {
      const filtered = state.instances.filter((inst) => inst.id !== instanceId);
      if (filtered.length > 0) {
        const top = [...filtered].sort((a, b) => b.zIndex - a.zIndex)[0];
        filtered.forEach((inst, i) => {
          if (inst.id === top.id) filtered[i] = { ...inst, isFocused: true };
        });
      }
      return { instances: filtered };
    });
  },

  minimizeApp: (instanceId) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId ? { ...inst, state: "minimized" } : inst
      ),
    }));
  },

  maximizeApp: (instanceId) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              state: "maximized",
              prevState: inst.state,
              position: { x: 0, y: SYSTEM_BAR_HEIGHT },
              size: {
                width: typeof window !== "undefined" ? window.innerWidth : 1024,
                height: typeof window !== "undefined" ? window.innerHeight - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT : 600,
              },
            }
          : inst
      ),
    }));
  },

  restoreApp: (instanceId) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              state: "open",
              position: inst.prevState === "maximized" ? { x: 60, y: SYSTEM_BAR_HEIGHT + 20 } : inst.position,
              size: inst.prevState === "maximized" ? { width: 800, height: 500 } : inst.size,
            }
          : inst
      ),
    }));
  },

  focusApp: (instanceId) => {
    set((state) => ({
      instances: state.instances.map((inst) => ({
        ...inst,
        isFocused: inst.id === instanceId,
      })),
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  updatePosition: (instanceId, position) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId ? { ...inst, position } : inst
      ),
    }));
  },

  updateSize: (instanceId, size) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === instanceId ? { ...inst, size } : inst
      ),
    }));
  },

  getActiveApp: () => {
    const { instances } = get();
    return instances.find((inst) => inst.isFocused) ?? null;
  },
}));