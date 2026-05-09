"use client";
import { useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { ResizeDirection } from "@/types/app";

export function useWindowResize(instanceId: string) {
  const { updateSize, updatePosition } = useAppStore();

  const startResize = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      const inst = useAppStore.getState().instances.find((i) => i.id === instanceId);
      if (!inst || inst.state === "maximized") return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startSize = { ...inst.size };
      const startPos = { ...inst.position };
      const appDef = useAppStore
        .getState()
        .appDefinitions.find((a) => a.id === inst.appId);
      const minW = appDef?.minWidth ?? 400;
      const minH = appDef?.minHeight ?? 300;

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newW = startSize.width;
        let newH = startSize.height;
        let newX = startPos.x;
        let newY = startPos.y;

        if (direction.includes("e")) newW = Math.max(minW, startSize.width + dx);
        if (direction.includes("s")) newH = Math.max(minH, startSize.height + dy);
        if (direction.includes("w")) {
          const diff = startX - e.clientX;
          newW = Math.max(minW, startSize.width + diff);
          newX = startPos.x + (startSize.width - newW);
        }
        if (direction.includes("n")) {
          const diff = startY - e.clientY;
          newH = Math.max(minH, startSize.height + diff);
          newY = startPos.y + (startSize.height - newH);
        }

        updateSize(instanceId, { width: newW, height: newH });
        updatePosition(instanceId, { x: newX, y: newY });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    },
    [instanceId, updateSize, updatePosition]
  );

  return { startResize };
}