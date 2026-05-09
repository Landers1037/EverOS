import { VideoManager } from "./VideoManager";
import { MusicManager } from "./MusicManager";
import { ImageManager } from "./ImageManager";
import { Settings } from "./Settings";
import { FileManager } from "./FileManager";
import type { AppInstance } from "@/types/app";

export const APP_COMPONENTS: Record<
  string,
  React.ComponentType<{ instance: AppInstance }>
> = {
  "video-manager": VideoManager,
  "music-manager": MusicManager,
  "image-manager": ImageManager,
  settings: Settings,
  "file-manager": FileManager,
};

export function getAppComponent(
  appId: string
): React.ComponentType<{ instance: AppInstance }> {
  return (
    APP_COMPONENTS[appId] || (() => <div className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>App not found</div>)
  );
}