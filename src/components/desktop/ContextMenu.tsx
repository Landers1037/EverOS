"use client";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useTranslation } from "@/hooks/useTranslation";

export function ContextMenu() {
  const { contextMenu, hideContextMenu, setWallpaper, wallpapers } =
    useDesktopStore();
  const { t } = useTranslation();

  const ref = useClickOutside<HTMLDivElement>(() => {
    if (contextMenu) hideContextMenu();
  });

  if (!contextMenu) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-44 rounded-lg border shadow-lg py-1"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
      }}
    >
      <p
        className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("desktop.wallpaper")}
      </p>
      {wallpapers.slice(0, 5).map((wp) => (
        <button
          key={wp.id}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-[var(--accent-muted)] transition-colors"
          style={{ color: "var(--text-primary)" }}
          onClick={() => {
            setWallpaper(wp.id);
            hideContextMenu();
          }}
        >
          <span
            className="w-4 h-4 rounded"
            style={{
              background: wp.src.startsWith("linear")
                ? wp.src
                : "var(--bg-input)",
            }}
          />
          {wp.name}
        </button>
      ))}
      <div
        className="my-1 mx-2 h-px"
        style={{ backgroundColor: "var(--border-default)" }}
      />
      <button
        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-[var(--accent-muted)] transition-colors"
        style={{ color: "var(--text-primary)" }}
        onClick={hideContextMenu}
      >
        {t("common.refresh")}
      </button>
    </div>
  );
}