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
} from "lucide-react";

export function SystemBar() {
  const time = useClock();
  const { toggleSidebar, hideContextMenu } = useDesktopStore();
  const { toggleTheme, resolved } = useThemeStore();
  const { t } = useTranslation();
  const instances = useAppStore((s) => s.instances);
  const activeInstance = instances.find((i) => i.isFocused);
  const [showNotifications, setShowNotifications] = useState(false);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center h-10 px-3 border-b"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--accent-muted)]"
          aria-label={t("desktop.sidebar")}
        >
          <Menu size={16} />
        </button>
        <span
          className="text-sm font-medium ml-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {activeInstance ? t(activeInstance.title) : "EverOS"}
        </span>
      </div>

      {/* Center section */}
      <div className="flex-1 flex justify-center" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Wifi size={14} style={{ color: "var(--text-tertiary)" }} />
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--accent-muted)]"
          aria-label={t("settings.theme")}
        >
          {resolved === "dark" ? (
            <Sun size={14} />
          ) : (
            <Moon size={14} />
          )}
        </button>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            hideContextMenu();
          }}
          className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--accent-muted)]"
        >
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
        <div className="flex items-center gap-1.5 text-xs font-medium ml-1">
          <Monitor size={12} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-primary)" }}>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}