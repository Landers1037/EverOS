"use client";
import { useI18nStore } from "@/stores/useI18nStore";

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const t = useI18nStore((s) => s.t);

  return { t, locale };
}
