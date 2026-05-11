export type Theme = "light" | "dark" | "system";
export type DockStyle = "standard" | "mini";
export type Locale = "en" | "zh";
export type SidebarState = "expanded" | "collapsed" | "hidden";

export interface Wallpaper {
  id: string;
  name: string;
  src: string;
  thumbnail: string;
  category: "solid" | "gradient" | "image" | "live";
}

export interface SystemStatus {
  battery: number;
  network: "wifi" | "ethernet" | "offline";
  notifications: number;
  username: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
}