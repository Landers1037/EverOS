"use client";
import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { NotificationCenter } from "./NotificationCenter";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Monitor,
  Wifi,
  Power,
  RotateCw,
  PowerOff,
} from "lucide-react";

export function SystemBar() {
  const time = useClock();
  const { toggleSidebar, hideContextMenu } = useDesktopStore();
  const { toggleTheme, resolved } = useThemeStore();
  const { t } = useTranslation();
  const instances = useAppStore((s) => s.instances);
  const activeInstance = instances.find((i) => i.isFocused);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const iconButtonClass =
    "ui-control ui-icon-button rounded-[var(--radius-md)]";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 px-4 pt-3"
      style={{ height: "var(--system-bar-height)" }}
    >
      <div
        className="ui-surface mx-auto flex h-11 max-w-[calc(100vw-32px)] items-center justify-between rounded-[18px] px-3"
        style={{
          backgroundImage: "var(--panel-highlight)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={toggleSidebar}
            className={iconButtonClass}
            aria-label={t("desktop.sidebar")}
          >
            <Menu size={16} />
          </button>
          <div className="min-w-0">
            <div
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Workspace
            </div>
            <div
              className="truncate text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeInstance ? t(activeInstance.title) : "EverOS"}
            </div>
          </div>
        </div>

        <div
          className="hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex"
          style={{
            backgroundColor: "var(--bg-soft)",
            border: "1px solid var(--line-soft)",
          }}
        >
          <Wifi size={14} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Online
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={t("settings.theme")}
          >
            {resolved === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                hideContextMenu();
              }}
              className={`${iconButtonClass} relative`}
              aria-label={t("desktop.notifications")}
            >
              <Bell size={14} />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
            </button>
            {showNotifications && (
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowPowerMenu(!showPowerMenu);
                hideContextMenu();
              }}
              className={iconButtonClass}
              aria-label="Power"
            >
              <Power size={14} />
            </button>
            {showPowerMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPowerMenu(false)}
                />
                <div
                  className="ui-surface absolute right-0 top-full z-50 mt-2 min-w-[196px] overflow-hidden rounded-[var(--radius-lg)] p-1"
                  style={{ boxShadow: "var(--shadow-md)" }}
                >
                  <button
                    onClick={() => setShowPowerMenu(false)}
                    className="ui-control flex h-11 w-full justify-start rounded-[var(--radius-md)] px-3 text-sm"
                  >
                    <RotateCw size={16} />
                    {t("desktop.restart")}
                  </button>
                  <button
                    onClick={() => setShowPowerMenu(false)}
                    className="ui-control flex h-11 w-full justify-start rounded-[var(--radius-md)] px-3 text-sm"
                  >
                    <PowerOff size={16} />
                    {t("desktop.shutdown")}
                  </button>
                </div>
              </>
            )}
          </div>
          <div
            className="ml-2 hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex"
            style={{
              backgroundColor: "var(--bg-soft)",
              border: "1px solid var(--line-soft)",
            }}
          >
            <Monitor size={12} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {timeStr}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
