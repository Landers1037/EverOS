"use client";
import type { AppInstance, ResizeDirection } from "@/types/app";
import { useAppStore } from "@/stores/useAppStore";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { useWindowResize } from "@/hooks/useWindowResize";
import { useTranslation } from "@/hooks/useTranslation";
import { WindowControls } from "./WindowControls";
import { APP_COMPONENTS, FallbackApp } from "@/components/apps/registry";
import {
  Clapperboard,
  Music,
  Image,
  FileText,
  NotebookPen,
  MonitorPlay,
  Trash2,
  Settings,
  Folder,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Clapperboard,
  Music,
  Image,
  FileText,
  NotebookPen,
  MonitorPlay,
  Trash2,
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
  const AppComponent = APP_COMPONENTS[instance.appId] ?? FallbackApp;
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
        "absolute overflow-hidden border",
        instance.state === "closing" && "animate-windowClose"
      )}
      style={{
        left: isMobile ? 0 : isMaximized ? 0 : instance.position.x,
        top: isMobile ? 0 : isMaximized ? 0 : instance.position.y,
        width: isMobile ? "100%" : isMaximized ? "100%" : instance.size.width,
        height: isMobile ? "100%" : isMaximized ? "100%" : instance.size.height,
        zIndex: instance.zIndex,
        borderRadius: isMobile || isMaximized ? 0 : "var(--radius-xl)",
        borderColor: "var(--border-default)",
        boxShadow: instance.isFocused
          ? "var(--window-shadow-focused)"
          : "var(--window-shadow)",
        animation: instance.state === "open" ? "windowOpen 0.18s var(--easing-default)" : undefined,
        backgroundColor: "var(--bg-elevated)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
      onMouseDown={() => focusApp(instance.id)}
    >
      <div
        className="flex cursor-grab items-center gap-2 px-4"
        style={{
          height: "var(--window-title-height)",
          background: "var(--window-header-fill)",
          borderBottom: "1px solid var(--divider-strong)",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
          style={{
            backgroundColor: "var(--bg-soft)",
            border: "1px solid var(--line-soft)",
          }}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Application
          </div>
          <span
            className="block truncate text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {appDef ? t(appDef.nameKey) : instance.title}
          </span>
        </div>
        <WindowControls
          onMinimize={() => minimizeApp(instance.id)}
          onMaximize={() =>
            isMaximized ? restoreApp(instance.id) : maximizeApp(instance.id)
          }
          onClose={() => closeApp(instance.id)}
          isMaximized={isMaximized}
        />
      </div>

      <div
        className="overflow-auto"
        style={{
          height: "calc(100% - var(--window-title-height))",
          background: "var(--window-content-fill)",
        }}
      >
        <AppComponent instance={instance} />
      </div>

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
