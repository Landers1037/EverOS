"use client";
import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useKeyboard(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      for (const sc of shortcuts) {
        const ctrlOrMeta = sc.ctrl || sc.meta;
        const matchesMod =
          (ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true) &&
          (sc.alt ? e.altKey : true) &&
          (sc.shift ? e.shiftKey : true);
        if (e.key === sc.key && matchesMod) {
          e.preventDefault();
          sc.handler();
          return;
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [shortcuts]);
}