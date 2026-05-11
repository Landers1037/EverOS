"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import type { ViewMode, ImageItem } from "@/types/media";
import { MOCK_IMAGES } from "@/mock/images";
import { MEDIA_FOLDERS } from "@/mock/folders";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Grid3X3, List, Folder, Heart, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageManagerProps {
  instance: AppInstance;
}

export function ImageManager({ instance: _instance }: ImageManagerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [lightbox, setLightbox] = useState<ImageItem | null>(null);
  const [zoom, setZoom] = useState(1);

  const folders = MEDIA_FOLDERS.filter(
    (f) => f.id.startsWith("img") || f.id === "root"
  );

  const filtered = useMemo(() => {
    let items = MOCK_IMAGES;
    if (search) {
      items = items.filter((img) =>
        img.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showFavorites) {
      items = items.filter((img) => img.favorite);
    }
    if (selectedFolder) {
      const folderNames: Record<string, string> = {
        images: "Photos",
        "img-vacation": "Photos/Vacation",
        "img-beach": "Photos/Vacation/Beach",
        "img-screenshots": "Screenshots",
        "img-wallpapers": "Photos/Wallpapers",
      };
      const folderPath = folderNames[selectedFolder];
      if (folderPath) {
        items = items.filter((img) => img.folder === folderPath);
      }
    }
    return items;
  }, [search, selectedFolder, showFavorites]);

  const currentIndex = lightbox ? filtered.findIndex((img) => img.id === lightbox.id) : -1;

  const navigateLightbox = (direction: "prev" | "next") => {
    if (!lightbox || filtered.length === 0) return;
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + filtered.length) % filtered.length
        : (currentIndex + 1) % filtered.length;
    setLightbox(filtered[newIndex]);
    setZoom(1);
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
            !selectedFolder && !showFavorites
              ? "bg-[var(--accent-muted)]"
              : "hover:bg-[var(--accent-muted)]"
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => { setSelectedFolder(null); setShowFavorites(false); }}
        >
          <Folder size={14} />
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
        <div className="my-2 mx-2 h-px" style={{ backgroundColor: "var(--border-default)" }} />
        {folders
          .filter((f) => f.parentId === "root" || f.parentId === "images" || f.parentId === "img-vacation")
          .map((folder) => (
            <button
              key={folder.id}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm mb-0.5 ${
                selectedFolder === folder.id ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
              }`}
              style={{
                color: "var(--text-primary)",
                paddingLeft: folder.parentId === "images" ? "24px" : folder.parentId === "img-vacation" ? "36px" : "8px",
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
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "var(--text-tertiary)" }}>{t("media.noMedia")}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer group"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                  onClick={() => { setLightbox(img); setZoom(1); }}
                >
                  <div
                    className="relative bg-[var(--bg-input)]"
                    style={{ aspectRatio: `${img.width}/${img.height}` }}
                  >
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {img.title}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {img.resolution}
                      </span>
                      {img.favorite && <Heart size={10} fill="var(--accent)" style={{ color: "var(--accent)" }} />}
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
                  <th className="text-left font-medium py-2 px-2">{t("common.resolution")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.size")}</th>
                  <th className="text-left font-medium py-2 px-2">{t("common.format")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((img) => (
                  <tr
                    key={img.id}
                    className="hover:bg-[var(--accent-muted)] cursor-pointer"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onClick={() => { setLightbox(img); setZoom(1); }}
                  >
                    <td className="py-2 px-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <img src={img.thumbnail} alt={img.title} className="w-8 h-8 rounded object-cover" />
                      {img.title}
                    </td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{img.resolution}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{img.size}</td>
                    <td className="py-2 px-2" style={{ color: "var(--text-secondary)" }}>{img.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-white z-10"
            onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-white z-10"
            onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
          >
            <ChevronRight size={32} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
            <button
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); setZoom(Math.max(0.5, zoom - 0.5)); }}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
            <button
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); setZoom(Math.min(3, zoom + 0.5)); }}
            >
              <ZoomIn size={20} />
            </button>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white text-center z-10">
            <p className="text-sm font-medium">{lightbox.title}</p>
            <p className="text-xs opacity-70">
              {lightbox.resolution} · {lightbox.size}
              {lightbox.camera ? ` · ${lightbox.camera}` : ""}
              {lightbox.location ? ` · ${lightbox.location}` : ""}
            </p>
          </div>

          <img
            src={lightbox.thumbnail.replace("/400/300", "/800/600")}
            alt={lightbox.title}
            className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}