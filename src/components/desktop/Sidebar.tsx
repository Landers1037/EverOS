"use client";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/utils/cn";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/utils/constants";
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
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MENU_ITEMS = [
  { section: "media", labelKey: "media.videos", appId: "video-manager", icon: "Clapperboard" },
  { section: "media", labelKey: "media.music", appId: "music-manager", icon: "Music" },
  { section: "media", labelKey: "media.images", appId: "image-manager", icon: "Image" },
  { section: "media", labelKey: "media.documents", appId: "document-manager", icon: "FileText" },
  { section: "media", labelKey: "media.notes", appId: "notes-manager", icon: "NotebookPen" },
  { section: "media", labelKey: "media.player", appId: "player-app", icon: "MonitorPlay" },
  { section: "media", labelKey: "media.trash", appId: "trash-manager", icon: "Trash2" },
  { section: "system", labelKey: "apps.settings", appId: "settings", icon: "Settings" },
  { section: "system", labelKey: "apps.fileManager", appId: "file-manager", icon: "Folder" },
  { section: "system", labelKey: "apps.about", appId: null, icon: "Info" },
];

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
  Info,
};

export function Sidebar() {
  const { sidebarState, toggleSidebar } = useDesktopStore();
  const { openApp, instances } = useAppStore();
  const sidebarOpacity = useSettingsStore((state) => state.sidebarOpacity);
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const collapsed = sidebarState === "collapsed" || isMobile;

  return (
    <aside
      className="ui-surface fixed left-4 z-20 flex flex-col overflow-hidden rounded-[18px]"
      style={{
        top: "calc(var(--system-bar-height) + 12px)",
        bottom: "20px",
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        backgroundImage: "var(--panel-highlight)",
        backgroundColor: "rgb(var(--elevated-rgb) / var(--sidebar-surface-alpha))",
        transition: "width var(--motion-base) var(--easing-default)",
      }}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-2">
        {!collapsed && (
          <div className="px-2">
            <div
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Navigation
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              EverOS
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ui-control ui-icon-button rounded-[var(--radius-md)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="ui-divider mx-3 h-px" />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <div className="mb-5">
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
                  "ui-control mb-1 flex h-10 w-full justify-start gap-3 rounded-[var(--radius-md)] px-2 text-sm",
                  isOpen && "ui-control-active"
                )}
                style={{ color: isOpen ? "var(--text-primary)" : "var(--text-secondary)" }}
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
                  "ui-control mb-1 flex h-10 w-full justify-start gap-3 rounded-[var(--radius-md)] px-2 text-sm",
                  isOpen && "ui-control-active"
                )}
                style={{ color: isOpen ? "var(--text-primary)" : "var(--text-secondary)" }}
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
