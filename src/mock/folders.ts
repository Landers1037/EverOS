import type { MediaFolder } from "@/types/media";

export const MEDIA_FOLDERS: MediaFolder[] = [
  { id: "root", name: "Media", parentId: null, itemCount: 0 },
  { id: "videos", name: "Videos", parentId: "root", itemCount: 12 },
  { id: "vid-tutorials", name: "Tutorials", parentId: "videos", itemCount: 4 },
  { id: "vid-family", name: "Family", parentId: "videos", itemCount: 3 },
  { id: "vid-recordings", name: "Recordings", parentId: "videos", itemCount: 3 },
  { id: "music", name: "Music", parentId: "root", itemCount: 15 },
  { id: "mus-playlist1", name: "Playlist 1", parentId: "music", itemCount: 4 },
  { id: "mus-playlist2", name: "Playlist 2", parentId: "music", itemCount: 3 },
  { id: "mus-classical", name: "Classical", parentId: "music", itemCount: 3 },
  { id: "images", name: "Images", parentId: "root", itemCount: 16 },
  { id: "img-vacation", name: "Vacation", parentId: "images", itemCount: 5 },
  { id: "img-beach", name: "Beach", parentId: "img-vacation", itemCount: 2 },
  { id: "img-screenshots", name: "Screenshots", parentId: "images", itemCount: 3 },
  { id: "img-wallpapers", name: "Wallpapers", parentId: "images", itemCount: 1 },
];