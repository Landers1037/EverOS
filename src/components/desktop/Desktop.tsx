"use client";
import { useCallback, useMemo } from "react";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { DesktopArea } from "./DesktopArea";
import { SystemBar } from "./SystemBar";
import { Sidebar } from "./Sidebar";
import { Dock } from "./Dock";
import { WindowManager } from "@/components/window/WindowManager";
import { ContextMenu } from "./ContextMenu";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useKeyboard } from "@/hooks/useKeyboard";

export function Desktop() {
  const { bootComplete, contextMenu, hideContextMenu } = useDesktopStore();

  const shortcuts = useMemo(
    () => [
      { key: "Escape", handler: () => { if (contextMenu) hideContextMenu(); } },
    ],
    [contextMenu, hideContextMenu]
  );
  useKeyboard(shortcuts);

  if (!bootComplete) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <DesktopArea />
      <Sidebar />
      <ErrorBoundary>
        <WindowManager />
      </ErrorBoundary>
      <SystemBar />
      <Dock />
      <ContextMenu />
    </div>
  );
}