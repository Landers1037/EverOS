import { VideoManager } from "./VideoManager";
import { MusicManager } from "./MusicManager";
import { ImageManager } from "./ImageManager";
import { DocumentManager } from "./DocumentManager";
import { NotesManager } from "./NotesManager";
import { PlayerApp } from "./PlayerApp";
import { TrashManager } from "./TrashManager";
import { Settings } from "./Settings";
import { FileManager } from "./FileManager";
import type { AppInstance } from "@/types/app";

export const FallbackApp: React.ComponentType<{ instance: AppInstance }> = () => (
  <div className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>
    App not found
  </div>
);

export const APP_COMPONENTS: Record<
  string,
  React.ComponentType<{ instance: AppInstance }>
> = {
  "video-manager": VideoManager,
  "music-manager": MusicManager,
  "image-manager": ImageManager,
  "document-manager": DocumentManager,
  "notes-manager": NotesManager,
  "player-app": PlayerApp,
  "trash-manager": TrashManager,
  settings: Settings,
  "file-manager": FileManager,
};

export function getAppComponent(
  appId: string
): React.ComponentType<{ instance: AppInstance }> {
  return APP_COMPONENTS[appId] || FallbackApp;
}
