"use client";
import { useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { SYSTEM_BAR_HEIGHT, DOCK_HEIGHT } from "@/utils/constants";

export function useWindowDrag(instanceId: string) {
  const { updatePosition, focusApp } = useAppStore();
  const instance = useAppStore((s) => s.instances.find((i) => i.id === instanceId));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const inst = useAppStore.getState().instances.find((i) => i.id === instanceId);
      if (!inst || inst.state === "maximized") return;
      e.preventDefault();
      focusApp(instanceId);

      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { ...inst.position };

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newX = Math.max(0, startPos.x + dx);
        const newY = Math.max(
          SYSTEM_BAR_HEIGHT,
          Math.min(
            startPos.y + dy,
            window.innerHeight - DOCK_HEIGHT - 40
          )
        );
        updatePosition(instanceId, { x: newX, y: newY });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
    },
    [instanceId, focusApp, updatePosition]
  );

  return { handleMouseDown };
}