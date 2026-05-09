"use client";
import { useState, useMemo } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { MOCK_NOTIFICATIONS } from "@/mock/notifications";
import { useTranslation } from "@/hooks/useTranslation";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface NotificationCenterProps {
  onClose: () => void;
}

const typeConfig = {
  info: { icon: Info, color: "var(--accent)" },
  success: { icon: CheckCircle, color: "#22c55e" },
  warning: { icon: AlertTriangle, color: "#f59e0b" },
  error: { icon: AlertCircle, color: "#ef4444" },
};

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { t } = useTranslation();
  const ref = useClickOutside<HTMLDivElement>(onClose);

  return (
    <div
      ref={ref}
      className="absolute right-2 top-10 w-80 rounded-lg border shadow-lg overflow-hidden z-50"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
        animation: "slideInRight 0.2s ease-out",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("desktop.notifications")}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--accent-muted)]"
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {MOCK_NOTIFICATIONS.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            {t("desktop.noNotifications")}
          </div>
        ) : (
          MOCK_NOTIFICATIONS.map((notif) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                className={`flex gap-3 px-3 py-2.5 border-b hover:bg-[var(--accent-muted)] transition-colors ${
                  !notif.read ? "bg-[var(--accent-muted)]" : ""
                }`}
                style={{ borderColor: "var(--border-subtle)", opacity: notif.read ? 0.7 : 1 }}
              >
                <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {notif.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}