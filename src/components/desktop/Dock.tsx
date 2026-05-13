"use client";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/utils/constants";
import {
  Grid3X3,
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

export function Dock() {
  const { appDefinitions, instances, openApp, focusApp, minimizeApp, restoreApp } = useAppStore();
  const { dock } = useSettingsStore();
  const sidebarState = useDesktopStore((state) => state.sidebarState);
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMini = dock.style === "mini";
  const isSidebarCollapsed = sidebarState === "collapsed" || isMobile;
  const sidebarOffset = isMobile ? 0 : (isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + 28;

  const pinnedApps = appDefinitions;

  const getInstanceForApp = (appId: string) => {
    return instances.find(
      (i) => i.appId === appId && i.state !== "closing"
    );
  };

  const handleAppClick = (appId: string) => {
    if (appId === "settings") {
      useSettingsStore.getState().open();
      return;
    }
    const instance = getInstanceForApp(appId);
    if (instance) {
      if (instance.isFocused) {
        minimizeApp(instance.id);
      } else {
        if (instance.state === "minimized") {
          restoreApp(instance.id);
        }
        focusApp(instance.id);
      }
    } else {
      openApp(appId);
    }
  };

  const iconSize = isMobile ? 18 : isMini ? 22 : 20;
  const buttonSize = isMobile ? "w-10 h-10" : isMini ? "w-11 h-11" : "w-12 h-12";

  const dockButtons = (
    <div className="flex items-center gap-1.5">
      {pinnedApps.map((app) => {
        const Icon = iconMap[app.icon] || Grid3X3;
        const instance = getInstanceForApp(app.id);
        const isActive = !!instance;
        const isFocused = instance?.isFocused ?? false;
        const isMinimized = instance?.state === "minimized";

        return (
          <button
            key={app.id}
            onClick={() => handleAppClick(app.id)}
            className={cn(
              "relative flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 hover:-translate-y-0.5",
              buttonSize,
              "ui-control"
            )}
            title={t(app.nameKey)}
            style={{
              backgroundColor: isFocused ? "var(--accent-muted)" : "transparent",
              borderColor: isFocused ? "var(--border-strong)" : "transparent",
              color: isMinimized ? "var(--text-tertiary)" : "var(--text-primary)",
              opacity: isMinimized ? 0.62 : 1,
            }}
          >
            <div>
              <Icon size={iconSize} />
            </div>
            {isActive && (
              <span
                className="absolute bottom-1 h-1 w-5 rounded-full"
                style={{
                  backgroundColor: "var(--accent)",
                  opacity: isFocused ? 1 : 0.4,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  if (isMini) {
    return (
      <div
        className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{ bottom: 18 }}
      >
        <div
          className="ui-surface pointer-events-auto relative flex items-center rounded-[var(--radius-lg)] px-2 py-1.5"
          style={{
            boxShadow: "var(--shadow-md)",
            backgroundImage: "var(--panel-highlight)",
            backgroundColor: "rgb(var(--elevated-rgb) / var(--dock-surface-alpha))",
          }}
        >
          {dockButtons}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 right-0 z-40 pointer-events-none"
      style={{
        left: isMobile ? 0 : sidebarOffset,
        height: "var(--dock-height)",
      }}
    >
      <div
        className="ui-surface pointer-events-auto flex h-full w-full items-center justify-center gap-1 overflow-hidden border-b-0 rounded-t-[var(--radius-xl)] px-3 py-1.5"
        style={{
          backgroundImage: "var(--panel-highlight)",
          boxShadow: "var(--shadow-lg)",
          backgroundColor: "rgb(var(--elevated-rgb) / var(--dock-surface-alpha))",
        }}
      >
        {dockButtons}
      </div>
    </div>
  );
}
