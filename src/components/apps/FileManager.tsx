"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import { MOCK_VIDEOS } from "@/mock/videos";
import { MOCK_MUSIC } from "@/mock/music";
import { MOCK_IMAGES } from "@/mock/images";
import { MEDIA_FOLDERS } from "@/mock/folders";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Grid3X3, List, Folder, File, Clapperboard, Music, ImageIcon } from "lucide-react";

interface FileManagerProps {
  instance: AppInstance;
}

export function FileManager({}: FileManagerProps) {
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
        return <ImageIcon size={14} />;
      default:
        return <File size={14} />;
    }
  };

  return (
    <div className="flex h-full">
      <div
        className="w-52 flex-shrink-0 overflow-y-auto scrollbar-thin p-3"
        style={{
          borderRight: "1px solid var(--divider-strong)",
          backgroundColor: "var(--bg-soft)",
        }}
      >
        <button
          className={`ui-control mb-1 flex h-10 w-full justify-start gap-2 rounded-[var(--radius-md)] px-3 text-sm ${
            !selectedFolder ? "ui-control-active" : ""
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => setSelectedFolder(null)}
        >
          <Folder size={14} />
          {t("media.allFiles")}
        </button>
        <div className="ui-divider my-3 mx-2 h-px" />
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-tertiary)" }}>
          {t("media.folders")}
        </p>
        {MEDIA_FOLDERS.filter((f) => f.parentId === "root").map((folder) => (
          <button
            key={folder.id}
            className={`ui-control mb-1 flex h-10 w-full justify-start gap-2 rounded-[var(--radius-md)] px-3 text-sm ${
              selectedFolder === folder.id ? "ui-control-active" : ""
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

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--divider-strong)" }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="ui-input w-full py-2 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              className={`ui-control ui-icon-button rounded-[var(--radius-md)] ${viewMode === "grid" ? "ui-control-active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={`ui-control ui-icon-button rounded-[var(--radius-md)] ${viewMode === "list" ? "ui-control-active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {allFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "var(--text-tertiary)" }}>{t("media.noMedia")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {allFiles.map((item) => (
                <div
                  key={item.id}
                  className="ui-card cursor-pointer overflow-hidden rounded-[var(--radius-lg)]"
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
                <tr style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--divider-strong)" }}>
                  <th className="text-left font-medium py-2 px-2">{t("common.name")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.type")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.size")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.format")}</th>
                </tr>
              </thead>
              <tbody>
                {allFiles.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer rounded-[var(--radius-md)] hover:bg-[var(--accent-muted)]"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
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
