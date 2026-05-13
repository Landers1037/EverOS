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
      className="ui-surface fixed z-50 min-w-52 rounded-[var(--radius-xl)] p-2"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <p
        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("desktop.wallpaper")}
      </p>
      {wallpapers.slice(0, 5).map((wp) => (
        <button
          key={wp.id}
          className="ui-control flex h-10 w-full justify-start gap-3 rounded-[var(--radius-md)] px-3 text-sm"
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
        className="ui-divider my-2 mx-2 h-px"
      />
      <button
        className="ui-control flex h-10 w-full justify-start gap-2 rounded-[var(--radius-md)] px-3 text-sm"
        style={{ color: "var(--text-primary)" }}
        onClick={hideContextMenu}
      >
        {t("common.refresh")}
      </button>
    </div>
  );
}
