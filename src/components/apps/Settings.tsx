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

export function Settings({}: SettingsProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { wallpaper, wallpapers, setWallpaper } = useDesktopStore();
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex h-full">
      <div
        className="w-52 flex-shrink-0 overflow-y-auto scrollbar-thin p-3"
        style={{
          borderRight: "1px solid var(--divider-strong)",
          backgroundColor: "var(--bg-soft)",
        }}
      >
        {[
          { id: "appearance", label: t("settings.appearance"), icon: Palette },
          { id: "language", label: t("settings.language"), icon: Languages },
          { id: "about", label: t("settings.about"), icon: Info },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="ui-control mb-1 flex h-11 w-full justify-start gap-2 rounded-[var(--radius-md)] px-3 text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
        <section className="mb-8">
          <h2 className="mb-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("settings.appearance")}
          </h2>

          <div className="mb-6">
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
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
                  className={`ui-control h-10 rounded-[var(--radius-md)] border px-4 text-sm ${
                    theme === value ? "ui-control-active" : ""
                  }`}
                  style={{
                    borderColor: theme === value ? "var(--border-strong)" : "var(--border-default)",
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

          <div className="mb-6">
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {t("desktop.wallpaper")}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {wallpapers.map((wp) => {
                const isGradient = wp.src.startsWith("linear");
                return (
                  <button
                    key={wp.id}
                    className={`relative aspect-video overflow-hidden rounded-[var(--radius-lg)] border transition-all ${
                      wallpaper === wp.id
                        ? "border-[var(--border-strong)]"
                        : "border-transparent hover:border-[var(--border-default)]"
                    }`}
                    style={{
                      boxShadow: wallpaper === wp.id ? "0 0 0 3px var(--focus-ring)" : "none",
                    }}
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
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--fill-solid)]">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 truncate px-2 py-1 text-[10px] text-white bg-black/45 text-center">
                      {wp.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("settings.language")}
          </h2>
          <div className="flex gap-2">
            <button
              className={`ui-control h-10 rounded-[var(--radius-md)] border px-4 text-sm ${
                locale === "en" ? "ui-control-active" : ""
              }`}
              style={{
                borderColor: locale === "en" ? "var(--border-strong)" : "var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button
              className={`ui-control h-10 rounded-[var(--radius-md)] border px-4 text-sm ${
                locale === "zh" ? "ui-control-active" : ""
              }`}
              style={{
                borderColor: locale === "zh" ? "var(--border-strong)" : "var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setLocale("zh")}
            >
              中文
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("settings.about")}
          </h2>
          <div className="ui-card max-w-md rounded-[var(--radius-xl)] p-5">
            <h3 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>EverOS</h3>
            <p className="mb-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
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
