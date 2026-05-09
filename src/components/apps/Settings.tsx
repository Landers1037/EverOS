"use client";
import type { AppInstance } from "@/types/app";
import { useThemeStore } from "@/stores/useThemeStore";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useI18nStore } from "@/stores/useI18nStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Sun, Moon, Monitor, Languages, Palette, Info } from "lucide-react";

interface SettingsProps {
  instance: AppInstance;
}

export function Settings({ instance: _instance }: SettingsProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { wallpaper, wallpapers, setWallpaper } = useDesktopStore();
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex h-full">
      {/* Settings nav */}
      <div
        className="w-44 flex-shrink-0 border-r overflow-y-auto scrollbar-thin p-2"
        style={{ borderColor: "var(--border-default)" }}
      >
        {[
          { id: "appearance", label: t("settings.appearance"), icon: Palette },
          { id: "language", label: t("settings.language"), icon: Languages },
          { id: "about", label: t("settings.about"), icon: Info },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[var(--accent-muted)] transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {t("settings.appearance")}
          </h2>

          {/* Theme */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              {t("settings.theme")}
            </p>
            <div className="flex gap-2">
              {[
                { value: "light" as const, label: t("settings.themeLight"), icon: Sun },
                { value: "dark" as const, label: t("settings.themeDark"), icon: Moon },
                { value: "system" as const, label: t("settings.themeSystem"), icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                    theme === value ? "border-[var(--accent)] bg-[var(--accent-muted)]" : ""
                  }`}
                  style={{
                    borderColor: theme === value ? "var(--accent)" : "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  onClick={() => setTheme(value)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallpaper */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              {t("desktop.wallpaper")}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {wallpapers.map((wp) => {
                const isGradient = wp.src.startsWith("linear");
                return (
                  <button
                    key={wp.id}
                    className={`relative rounded-lg overflow-hidden aspect-video border-2 transition-all ${
                      wallpaper === wp.id
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                        : "border-transparent hover:border-[var(--border-default)]"
                    }`}
                    onClick={() => setWallpaper(wp.id)}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        background: isGradient ? wp.src : "var(--bg-input)",
                        backgroundSize: "cover",
                      }}
                    />
                    {wallpaper === wp.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/50 px-1 py-0.5 truncate text-center">
                      {wp.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {t("settings.language")}
          </h2>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                locale === "en" ? "border-[var(--accent)] bg-[var(--accent-muted)]" : ""
              }`}
              style={{
                borderColor: locale === "en" ? "var(--accent)" : "var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                locale === "zh" ? "border-[var(--accent)] bg-[var(--accent-muted)]" : ""
              }`}
              style={{
                borderColor: locale === "zh" ? "var(--accent)" : "var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setLocale("zh")}
            >
              中文
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {t("settings.about")}
          </h2>
          <div className="max-w-md rounded-lg border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>EverOS</h3>
            <p className="text-sm mb-2" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.description")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.version")} 0.1.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}