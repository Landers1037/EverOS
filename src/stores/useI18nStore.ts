import { create } from "zustand";
import type { Locale } from "@/types/desktop";
import { en, zh } from "@/i18n";

const STORAGE_KEY = "everos-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(STORAGE_KEY) as Locale) ?? "en";
}

const translationsMap: Record<Locale, Record<string, unknown>> = { en, zh };

interface I18nState {
  locale: Locale;
  translations: Record<string, unknown>;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const useI18nStore = create<I18nState>((set, get) => {
  const initial = getInitialLocale();
  return {
    locale: initial,
    translations: translationsMap[initial],

    setLocale: (locale) => {
      localStorage.setItem(STORAGE_KEY, locale);
      set({ locale, translations: translationsMap[locale] });
    },

    t: (key, params) => {
      const { translations } = get();
      const value = key
        .split(".")
        .reduce(
          (obj: unknown, k: string) =>
            obj && typeof obj === "object" ? (obj as Record<string, unknown>)[k] : undefined,
          translations
        );

      if (typeof value !== "string") return key;

      if (!params) return value;
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), v),
        value
      );
    },
  };
});