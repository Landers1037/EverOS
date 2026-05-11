"use client";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useDesktopStore } from "@/stores/useDesktopStore";
import type { SystemConfig, NotificationConfig, ZoomLevel, LogLevel } from "@/stores/useSettingsStore";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  MonitorIcon,
  Server,
  KeyRound,
  User,
  FileText,
  Bell,
  BellRing,
  BellOff,
  X,
} from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "system" as const, label: "System", icon: Server },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
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
  const {
    isOpen,
    close,
    activeCategory,
    setCategory,
    zoom,
    setZoom,
    accentColor,
    setAccentColor,
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
              title="Close"
            >
              <X size={12} style={{ color: "#fff", opacity: 0.8 }} />
            </button>
          </div>
          <span
            className="text-sm font-medium absolute left-1/2 -translate-x-1/2"
            style={{ color: "var(--text-primary)" }}
          >
            Settings
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
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
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
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {activeCategory === "appearance" && (
              <AppearanceSettings
                theme={theme}
                setTheme={setTheme}
                zoom={zoom}
                setZoom={setZoom}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                wallpaper={wallpaper}
                wallpapers={wallpapers}
                setWallpaper={setWallpaper}
              />
            )}
            {activeCategory === "system" && (
              <SystemSettings
                config={system}
                updateConfig={updateSystem}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
            {activeCategory === "notifications" && (
              <NotificationSettings
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
  theme,
  setTheme,
  zoom,
  setZoom,
  accentColor,
  setAccentColor,
  wallpaper,
  wallpapers,
  setWallpaper,
}: {
  theme: string;
  setTheme: (t: "light" | "dark" | "system") => void;
  zoom: number;
  setZoom: (z: 75 | 90 | 100 | 125 | 150) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  wallpaper: string;
  wallpapers: { id: string; name: string; src: string }[];
  setWallpaper: (id: string) => void;
}) {
  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>

      {/* Theme */}
      <SettingRow label="Theme">
        <div className="flex gap-2">
          {([
            { value: "light" as const, label: "Light", icon: Sun },
            { value: "dark" as const, label: "Dark", icon: Moon },
            { value: "system" as const, label: "System", icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
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
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Accent Color */}
      <SettingRow label="Accent Color">
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
      <SettingRow label="Desktop Background">
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

      {/* Default Zoom */}
      <SettingRow label="Default Zoom">
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
  config,
  updateConfig,
  showPassword,
  setShowPassword,
}: {
  config: SystemConfig;
  updateConfig: (c: Partial<SystemConfig>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  return (
    <div>
      <SectionTitle>System</SectionTitle>

      {/* Backend Host */}
      <SettingRow label="Backend Host">
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
      <SettingRow label="Port">
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
      <SettingRow label="Password">
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
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </SettingRow>

      {/* Username */}
      <SettingRow label="Username">
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
      <SettingRow label="Log Level">
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
      <SettingRow label="Log Retention">
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
            days
          </span>
        </div>
      </SettingRow>
    </div>
  );
}

/* ─── Notifications ─── */
function NotificationSettings({
  config,
  updateConfig,
}: {
  config: NotificationConfig;
  updateConfig: (c: Partial<NotificationConfig>) => void;
}) {
  return (
    <div>
      <SectionTitle>Notifications</SectionTitle>

      {/* Notification Level */}
      <SettingRow label="Notification Level">
        <div className="flex gap-2">
          {([
            { value: "all" as const, label: "All", icon: BellRing },
            { value: "important" as const, label: "Important", icon: Bell },
            { value: "none" as const, label: "None", icon: BellOff },
          ] as const).map(({ value, label, icon: Icon }) => (
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
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Notification Scope */}
      <SettingRow label="Scope">
        <div className="flex gap-2">
          {([
            { value: "all" as const, label: "All Apps" },
            { value: "system" as const, label: "System Only" },
            { value: "custom" as const, label: "Custom" },
          ] as const).map(({ value, label }) => (
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
              {label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Notification Style */}
      <SettingRow label="Style">
        <div className="flex gap-2">
          {([
            { value: "banner" as const, label: "Banner" },
            { value: "alert" as const, label: "Alert" },
            { value: "none" as const, label: "None" },
          ] as const).map(({ value, label }) => (
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
              {label}
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