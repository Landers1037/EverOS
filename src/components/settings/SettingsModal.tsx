"use client";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useI18nStore } from "@/stores/useI18nStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { SystemConfig, NotificationConfig, ZoomLevel, LogLevel } from "@/stores/useSettingsStore";
import type { DockStyle } from "@/types/desktop";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Server,
  Bell,
  BellRing,
  BellOff,
  X,
} from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { id: "appearance" as const, key: "settings.appearance", icon: Palette },
  { id: "system" as const, key: "settings.system", icon: Server },
  { id: "notifications" as const, key: "settings.notifications", icon: Bell },
];

const ACCENT_COLORS = [
  { name: "Silver", value: "#AAB4C3" },
  { name: "Blue", value: "#7B93C7" },
  { name: "Green", value: "#8FAE9A" },
  { name: "Warm", value: "#C0A97C" },
  { name: "Rose", value: "#B98B8B" },
  { name: "Purple", value: "#9B8EC4" },
];

const ZOOM_OPTIONS: { value: number; label: string }[] = [
  { value: 75, label: "75%" },
  { value: 90, label: "90%" },
  { value: 100, label: "100%" },
  { value: 125, label: "125%" },
  { value: 150, label: "150%" },
];

export function SettingsModal() {
  const { t } = useTranslation();
  const {
    isOpen,
    close,
    activeCategory,
    setCategory,
    zoom,
    setZoom,
    accentColor,
    setAccentColor,
    dock,
    setDockStyle,
    system,
    updateSystem,
    notifications,
    updateNotifications,
  } = useSettingsStore();

  const { theme, setTheme } = useThemeStore();
  const { wallpaper, wallpapers, setWallpaper } = useDesktopStore();
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="flex flex-col overflow-hidden rounded-xl border"
        style={{
          width: 780,
          height: 540,
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          animation: "windowOpen 0.15s ease-out",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between flex-shrink-0 px-4"
          style={{
            height: 44,
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
              style={{
                width: 20,
                height: 20,
                backgroundColor: "var(--state-danger)",
              }}
              title={t("common.close")}
            >
              <X size={12} style={{ color: "#fff", opacity: 0.8 }} />
            </button>
          </div>
          <span
            className="text-sm font-medium absolute left-1/2 -translate-x-1/2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("apps.settings")}
          </span>
          <div style={{ width: 20 }} />
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className="flex-shrink-0 overflow-y-auto scrollbar-thin p-2"
            style={{ width: 180, borderRight: "1px solid var(--border-subtle)" }}
          >
            {CATEGORIES.map(({ id, key, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors"
                style={{
                  color:
                    activeCategory === id
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  backgroundColor:
                    activeCategory === id ? "var(--accent-muted)" : "transparent",
                }}
              >
                <Icon size={16} />
                {t(key)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {activeCategory === "appearance" && (
              <AppearanceSettings
                t={t}
                theme={theme}
                setTheme={setTheme}
                zoom={zoom}
                setZoom={setZoom}
                dock={dock}
                setDockStyle={setDockStyle}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                wallpaper={wallpaper}
                wallpapers={wallpapers}
                setWallpaper={setWallpaper}
              />
            )}
            {activeCategory === "system" && (
              <SystemSettings
                t={t}
                config={system}
                updateConfig={updateSystem}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
            {activeCategory === "notifications" && (
              <NotificationSettings
                t={t}
                config={notifications}
                updateConfig={updateNotifications}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Appearance ─── */
function AppearanceSettings({
  t,
  theme,
  setTheme,
  zoom,
  setZoom,
  dock,
  setDockStyle,
  accentColor,
  setAccentColor,
  wallpaper,
  wallpapers,
  setWallpaper,
}: {
  t: (key: string) => string;
  theme: string;
  setTheme: (t: "light" | "dark" | "system") => void;
  zoom: number;
  setZoom: (z: 75 | 90 | 100 | 125 | 150) => void;
  dock: { style: DockStyle };
  setDockStyle: (s: DockStyle) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  wallpaper: string;
  wallpapers: { id: string; name: string; src: string }[];
  setWallpaper: (id: string) => void;
}) {
  return (
    <div>
      <SectionTitle>{t("settings.appearance")}</SectionTitle>

      {/* Theme */}
      <SettingRow label={t("settings.theme")}>
        <div className="flex gap-2">
          {([
            { value: "light" as const, labelKey: "settings.themeLight", icon: Sun },
            { value: "dark" as const, labelKey: "settings.themeDark", icon: Moon },
            { value: "system" as const, labelKey: "settings.themeSystem", icon: Monitor },
          ] as const).map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  theme === value ? "var(--border-strong)" : "var(--border-default)",
                backgroundColor:
                  theme === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <Icon size={14} />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Accent Color */}
      <SettingRow label={t("settings.accentColor")}>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setAccentColor(c.value)}
              className="relative w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {accentColor === c.value && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Desktop Background */}
      <SettingRow label={t("settings.desktopBackground")}>
        <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
          {wallpapers.slice(0, 8).map((wp) => {
            const isGradient = wp.src.startsWith("linear");
            return (
              <button
                key={wp.id}
                onClick={() => setWallpaper(wp.id)}
                className="relative rounded-lg overflow-hidden aspect-video border transition-all hover:opacity-90"
                style={{
                  borderColor:
                    wallpaper === wp.id
                      ? "var(--accent)"
                      : "var(--border-subtle)",
                  outline: wallpaper === wp.id ? "2px solid var(--accent)" : "none",
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: isGradient ? wp.src : "var(--bg-input)",
                    backgroundSize: "cover",
                  }}
                />
              </button>
            );
          })}
        </div>
      </SettingRow>

      {/* Dock Style */}
      <SettingRow label={t("settings.dockStyle")}>
        <div className="flex gap-2">
          {([
            { value: "standard" as const, labelKey: "settings.dockStandard" },
            { value: "mini" as const, labelKey: "settings.dockMini" },
          ]).map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setDockStyle(value)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  dock.style === value ? "var(--border-strong)" : "var(--border-default)",
                backgroundColor:
                  dock.style === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Default Zoom */}
      <SettingRow label={t("settings.defaultZoom")}>
        <div className="flex gap-2">
          {ZOOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setZoom(opt.value as 75 | 90 | 100 | 125 | 150)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  zoom === opt.value
                    ? "var(--border-strong)"
                    : "var(--border-default)",
                backgroundColor:
                  zoom === opt.value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

/* ─── System ─── */
function SystemSettings({
  t,
  config,
  updateConfig,
  showPassword,
  setShowPassword,
}: {
  t: (key: string) => string;
  config: SystemConfig;
  updateConfig: (c: Partial<SystemConfig>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  const { locale, setLocale } = useI18nStore();

  return (
    <div>
      <SectionTitle>{t("settings.system")}</SectionTitle>

      {/* Language */}
      <SettingRow label={t("settings.language")}>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale("en")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
            style={{
              borderColor:
                locale === "en" ? "var(--border-strong)" : "var(--border-default)",
              backgroundColor:
                locale === "en" ? "var(--accent-muted)" : "transparent",
              color: "var(--text-primary)",
            }}
          >
            English
          </button>
          <button
            onClick={() => setLocale("zh")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
            style={{
              borderColor:
                locale === "zh" ? "var(--border-strong)" : "var(--border-default)",
              backgroundColor:
                locale === "zh" ? "var(--accent-muted)" : "transparent",
              color: "var(--text-primary)",
            }}
          >
            中文
          </button>
        </div>
      </SettingRow>

      {/* Backend Host */}
      <SettingRow label={t("settings.backendHost")}>
        <input
          type="text"
          value={config.host}
          onChange={(e) => updateConfig({ host: e.target.value })}
          placeholder="localhost"
          className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </SettingRow>

      {/* Port */}
      <SettingRow label={t("settings.port")}>
        <input
          type="number"
          value={config.port}
          onChange={(e) => updateConfig({ port: parseInt(e.target.value, 10) || 0 })}
          placeholder="8080"
          className="w-28 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </SettingRow>

      {/* Password */}
      <SettingRow label={t("settings.password")}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={config.password}
            onChange={(e) => updateConfig({ password: e.target.value })}
            placeholder="Enter password"
            className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors pr-8"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            {showPassword ? t("settings.hide") : t("settings.show")}
          </button>
        </div>
      </SettingRow>

      {/* Username */}
      <SettingRow label={t("settings.username")}>
        <input
          type="text"
          value={config.username}
          onChange={(e) => updateConfig({ username: e.target.value })}
          placeholder="admin"
          className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </SettingRow>

      {/* Log Level */}
      <SettingRow label={t("settings.logLevel")}>
        <select
          value={config.logLevel}
          onChange={(e) => updateConfig({ logLevel: e.target.value as LogLevel })}
          className="w-32 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </SettingRow>

      {/* Log Retention */}
      <SettingRow label={t("settings.logRetention")}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={config.logRetention}
            onChange={(e) =>
              updateConfig({ logRetention: parseInt(e.target.value, 10) || 0 })
            }
            className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {t("settings.days")}
          </span>
        </div>
      </SettingRow>
    </div>
  );
}

/* ─── Notifications ─── */
function NotificationSettings({
  t,
  config,
  updateConfig,
}: {
  t: (key: string) => string;
  config: NotificationConfig;
  updateConfig: (c: Partial<NotificationConfig>) => void;
}) {
  return (
    <div>
      <SectionTitle>{t("settings.notifications")}</SectionTitle>

      {/* Notification Level */}
      <SettingRow label={t("settings.notificationLevel")}>
        <div className="flex gap-2">
          {([
            { value: "all" as const, labelKey: "settings.all", icon: BellRing },
            { value: "important" as const, labelKey: "settings.important", icon: Bell },
            { value: "none" as const, labelKey: "settings.none", icon: BellOff },
          ] as const).map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateConfig({ level: value })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  config.level === value
                    ? "var(--border-strong)"
                    : "var(--border-default)",
                backgroundColor:
                  config.level === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <Icon size={14} />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Notification Scope */}
      <SettingRow label={t("settings.scope")}>
        <div className="flex gap-2">
          {([
            { value: "all" as const, labelKey: "settings.allApps" },
            { value: "system" as const, labelKey: "settings.systemOnly" },
            { value: "custom" as const, labelKey: "settings.custom" },
          ] as const).map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => updateConfig({ scope: value })}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  config.scope === value
                    ? "var(--border-strong)"
                    : "var(--border-default)",
                backgroundColor:
                  config.scope === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Notification Style */}
      <SettingRow label={t("settings.style")}>
        <div className="flex gap-2">
          {([
            { value: "banner" as const, labelKey: "settings.banner" },
            { value: "alert" as const, labelKey: "settings.alert" },
            { value: "none" as const, labelKey: "settings.none" },
          ] as const).map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => updateConfig({ style: value })}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  config.style === value
                    ? "var(--border-strong)"
                    : "var(--border-default)",
                backgroundColor:
                  config.style === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

/* ─── Shared helpers ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-base font-semibold mb-5 pb-3"
      style={{
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </h2>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-6 mb-5"
      style={{ minHeight: 36 }}
    >
      <div
        className="text-sm font-medium flex-shrink-0 pt-1.5"
        style={{ width: 140, color: "var(--text-secondary)" }}
      >
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}