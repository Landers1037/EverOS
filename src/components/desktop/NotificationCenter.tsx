"use client";
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
      className="ui-surface absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-[var(--radius-xl)]"
      style={{
        animation: "slideInRight 0.2s var(--easing-default)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--divider-strong)" }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("desktop.notifications")}
        </span>
        <button
          onClick={onClose}
          className="ui-control ui-icon-button h-8 w-8 rounded-[var(--radius-md)]"
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto scrollbar-thin p-2">
        {MOCK_NOTIFICATIONS.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            {t("desktop.noNotifications")}
          </div>
        ) : (
          MOCK_NOTIFICATIONS.map((notif) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                className="mb-2 flex gap-3 rounded-[var(--radius-lg)] border px-3 py-3"
                style={{
                  borderColor: notif.read ? "var(--border-subtle)" : "var(--border-strong)",
                  backgroundColor: notif.read ? "var(--bg-soft)" : "var(--accent-muted)",
                  opacity: notif.read ? 0.78 : 1,
                }}
              >
                <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {notif.title}
                  </p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
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
