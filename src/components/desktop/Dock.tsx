"use client";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { Grid3X3, Clapperboard, Music, Image, Settings, Folder } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Clapperboard,
  Music,
  Image,
  Settings,
  Folder,
};

export function Dock() {
  const { appDefinitions, instances, openApp, focusApp, minimizeApp, restoreApp } = useAppStore();
  const { dock } = useSettingsStore();
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMini = dock.style === "mini";

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
    <div className="flex items-center gap-1">
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
              "relative flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110",
              buttonSize,
              "hover:bg-[var(--accent-muted)]"
            )}
            title={t(app.nameKey)}
          >
            <div
              style={{
                color: isMinimized
                  ? "var(--text-tertiary)"
                  : "var(--text-primary)",
                opacity: isMinimized ? 0.5 : 1,
              }}
            >
              <Icon size={iconSize} />
            </div>
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute bottom-0.5 w-1 h-1 rounded-full"
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
        className="fixed left-0 right-0 z-40 pointer-events-none flex justify-center"
        style={{ bottom: 12 }}
      >
        <div
          className="pointer-events-auto flex items-center"
          style={{
            padding: "6px 6px",
            backgroundColor: "rgba(17, 19, 23, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner highlight gradient at top 40% */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
              pointerEvents: "none",
              borderRadius: "var(--radius-lg)",
            }}
          />
          {dockButtons}
        </div>
      </div>
    );
  }

  // Standard style
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center"
      style={{
        height: "var(--dock-height)",
        backgroundColor: "var(--bg-elevated)",
        borderTop: "1px solid var(--border-subtle)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
    >
      <div className="flex items-center gap-1 px-3">
        {dockButtons}
      </div>
    </div>
  );
}