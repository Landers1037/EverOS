"use client";
import type { AppInstance, ResizeDirection } from "@/types/app";
import { useAppStore } from "@/stores/useAppStore";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { useWindowResize } from "@/hooks/useWindowResize";
import { useTranslation } from "@/hooks/useTranslation";
import { WindowControls } from "./WindowControls";
import { getAppComponent } from "@/components/apps/registry";
import {
  Clapperboard,
  Music,
  Image,
  Settings,
  Folder,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Clapperboard,
  Music,
  Image,
  Settings,
  Folder,
};

interface AppWindowProps {
  instance: AppInstance;
}

export function AppWindow({ instance }: AppWindowProps) {
  const { focusApp, closeApp, minimizeApp, maximizeApp, restoreApp } =
    useAppStore();
  const { t } = useTranslation();
  const { handleMouseDown } = useWindowDrag(instance.id);
  const { startResize } = useWindowResize(instance.id);

  const appDef = useAppStore((s) =>
    s.appDefinitions.find((a) => a.id === instance.appId)
  );
  const AppComponent = getAppComponent(instance.appId);
  const Icon = iconMap[appDef?.icon ?? ""] ?? Folder;
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isMaximized = instance.state === "maximized";

  const handleTitleBarDoubleClick = () => {
    if (isMaximized) {
      restoreApp(instance.id);
    } else {
      maximizeApp(instance.id);
    }
  };

  if (instance.state === "minimized") return null;

  return (
    <div
      className={cn(
        "absolute rounded-lg overflow-hidden border",
        instance.state === "closing" && "animate-windowClose"
      )}
      style={{
        left: isMobile ? 0 : isMaximized ? 0 : instance.position.x,
        top: isMobile ? 0 : isMaximized ? 0 : instance.position.y,
        width: isMobile ? "100%" : isMaximized ? "100%" : instance.size.width,
        height: isMobile ? "100%" : isMaximized ? "100%" : instance.size.height,
        zIndex: instance.zIndex,
        borderColor: "var(--border-default)",
        boxShadow: instance.isFocused
          ? "0 8px 32px rgba(0,0,0,0.2)"
          : "0 2px 8px rgba(0,0,0,0.1)",
        animation: instance.state === "open" ? "windowOpen 0.15s ease-out" : undefined,
        backgroundColor: "var(--bg-elevated)",
      }}
      onMouseDown={() => focusApp(instance.id)}
    >
      {/* Title Bar */}
      <div
        className="flex items-center h-10 px-3 cursor-grab"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        <Icon size={14} />
        <span
          className="ml-2 text-sm font-medium flex-1 truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {appDef ? t(appDef.nameKey) : instance.title}
        </span>
        <WindowControls
          onMinimize={() => minimizeApp(instance.id)}
          onMaximize={() =>
            isMaximized ? restoreApp(instance.id) : maximizeApp(instance.id)
          }
          onClose={() => closeApp(instance.id)}
          isMaximized={isMaximized}
        />
      </div>

      {/* Content */}
      <div
        className="overflow-auto"
        style={{
          height: "calc(100% - 40px)",
          backgroundColor: "var(--bg-elevated)",
        }}
      >
        <AppComponent instance={instance} />
      </div>

      {/* Resize Handles */}
      {!isMaximized && !isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          {(
            ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeDirection[]
          ).map((dir) => {
            const cursorMap: Record<ResizeDirection, string> = {
              n: "n-resize",
              s: "s-resize",
              e: "e-resize",
              w: "w-resize",
              ne: "ne-resize",
              nw: "nw-resize",
              se: "se-resize",
              sw: "sw-resize",
            };
            const isEdge = dir.length === 1;
            return (
              <div
                key={dir}
                className={cn(
                  "absolute pointer-events-auto",
                  isEdge ? "bg-transparent" : ""
                )}
                style={{
                  cursor: cursorMap[dir],
                  ...(dir === "n" && { top: 0, left: 4, right: 4, height: 4 }),
                  ...(dir === "s" && { bottom: 0, left: 4, right: 4, height: 4 }),
                  ...(dir === "e" && { top: 4, right: 0, bottom: 4, width: 4 }),
                  ...(dir === "w" && { top: 4, left: 0, bottom: 4, width: 4 }),
                  ...(dir === "ne" && { top: 0, right: 0, width: 8, height: 8 }),
                  ...(dir === "nw" && { top: 0, left: 0, width: 8, height: 8 }),
                  ...(dir === "se" && { bottom: 0, right: 0, width: 8, height: 8 }),
                  ...(dir === "sw" && { bottom: 0, left: 0, width: 8, height: 8 }),
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startResize(e, dir);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}