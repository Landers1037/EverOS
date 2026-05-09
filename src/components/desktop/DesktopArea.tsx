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
    <div
      className="fixed inset-0 z-0"
      style={{
        ...style,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.7s ease-in-out",
      }}
    />
  );
}