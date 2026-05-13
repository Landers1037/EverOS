"use client";
import { useDesktopStore } from "@/stores/useDesktopStore";

export function DesktopArea() {
  const { wallpaper, wallpapers } = useDesktopStore();
  const current = wallpapers.find((w) => w.id === wallpaper);

  const isGradient =
    current?.src.startsWith("linear-gradient") ||
    current?.src.startsWith("radial-gradient");

  const style: React.CSSProperties = isGradient
    ? { backgroundImage: current?.src }
    : { backgroundImage: `url(${current?.src})` };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          ...style,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "saturate(0.9) contrast(0.95)",
          transform: "scale(1.02)",
          transition: "background-image 0.7s ease-in-out",
        }}
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
