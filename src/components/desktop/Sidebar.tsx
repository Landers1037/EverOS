"use client";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/utils/cn";
import {
  Clapperboard,
  Music,
  Image,
  Settings,
  Folder,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MENU_ITEMS = [
  { section: "media", labelKey: "media.videos", appId: "video-manager", icon: "Clapperboard" },
  { section: "media", labelKey: "media.music", appId: "music-manager", icon: "Music" },
  { section: "media", labelKey: "media.images", appId: "image-manager", icon: "Image" },
  { section: "system", labelKey: "apps.settings", appId: "settings", icon: "Settings" },
  { section: "system", labelKey: "apps.fileManager", appId: "file-manager", icon: "Folder" },
  { section: "system", labelKey: "apps.about", appId: null, icon: "Info" },
];

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Clapperboard,
  Music,
  Image,
  Settings,
  Folder,
  Info,
};

export function Sidebar() {
  const { sidebarState, toggleSidebar } = useDesktopStore();
  const { openApp, instances } = useAppStore();
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const collapsed = sidebarState === "collapsed" || isMobile;

  return (
    <aside
      className="fixed left-0 z-20 flex flex-col border-r"
      style={{
        top: "var(--system-bar-height)",
        height: `calc(100vh - var(--system-bar-height))`,
        width: collapsed ? 56 : 224,
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        transition: "width 0.3s ease",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-8 mx-2 mt-2 rounded-lg hover:bg-[var(--accent-muted)]"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Menu sections */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {/* Media section */}
        <div className="mb-4">
          {!collapsed && (
            <p
              className="text-xs font-semibold uppercase tracking-wider px-2 mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("media.allFiles")}
            </p>
          )}
          {MENU_ITEMS.filter((m) => m.section === "media").map((item) => {
            const Icon = iconMap[item.icon] || Clapperboard;
            const isOpen = instances.some((i) => i.appId === item.appId);
            return (
              <button
                key={item.appId}
                onClick={() => item.appId && openApp(item.appId)}
                className={cn(
                  "flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm mb-0.5",
                  "hover:bg-[var(--accent-muted)] transition-colors",
                  isOpen && "bg-[var(--accent-muted)]"
                )}
                style={{ color: "var(--text-primary)" }}
                title={!collapsed ? undefined : t(item.labelKey)}
              >
                <Icon size={18} />
                {!collapsed && (
                  <span className="truncate">{t(item.labelKey)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* System section */}
        <div>
          {!collapsed && (
            <p
              className="text-xs font-semibold uppercase tracking-wider px-2 mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              System
            </p>
          )}
          {MENU_ITEMS.filter((m) => m.section === "system").map((item) => {
            const Icon = iconMap[item.icon] || Settings;
            const isOpen = item.appId ? instances.some((i) => i.appId === item.appId) : false;
            return (
              <button
                key={item.appId || item.labelKey}
                onClick={() => {
                  if (item.appId === "settings") {
                    useSettingsStore.getState().open();
                  } else if (item.appId) {
                    openApp(item.appId);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm mb-0.5",
                  "hover:bg-[var(--accent-muted)] transition-colors",
                  isOpen && "bg-[var(--accent-muted)]"
                )}
                style={{ color: "var(--text-primary)" }}
                title={!collapsed ? undefined : t(item.labelKey)}
              >
                <Icon size={18} />
                {!collapsed && (
                  <span className="truncate">{t(item.labelKey)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}