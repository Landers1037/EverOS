export type AppComponentType =
  | "video-manager"
  | "music-manager"
  | "image-manager"
  | "settings"
  | "file-manager";

export type WindowState = "open" | "minimized" | "maximized" | "closing";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface AppDefinition {
  id: string;
  nameKey: string;
  icon: string;
  component: AppComponentType;
  category: "media" | "system" | "utility";
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
}

export interface AppInstance {
  id: string;
  appId: string;
  title: string;
  state: WindowState;
  position: WindowPosition;
  size: WindowSize;
  prevState?: WindowState;
  zIndex: number;
  isFocused: boolean;
}

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";