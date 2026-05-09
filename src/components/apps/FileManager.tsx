"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import { MOCK_VIDEOS } from "@/mock/videos";
import { MOCK_MUSIC } from "@/mock/music";
import { MOCK_IMAGES } from "@/mock/images";
import { MEDIA_FOLDERS } from "@/mock/folders";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Grid3X3, List, Folder, File, Clapperboard, Music, Image } from "lucide-react";

interface FileManagerProps {
  instance: AppInstance;
}

export function FileManager({ instance: _instance }: FileManagerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const allFiles = useMemo(() => {
    const items = [
      ...MOCK_VIDEOS.map((v) => ({ ...v, fileType: "video" as const })),
      ...MOCK_MUSIC.map((m) => ({ ...m, fileType: "audio" as const })),
      ...MOCK_IMAGES.map((i) => ({ ...i, fileType: "image" as const })),
    ];
    let filtered = items;
    if (search) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [search]);

  const typeIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <Clapperboard size={14} />;
      case "audio":
        return <Music size={14} />;
      case "image":
        return <Image size={14} />;
      default:
        return <File size={14} />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Folder sidebar */}
      <div
        className="w-48 flex-shrink-0 border-r overflow-y-auto scrollbar-thin p-2"
        style={{ borderColor: "var(--border-default)" }}
      >
        <button
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
            !selectedFolder ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => setSelectedFolder(null)}
        >
          <Folder size={14} />
          {t("media.allFiles")}
        </button>
        <div className="my-2 mx-2 h-px" style={{ backgroundColor: "var(--border-default)" }} />
        <p className="text-xs font-medium px-2 mb-1" style={{ color: "var(--text-tertiary)" }}>
          {t("media.folders")}
        </p>
        {MEDIA_FOLDERS.filter((f) => f.parentId === "root").map((folder) => (
          <button
            key={folder.id}
            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
              selectedFolder === folder.id ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
            }`}
            style={{ color: "var(--text-primary)" }}
            onClick={() => setSelectedFolder(folder.id)}
          >
            <Folder size={14} />
            <span className="flex-1 text-left">{folder.name}</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {folder.itemCount}
            </span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg outline-none"
              style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"}`}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {allFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "var(--text-tertiary)" }}>{t("media.noMedia")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {allFiles.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                >
                  <div className="relative aspect-video bg-[var(--bg-input)] flex items-center justify-center">
                    {"thumbnail" in item && item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      typeIcon(item.fileType)
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {item.fileType} · {item.size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-default)" }}>
                  <th className="text-left font-medium py-2 px-2">{t("common.search")}</th>
                  <th className="text-left font-medium py-2 px-2">Type</th>
                  <th className="text-left font-medium py-2 px-2">Size</th>
                  <th className="text-left font-medium py-2 px-2">Format</th>
                </tr>
              </thead>
              <tbody>
                {allFiles.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--accent-muted)] cursor-pointer" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="py-2 px-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      {typeIcon(item.fileType)}
                      {item.title}
                    </td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{item.fileType}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{item.size}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{item.format}</td>
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