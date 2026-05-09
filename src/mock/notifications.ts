import type { Notification } from "@/types/desktop";

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "System Update Available",
    message: "EverOS 1.1.0 is ready to install",
    timestamp: "2026-05-08T10:30:00Z",
    type: "info",
    read: false,
  },
  {
    id: "notif-2",
    title: "Backup Complete",
    message: "Media library backed up successfully",
    timestamp: "2026-05-08T09:15:00Z",
    type: "success",
    read: false,
  },
  {
    id: "notif-3",
    title: "Storage Warning",
    message: "Disk usage has exceeded 85%",
    timestamp: "2026-05-07T22:00:00Z",
    type: "warning",
    read: true,
  },
  {
    id: "notif-4",
    title: "New Media Detected",
    message: "12 new files were added to the Videos folder",
    timestamp: "2026-05-07T15:45:00Z",
    type: "info",
    read: true,
  },
  {
    id: "notif-5",
    title: "Sync Error",
    message: "Failed to sync with remote storage",
    timestamp: "2026-05-06T11:20:00Z",
    type: "error",
    read: true,
  },
];