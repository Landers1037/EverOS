export interface MediaBase {
  id: string;
  title: string;
  thumbnail: string;
  size: string;
  format: string;
  createdAt: string;
  folder: string;
  favorite: boolean;
}

export interface VideoItem extends MediaBase {
  type: "video";
  duration: string;
  resolution: string;
  codec: string;
}

export interface MusicItem extends MediaBase {
  type: "audio";
  artist: string;
  album: string;
  duration: string;
  coverArt?: string;
  trackNumber?: number;
}

export interface ImageItem extends MediaBase {
  type: "image";
  resolution: string;
  camera?: string;
  location?: string;
  width: number;
  height: number;
}

export type MediaItem = VideoItem | MusicItem | ImageItem;

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  itemCount: number;
  icon?: string;
}

export type ViewMode = "grid" | "list";