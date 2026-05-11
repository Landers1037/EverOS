"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import type { ViewMode } from "@/types/media";
import { MOCK_VIDEOS } from "@/mock/videos";
import { MEDIA_FOLDERS } from "@/mock/folders";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Grid3X3, List, Folder, Heart, FolderOpen } from "lucide-react";

interface VideoManagerProps {
  instance: AppInstance;
}

export function VideoManager({ instance: _instance }: VideoManagerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const folders = MEDIA_FOLDERS.filter((f) => f.id.startsWith("vid") || f.id === "root");

  const filtered = useMemo(() => {
    let items = MOCK_VIDEOS;
    if (search) {
      items = items.filter((v) =>
        v.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showFavorites) {
      items = items.filter((v) => v.favorite);
    }
    if (selectedFolder) {
      const folderNames: Record<string, string> = {
        videos: "Videos",
        "vid-tutorials": "Videos/Tutorials",
        "vid-family": "Videos/Family",
        "vid-recordings": "Videos/Recordings",
      };
      const folderPath = folderNames[selectedFolder];
      if (folderPath) {
        items = items.filter((v) => v.folder === folderPath);
      }
    }
    return items;
  }, [search, selectedFolder, showFavorites]);

  return (
    <div className="flex h-full">
      {/* Folder sidebar */}
      <div
        className="w-48 flex-shrink-0 border-r overflow-y-auto scrollbar-thin p-2"
        style={{ borderColor: "var(--border-default)" }}
      >
        <button
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
            !selectedFolder && !showFavorites ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => { setSelectedFolder(null); setShowFavorites(false); }}
        >
          <FolderOpen size={14} />
          {t("media.allFiles")}
        </button>
        <button
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
            showFavorites ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => { setShowFavorites(true); setSelectedFolder(null); }}
        >
          <Heart size={14} />
          {t("media.favorites")}
        </button>
        <div
          className="my-2 mx-2 h-px"
          style={{ backgroundColor: "var(--border-default)" }}
        />
        {folders
          .filter((f) => f.parentId === "root" || f.parentId === "videos")
          .map((folder) => (
            <button
              key={folder.id}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
                selectedFolder === folder.id
                  ? "bg-[var(--accent-muted)]"
                  : "hover:bg-[var(--accent-muted)]"
              }`}
              style={{
                color: "var(--text-primary)",
                paddingLeft: folder.parentId === "videos" ? "24px" : "8px",
              }}
              onClick={() => { setSelectedFolder(folder.id); setShowFavorites(false); }}
            >
              <Folder size={14} />
              {folder.name}
            </button>
          ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center gap-2 p-2 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              className={`p-1.5 rounded-md ${
                viewMode === "grid" ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
              }`}
              onClick={() => setViewMode("grid")}
              title={t("media.gridView")}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={`p-1.5 rounded-md ${
                viewMode === "list" ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
              }`}
              onClick={() => setViewMode("list")}
              title={t("media.listView")}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "var(--text-tertiary)" }}>{t("media.noMedia")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                >
                  <div className="relative aspect-video bg-[var(--bg-input)]">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs rounded bg-black/70 text-white">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {video.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {video.resolution} · {video.size}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {video.folder.split("/").pop()}
                      </span>
                      {video.favorite && <Heart size={12} fill="var(--accent)" style={{ color: "var(--accent)" }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-default)" }}>
                  <th className="text-left font-medium py-2 px-2">{t("common.name")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.duration")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.resolution")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.size")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((video) => (
                  <tr key={video.id} className="hover:bg-[var(--accent-muted)] cursor-pointer" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="py-2 px-2" style={{ color: "var(--text-primary)" }}>{video.title}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{video.duration}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{video.resolution}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{video.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}