"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import type { ViewMode, MusicItem } from "@/types/media";
import { MOCK_MUSIC } from "@/mock/music";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Grid3X3, List, Heart, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface MusicManagerProps {
  instance: AppInstance;
}

export function MusicManager({ instance: _instance }: MusicManagerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFavorites, setShowFavorites] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<MusicItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filtered = useMemo(() => {
    let items = MOCK_MUSIC;
    if (search) {
      items = items.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.artist.toLowerCase().includes(search.toLowerCase()) ||
          m.album.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showFavorites) {
      items = items.filter((m) => m.favorite);
    }
    return items;
  }, [search, showFavorites]);

  const handlePlay = (track: MusicItem) => {
    if (nowPlaying?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setNowPlaying(track);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
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
        <button
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm ${
            showFavorites ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Heart size={14} />
          {t("media.favorites")}
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--accent-muted)]"}`}
            onClick={() => setViewMode("list")}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "var(--text-tertiary)" }}>{t("media.noMedia")}</p>
          </div>
        ) : (
          <div>
            {filtered.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--accent-muted)] transition-colors ${
                  nowPlaying?.id === track.id ? "bg-[var(--accent-muted)]" : ""
                }`}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                onDoubleClick={() => handlePlay(track)}
              >
                <button
                  onClick={() => handlePlay(track)}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--bg-input)]"
                >
                  {nowPlaying?.id === track.id && isPlaying ? (
                    <Pause size={14} fill="var(--accent)" style={{ color: "var(--accent)" }} />
                  ) : (
                    <Play size={14} style={{ color: "var(--text-secondary)" }} />
                  )}
                </button>
                <img
                  src={track.coverArt || track.thumbnail}
                  alt={track.album}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: nowPlaying?.id === track.id ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                    {track.artist} · {track.album}
                  </p>
                </div>
                {track.favorite && (
                  <Heart size={12} fill="var(--accent)" style={{ color: "var(--accent)" }} />
                )}
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {track.duration}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      {nowPlaying && (
        <div
          className="flex items-center gap-3 px-3 py-2 border-t"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
        >
          <img
            src={nowPlaying.coverArt || nowPlaying.thumbnail}
            alt={nowPlaying.album}
            className="w-12 h-12 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {nowPlaying.title}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
              {nowPlaying.artist}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full hover:bg-[var(--accent-muted)]">
              <SkipBack size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-[var(--fill-solid)] hover:bg-[var(--fill-solid-hover)]"
            >
              {isPlaying ? (
                <Pause size={16} fill="var(--fill-solid-contrast)" color="var(--fill-solid-contrast)" />
              ) : (
                <Play size={16} fill="var(--fill-solid-contrast)" color="var(--fill-solid-contrast)" />
              )}
            </button>
            <button className="p-1.5 rounded-full hover:bg-[var(--accent-muted)]">
              <SkipForward size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Volume2 size={14} style={{ color: "var(--text-tertiary)" }} />
            <div
              className="w-20 h-1 rounded-full"
              style={{ backgroundColor: "var(--bg-input)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "60%", backgroundColor: "var(--accent)" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}