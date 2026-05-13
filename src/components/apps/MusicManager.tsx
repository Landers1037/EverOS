"use client";
import { useState, useMemo } from "react";
import type { AppInstance } from "@/types/app";
import type { ViewMode, MusicItem } from "@/types/media";
import { MOCK_MUSIC } from "@/mock/music";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, List, Heart, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface MusicManagerProps {
  instance: AppInstance;
}

export function MusicManager({}: MusicManagerProps) {
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
        <button
          className={`ui-control h-10 rounded-[var(--radius-md)] px-3 text-sm ${
            showFavorites ? "ui-control-active" : ""
          }`}
          style={{ color: "var(--text-primary)" }}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Heart size={14} />
          {t("media.favorites")}
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={`ui-control ui-icon-button rounded-[var(--radius-md)] ${viewMode === "list" ? "ui-control-active" : ""}`}
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
                className={`mx-2 my-1 flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 cursor-pointer ${
                  nowPlaying?.id === track.id ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--bg-soft)]"
                }`}
                style={{ border: "1px solid transparent" }}
                onDoubleClick={() => handlePlay(track)}
              >
                <button
                  onClick={() => handlePlay(track)}
                  className="ui-control h-8 w-8 rounded-full p-0"
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
          className="ui-surface mx-3 mb-3 mt-2 flex items-center gap-3 rounded-[var(--radius-xl)] px-4 py-3"
          style={{ boxShadow: "var(--shadow-xs)" }}
        >
          <img
            src={nowPlaying.coverArt || nowPlaying.thumbnail}
            alt={nowPlaying.album}
            className="h-12 w-12 rounded-[var(--radius-md)] object-cover"
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
            <button className="ui-control h-9 w-9 rounded-full p-0">
              <SkipBack size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full p-2"
              style={{
                backgroundColor: "var(--fill-solid)",
                color: "var(--fill-solid-contrast)",
              }}
            >
              {isPlaying ? (
                <Pause size={16} fill="var(--fill-solid-contrast)" color="var(--fill-solid-contrast)" />
              ) : (
                <Play size={16} fill="var(--fill-solid-contrast)" color="var(--fill-solid-contrast)" />
              )}
            </button>
            <button className="ui-control h-9 w-9 rounded-full p-0">
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
