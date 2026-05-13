"use client";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useI18nStore } from "@/stores/useI18nStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { SystemConfig, NotificationConfig, LogLevel, StorageConfig, FileStoragePath, FilePermission, DatabaseEngine } from "@/stores/useSettingsStore";
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
  HardDrive,
  Folder,
  Database,
  Trash2,
  Plus,
} from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { id: "appearance" as const, key: "settings.appearance", icon: Palette },
  { id: "system" as const, key: "settings.system", icon: Server },
  { id: "notifications" as const, key: "settings.notifications", icon: Bell },
  { id: "storage" as const, key: "settings.storage", icon: HardDrive },
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
    uiStyle,
    setUiStyle,
    globalOpacity,
    setGlobalOpacity,
    sidebarOpacity,
    setSidebarOpacity,
    resetSidebarOpacity,
    dockOpacity,
    setDockOpacity,
    resetDockOpacity,
    dock,
    setDockStyle,
    system,
    updateSystem,
    notifications,
    updateNotifications,
    storage,
    updateFilePath,
    addFilePath,
    removeFilePath,
    setDatabaseEngine,
    updateDatabaseConfig,
    updateTempConfig,
    clearTempFiles,
  } = useSettingsStore();

  const { theme, setTheme } = useThemeStore();
  const { wallpaper, wallpapers, setWallpaper } = useDesktopStore();
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--scrim)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="ui-surface flex flex-col overflow-hidden rounded-[var(--radius-2xl)]"
        style={{
          width: 860,
          height: 580,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 56px)",
          boxShadow: "var(--shadow-lg)",
          animation: "windowOpen 0.18s var(--easing-default)",
          backgroundImage: "var(--panel-highlight)",
        }}
      >
        <div
          className="flex items-center justify-between flex-shrink-0 px-5"
          style={{
            height: "var(--window-title-height)",
            borderBottom: "1px solid var(--divider-strong)",
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
            className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("apps.settings")}
          </span>
          <div style={{ width: 20 }} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex-shrink-0 overflow-y-auto scrollbar-thin p-3"
            style={{
              width: 220,
              borderRight: "1px solid var(--divider-strong)",
              backgroundColor: "var(--bg-soft)",
            }}
          >
            {CATEGORIES.map(({ id, key, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className="ui-control mb-1 flex h-11 w-full justify-start gap-3 rounded-[var(--radius-lg)] px-3 text-sm"
                style={{
                  color:
                    activeCategory === id
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  backgroundColor:
                    activeCategory === id ? "var(--accent-muted)" : "transparent",
                  borderColor:
                    activeCategory === id ? "var(--border-strong)" : "transparent",
                }}
              >
                <Icon size={16} />
                {t(key)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
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
                uiStyle={uiStyle}
                setUiStyle={setUiStyle}
                globalOpacity={globalOpacity}
                setGlobalOpacity={setGlobalOpacity}
                sidebarOpacity={sidebarOpacity}
                setSidebarOpacity={setSidebarOpacity}
                resetSidebarOpacity={resetSidebarOpacity}
                dockOpacity={dockOpacity}
                setDockOpacity={setDockOpacity}
                resetDockOpacity={resetDockOpacity}
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
            {activeCategory === "storage" && (
              <StorageSettings
                t={t}
                storage={storage}
                updateFilePath={updateFilePath}
                addFilePath={addFilePath}
                removeFilePath={removeFilePath}
                setDatabaseEngine={setDatabaseEngine}
                updateDatabaseConfig={updateDatabaseConfig}
                updateTempConfig={updateTempConfig}
                clearTempFiles={clearTempFiles}
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
  uiStyle,
  setUiStyle,
  globalOpacity,
  setGlobalOpacity,
  sidebarOpacity,
  setSidebarOpacity,
  resetSidebarOpacity,
  dockOpacity,
  setDockOpacity,
  resetDockOpacity,
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
  uiStyle: "gradient" | "minimal";
  setUiStyle: (style: "gradient" | "minimal") => void;
  globalOpacity: number;
  setGlobalOpacity: (opacity: number) => void;
  sidebarOpacity: number | null;
  setSidebarOpacity: (opacity: number) => void;
  resetSidebarOpacity: () => void;
  dockOpacity: number | null;
  setDockOpacity: (opacity: number) => void;
  resetDockOpacity: () => void;
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

      <SettingRow label={t("settings.uiStyle")}>
        <div className="flex gap-2">
          {([
            { value: "gradient" as const, labelKey: "settings.uiStyleGradient" },
            { value: "minimal" as const, labelKey: "settings.uiStyleMinimal" },
          ] as const).map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setUiStyle(value)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  uiStyle === value ? "var(--border-strong)" : "var(--border-default)",
                backgroundColor:
                  uiStyle === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label={t("settings.globalOpacity")}>
        <OpacitySlider value={globalOpacity} onChange={setGlobalOpacity} />
      </SettingRow>

      <SettingRow label={t("settings.sidebarOpacity")}>
        <OpacityControl
          value={sidebarOpacity ?? globalOpacity}
          onChange={setSidebarOpacity}
          inherited={sidebarOpacity === null}
          inheritedLabel={t("settings.followGlobal")}
          onReset={resetSidebarOpacity}
        />
      </SettingRow>

      <SettingRow label={t("settings.dockOpacity")}>
        <OpacityControl
          value={dockOpacity ?? globalOpacity}
          onChange={setDockOpacity}
          inherited={dockOpacity === null}
          inheritedLabel={t("settings.followGlobal")}
          onReset={resetDockOpacity}
        />
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

/* ─── Storage ─── */
function StorageSettings({
  t,
  storage,
  updateFilePath,
  addFilePath,
  removeFilePath,
  setDatabaseEngine,
  updateDatabaseConfig,
  updateTempConfig,
  clearTempFiles,
}: {
  t: (key: string) => string;
  storage: StorageConfig;
  updateFilePath: (id: string, config: Partial<FileStoragePath>) => void;
  addFilePath: () => void;
  removeFilePath: (id: string) => void;
  setDatabaseEngine: (engine: DatabaseEngine) => void;
  updateDatabaseConfig: (engine: DatabaseEngine, config: Record<string, string | number>) => void;
  updateTempConfig: (config: Record<string, string | number>) => void;
  clearTempFiles: () => void;
}) {
  const [subTab, setSubTab] = useState<"file" | "temp" | "database">("file");

  const subTabs = [
    { id: "file" as const, key: "settings.fileStorage", icon: Folder },
    { id: "temp" as const, key: "settings.tempFiles", icon: Trash2 },
    { id: "database" as const, key: "settings.dataStorage", icon: Database },
  ];

  return (
    <div>
      <SectionTitle>{t("settings.storage")}</SectionTitle>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-5 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {subTabs.map(({ id, key, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              color:
                subTab === id ? "var(--text-primary)" : "var(--text-secondary)",
              backgroundColor:
                subTab === id ? "var(--accent-muted)" : "transparent",
            }}
          >
            <Icon size={14} />
            {t(key)}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === "file" && (
        <FileStorageSettings
          t={t}
          filePaths={storage.filePaths}
          updateFilePath={updateFilePath}
          addFilePath={addFilePath}
          removeFilePath={removeFilePath}
        />
      )}
      {subTab === "temp" && (
        <TempFileSettings
          t={t}
          config={storage.temp}
          updateTempConfig={updateTempConfig}
          clearTempFiles={clearTempFiles}
        />
      )}
      {subTab === "database" && (
        <DataStorageSettings
          t={t}
          database={storage.database}
          setDatabaseEngine={setDatabaseEngine}
          updateDatabaseConfig={updateDatabaseConfig}
        />
      )}
    </div>
  );
}

/* ─── File Storage ─── */
function FileStorageSettings({
  t,
  filePaths,
  updateFilePath,
  addFilePath,
  removeFilePath,
}: {
  t: (key: string) => string;
  filePaths: FileStoragePath[];
  updateFilePath: (id: string, config: Partial<FileStoragePath>) => void;
  addFilePath: () => void;
  removeFilePath: (id: string) => void;
}) {
  return (
    <div>
      {filePaths.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-sm rounded-lg border border-dashed mb-4"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" }}
        >
          <Folder size={32} className="mb-2" style={{ opacity: 0.4 }} />
          <span style={{ color: "var(--text-tertiary)", textAlign: "center" }}>
            No storage paths configured
          </span>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {filePaths.map((fp) => (
            <div
              key={fp.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-panel)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-3">
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t("settings.storagePath")}
                  </label>
                  <input
                    type="text"
                    value={fp.path}
                    onChange={(e) => updateFilePath(fp.id, { path: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <button
                  onClick={() => removeFilePath(fp.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: "var(--state-danger)" }}
                  title={t("settings.removePath")}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex gap-4 mb-3">
                {/* Permission */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t("settings.permission")}
                  </label>
                  <div className="flex gap-1">
                    {(["read", "readwrite"] as FilePermission[]).map((perm) => (
                      <button
                        key={perm}
                        onClick={() => updateFilePath(fp.id, { permission: perm })}
                        className="px-2.5 py-1 rounded-md text-xs border transition-colors"
                        style={{
                          borderColor:
                            fp.permission === perm
                              ? "var(--border-strong)"
                              : "var(--border-default)",
                          backgroundColor:
                            fp.permission === perm ? "var(--accent-muted)" : "transparent",
                          color: "var(--text-primary)",
                        }}
                      >
                        {perm === "read" ? t("settings.readOnly") : t("settings.readWrite")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disk Type */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t("settings.diskType")}
                  </label>
                  <div
                    className="px-2.5 py-1 rounded-md text-xs"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {fp.diskType || "—"}
                  </div>
                </div>
              </div>

              {/* Space usage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {t("settings.totalSpace")}: {formatSize(fp.totalSpace)}
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {t("settings.usedSpace")}: {formatSize(fp.usedSpace)}
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-input)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: fp.totalSpace > 0 ? `${Math.min(100, (fp.usedSpace / fp.totalSpace) * 100)}%` : "0%",
                      backgroundColor: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addFilePath}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
        style={{
          borderColor: "var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        <Plus size={14} />
        {t("settings.addPath")}
      </button>
    </div>
  );
}

/* ─── Temp Files ─── */
function TempFileSettings({
  t,
  config,
  updateTempConfig,
  clearTempFiles,
}: {
  t: (key: string) => string;
  config: { path: string; usedSpace: number; freeSpace: number };
  updateTempConfig: (c: Record<string, string | number>) => void;
  clearTempFiles: () => void;
}) {
  return (
    <div>
      {/* Temp Path */}
      <SettingRow label={t("settings.tempPath")}>
        <input
          type="text"
          value={config.path}
          onChange={(e) => updateTempConfig({ path: e.target.value })}
          className="w-64 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </SettingRow>

      {/* Used Space */}
      <SettingRow label={t("settings.usedSpace")}>
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[200px]">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--bg-input)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: config.usedSpace + config.freeSpace > 0
                    ? `${(config.usedSpace / (config.usedSpace + config.freeSpace)) * 100}%`
                    : "0%",
                  backgroundColor: "var(--state-warning)",
                }}
              />
            </div>
          </div>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {formatSize(config.usedSpace)}
          </span>
        </div>
      </SettingRow>

      {/* Free Space */}
      <SettingRow label={t("settings.freeSpace")}>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatSize(config.freeSpace)}
        </span>
      </SettingRow>

      {/* Clear Button */}
      <div className="pt-2">
        <button
          onClick={clearTempFiles}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--state-danger)",
            color: "#fff",
          }}
        >
          <Trash2 size={14} />
          {t("settings.clearTemp")}
        </button>
      </div>
    </div>
  );
}

/* ─── Data Storage ─── */
function DataStorageSettings({
  t,
  database,
  setDatabaseEngine,
  updateDatabaseConfig,
}: {
  t: (key: string) => string;
  database: {
    engine: DatabaseEngine;
    sqlite: { databaseName: string; path: string };
    bbolt: { databaseName: string; path: string };
    mysql: { host: string; port: number; username: string; password: string; databaseName: string; dsnParams: string };
  };
  setDatabaseEngine: (engine: DatabaseEngine) => void;
  updateDatabaseConfig: (engine: DatabaseEngine, config: Record<string, string | number>) => void;
}) {
  const engines: { value: DatabaseEngine; labelKey: string }[] = [
    { value: "sqlite", labelKey: "settings.sqlite" },
    { value: "bbolt", labelKey: "settings.bbolt" },
    { value: "mysql", labelKey: "settings.mysql" },
  ];

  return (
    <div>
      {/* Engine Selector */}
      <SettingRow label={t("settings.databaseEngine")}>
        <div className="flex gap-2">
          {engines.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setDatabaseEngine(value)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor:
                  database.engine === value ? "var(--border-strong)" : "var(--border-default)",
                backgroundColor:
                  database.engine === value ? "var(--accent-muted)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <Database size={14} />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Engine-specific config */}
      {database.engine === "sqlite" && (
        <>
          <SettingRow label={t("settings.databaseName")}>
            <input
              type="text"
              value={database.sqlite.databaseName}
              onChange={(e) => updateDatabaseConfig("sqlite", { databaseName: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.storagePath")}>
            <input
              type="text"
              value={database.sqlite.path}
              onChange={(e) => updateDatabaseConfig("sqlite", { path: e.target.value })}
              className="w-64 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
        </>
      )}

      {database.engine === "bbolt" && (
        <>
          <SettingRow label={t("settings.databaseName")}>
            <input
              type="text"
              value={database.bbolt.databaseName}
              onChange={(e) => updateDatabaseConfig("bbolt", { databaseName: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.storagePath")}>
            <input
              type="text"
              value={database.bbolt.path}
              onChange={(e) => updateDatabaseConfig("bbolt", { path: e.target.value })}
              className="w-64 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
        </>
      )}

      {database.engine === "mysql" && (
        <>
          <SettingRow label={t("settings.host")}>
            <input
              type="text"
              value={database.mysql.host}
              onChange={(e) => updateDatabaseConfig("mysql", { host: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.port")}>
            <input
              type="number"
              value={database.mysql.port}
              onChange={(e) => updateDatabaseConfig("mysql", { port: parseInt(e.target.value, 10) || 0 })}
              className="w-28 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.username")}>
            <input
              type="text"
              value={database.mysql.username}
              onChange={(e) => updateDatabaseConfig("mysql", { username: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.password")}>
            <input
              type="password"
              value={database.mysql.password}
              onChange={(e) => updateDatabaseConfig("mysql", { password: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.databaseName")}>
            <input
              type="text"
              value={database.mysql.databaseName}
              onChange={(e) => updateDatabaseConfig("mysql", { databaseName: e.target.value })}
              className="w-56 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
          <SettingRow label={t("settings.dsnParams")}>
            <input
              type="text"
              value={database.mysql.dsnParams}
              onChange={(e) => updateDatabaseConfig("mysql", { dsnParams: e.target.value })}
              placeholder="charset=utf8mb4&parseTime=True"
              className="w-72 px-3 py-1.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </SettingRow>
        </>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function formatSize(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

function OpacitySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex max-w-sm items-center gap-3">
      <input
        type="range"
        min={35}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${value}%, var(--bg-input) ${value}%, var(--bg-input) 100%)`,
        }}
      />
      <span
        className="min-w-[52px] text-right text-sm font-medium tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}%
      </span>
    </div>
  );
}

function OpacityControl({
  value,
  onChange,
  inherited,
  inheritedLabel,
  onReset,
}: {
  value: number;
  onChange: (value: number) => void;
  inherited: boolean;
  inheritedLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="max-w-sm">
      <OpacitySlider value={value} onChange={onChange} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {inherited ? inheritedLabel : `${value}%`}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border px-2.5 py-1 text-xs transition-colors"
          style={{
            color: "var(--text-secondary)",
            borderColor: "var(--border-default)",
            backgroundColor: inherited ? "var(--accent-muted)" : "transparent",
          }}
        >
          {inherited ? inheritedLabel : `${inheritedLabel}`}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-6 pb-3 text-base font-semibold"
      style={{
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--divider-strong)",
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
      className="mb-6 flex items-start gap-6"
      style={{ minHeight: 36 }}
    >
      <div
        className="flex-shrink-0 pt-1.5 text-sm font-medium"
        style={{ width: 140, color: "var(--text-secondary)" }}
      >
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
