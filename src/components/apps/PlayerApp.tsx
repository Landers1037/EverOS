"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { AppInstance } from "@/types/app";
import type { VideoSourceItem } from "@/types/content";
import { CONTENT_FOLDERS, PLAYER_SOURCES, VIDEO_REPOSITORIES } from "@/mock/content";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/utils/cn";
import {
  BadgeAlert,
  Captions,
  FolderOpen,
  ListVideo,
  MonitorPlay,
  Plus,
  Radio,
  Search,
  Settings2,
} from "lucide-react";

const VideoPlayer = dynamic(
  async () => (await import("react-helios")).VideoPlayer,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        正在加载播放器...
      </div>
    ),
  }
);

interface PlayerAppProps {
  instance: AppInstance;
}

/** 播放器应用。 */
export function PlayerApp({}: PlayerAppProps) {
  const { t } = useTranslation();
  const [sources, setSources] = useState(PLAYER_SOURCES);
  const [search, setSearch] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string>(PLAYER_SOURCES[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [customRtsp, setCustomRtsp] = useState("rtsp://192.168.1.88/live/office");
  const [customGateway, setCustomGateway] = useState("");

  const localFolders = useMemo(
    () => CONTENT_FOLDERS.filter((folder) => folder.repositoryId === VIDEO_REPOSITORIES[0]?.id),
    []
  );

  const filteredSources = useMemo(() => {
    return sources.filter((item) => {
      if (!search) return true;
      const keyword = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.sourceType.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword)
      );
    });
  }, [search, sources]);

  const selectedSource =
    sources.find((item) => item.id === selectedSourceId) ?? filteredSources[0] ?? null;

  const handleAddCustomRtsp = () => {
    if (!customTitle.trim() || !customRtsp.trim()) return;
    const nextSource: VideoSourceItem = {
      id: `player-custom-${Date.now()}`,
      title: customTitle.trim(),
      sourceType: "rtsp",
      sourceUrl: customRtsp.trim(),
      playbackUrl: customGateway.trim() || undefined,
      duration: "--",
      resolution: "1080p",
      size: "--",
      status: customGateway.trim() ? "已绑定播放网关" : "等待 RTSP 网关转码",
    };
    setSources((current) => [nextSource, ...current]);
    setSelectedSourceId(nextSource.id);
    setCustomTitle("");
    setCustomRtsp("rtsp://");
    setCustomGateway("");
  };

  return (
    <div className="flex h-full">
      <aside
        className="w-80 flex-shrink-0 overflow-y-auto border-r p-3 scrollbar-thin"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-soft)" }}
      >
        <div className="rounded-[var(--radius-lg)] border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              自定义 RTSP 流
            </p>
          </div>
          <div className="mt-3 space-y-2">
            <input
              className="ui-input w-full px-3 py-2 text-sm outline-none"
              placeholder="流名称"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
            />
            <input
              className="ui-input w-full px-3 py-2 text-sm outline-none"
              placeholder="RTSP 地址"
              value={customRtsp}
              onChange={(event) => setCustomRtsp(event.target.value)}
            />
            <input
              className="ui-input w-full px-3 py-2 text-sm outline-none"
              placeholder="可选：HLS/MP4 网关地址"
              value={customGateway}
              onChange={(event) => setCustomGateway(event.target.value)}
            />
          </div>
          <button className="ui-control ui-control-active mt-3 w-full justify-center" onClick={handleAddCustomRtsp}>
            <Plus size={14} />
            添加流
          </button>
          <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            浏览器无法直接解码 RTSP，生产环境需通过网关转为 HLS 或 MP4。
          </p>
        </div>

        <div className="mt-4 rounded-[var(--radius-lg)] border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              本地视频存储库
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {localFolders.map((folder) => (
              <div
                key={folder.id}
                className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{folder.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {folder.itemCount} 个文件
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {folder.path}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("common.search")}
            className="ui-input w-full py-2 pl-9 pr-3 text-sm outline-none"
          />
        </div>

        <div className="mt-3 space-y-2">
          {filteredSources.map((source) => {
            const active = source.id === selectedSource?.id;
            return (
              <button
                key={source.id}
                className={cn("ui-card w-full rounded-[var(--radius-lg)] p-3 text-left", active && "ui-control-active")}
                onClick={() => setSelectedSourceId(source.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {source.title}
                    </p>
                    <p className="mt-1 text-xs uppercase" style={{ color: "var(--text-tertiary)" }}>
                      {source.sourceType}
                    </p>
                  </div>
                  <MonitorPlay size={16} style={{ color: "var(--accent)" }} />
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {source.status}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--divider-strong)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--accent-muted)", color: "var(--text-secondary)" }}>
              倍速 / 进度调节 / 全屏 / 字幕
            </div>
            <div className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>
              HLS 与本地视频可直接播放
            </div>
            <div className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>
              RTSP 需转码网关
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-hidden p-4">
            <div
              className="h-full overflow-hidden rounded-[var(--radius-xl)] border"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
            >
              {selectedSource?.playbackUrl ? (
                <VideoPlayer
                  src={selectedSource.playbackUrl}
                  poster={selectedSource.poster}
                  controls
                  options={{
                    playbackRates: [0.5, 1, 1.25, 1.5, 2],
                    subtitles: selectedSource.subtitleUrl
                      ? [
                          {
                            kind: "subtitles",
                            src: selectedSource.subtitleUrl,
                            srclang: "zh-CN",
                            label: "中文字幕",
                            default: true,
                          },
                        ]
                      : [],
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <BadgeAlert size={32} className="mx-auto" style={{ color: "var(--state-warning)" }} />
                    <p className="mt-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                      当前流暂不可直接播放
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      RTSP 源已接入列表，但浏览器侧需要后端转码或网关代理后，才能接入现代播放器进行播放。
                    </p>
                    <p className="mt-3 rounded-[var(--radius-md)] px-3 py-2 text-xs" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-tertiary)" }}>
                      {selectedSource?.sourceUrl}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside
            className="overflow-y-auto border-l p-4 scrollbar-thin"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}
          >
            <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                当前播放源
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--text-tertiary)" }}>名称</span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedSource?.title ?? "--"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--text-tertiary)" }}>类型</span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedSource?.sourceType ?? "--"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--text-tertiary)" }}>{t("common.resolution")}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedSource?.resolution ?? "--"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--text-tertiary)" }}>{t("common.duration")}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{selectedSource?.duration ?? "--"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center gap-2">
                <Settings2 size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  高级播放能力
                </p>
              </div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-center gap-2">
                  <ListVideo size={14} />
                  支持进度拖拽、倍速切换和全屏播放
                </li>
                <li className="flex items-center gap-2">
                  <Captions size={14} />
                  支持外挂字幕与字幕轨道切换
                </li>
                <li className="flex items-center gap-2">
                  <Radio size={14} />
                  支持 HLS、本地 MP4 和自定义 RTSP 源录入
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                源地址
              </p>
              <p className="mt-3 break-all text-xs" style={{ color: "var(--text-tertiary)" }}>
                {selectedSource?.playbackUrl ?? selectedSource?.sourceUrl ?? "--"}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
