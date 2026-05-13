"use client";
import { useDesktopStore } from "@/stores/useDesktopStore";

export function DesktopArea() {
  const { wallpaper, wallpapers, customWallpaper, wallpaperMode, wallpaperBlur } = useDesktopStore();
  const current = wallpapers.find((w) => w.id === wallpaper);

  const isGradient =
    !customWallpaper &&
    (current?.src.startsWith("linear-gradient") ||
    current?.src.startsWith("radial-gradient"));

  const style: React.CSSProperties = {
    backgroundImage: customWallpaper 
      ? `url(${customWallpaper})` 
      : isGradient
        ? current?.src
        : `url(${current?.src})`,
    backgroundSize: wallpaperMode === "cover" ? "cover" : wallpaperMode === "stretch" ? "100% 100%" : "auto",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: `saturate(0.9) contrast(0.95) blur(${wallpaperBlur}px)`,
    transform: wallpaperBlur > 0 ? `scale(${1.02 + wallpaperBlur * 0.02})` : "scale(1.02)",
    transition: "background-image 0.7s ease-in-out, filter 0.3s ease, transform 0.3s ease",
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={style}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "var(--desktop-overlay)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--desktop-scrim)",
        }}
      />
    </div>
  );
}
