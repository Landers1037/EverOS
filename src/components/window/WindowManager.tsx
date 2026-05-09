"use client";
import { useAppStore } from "@/stores/useAppStore";
import { AppWindow } from "./AppWindow";
import { SYSTEM_BAR_HEIGHT, DOCK_HEIGHT } from "@/utils/constants";

export function WindowManager() {
  const instances = useAppStore((s) => s.instances);
  const focusApp = useAppStore((s) => s.focusApp);

  const visibleInstances = instances.filter(
    (inst) => inst.state !== "closing"
  );

  return (
    <div
      className="absolute z-[1]"
      style={{
        top: SYSTEM_BAR_HEIGHT,
        left: 0,
        right: 0,
        bottom: DOCK_HEIGHT,
      }}
      onMouseDown={() => {
        if (visibleInstances.length > 0) {
          const top = [...visibleInstances].sort((a, b) => b.zIndex - a.zIndex)[0];
          if (top) focusApp(top.id);
        }
      }}
    >
      {visibleInstances.map((inst) => (
        <AppWindow key={inst.id} instance={inst} />
      ))}
    </div>
  );
}