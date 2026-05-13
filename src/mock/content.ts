import type {
  ContentRepository,
  DocumentItem,
  NoteItem,
  RepositoryFolder,
  TrashRecord,
  VideoSourceItem,
} from "@/types/content";

export const DOCUMENT_REPOSITORIES: ContentRepository[] = [
  {
    id: "repo-doc-team",
    name: "团队文档库",
    kind: "documents",
    storagePath: "/library/documents/team",
    description: "用于保存产品方案、报表和演示文稿。",
    itemCount: 6,
  },
  {
    id: "repo-doc-archive",
    name: "归档文档库",
    kind: "documents",
    storagePath: "/library/documents/archive",
    description: "用于保存历史版本和外部交付资料。",
    itemCount: 3,
  },
];

export const NOTE_REPOSITORIES: ContentRepository[] = [
  {
    id: "repo-note-workspace",
    name: "工作笔记库",
    kind: "notes",
    storagePath: "/library/notes/workspace",
    description: "沉淀会议纪要、开发手册和阶段计划。",
    itemCount: 4,
  },
  {
    id: "repo-note-personal",
    name: "个人灵感库",
    kind: "notes",
    storagePath: "/library/notes/personal",
    description: "记录想法草稿、临时摘录和学习笔记。",
    itemCount: 2,
  },
];

export const VIDEO_REPOSITORIES: ContentRepository[] = [
  {
    id: "repo-video-local",
    name: "本地视频库",
    kind: "videos",
    storagePath: "/library/videos/local",
    description: "系统扫描出的本地视频素材和录制内容。",
    itemCount: 4,
  },
];

export const CONTENT_FOLDERS: RepositoryFolder[] = [
  {
    id: "folder-doc-product",
    repositoryId: "repo-doc-team",
    name: "产品方案",
    parentId: null,
    path: "/library/documents/team/product",
    itemCount: 2,
  },
  {
    id: "folder-doc-ops",
    repositoryId: "repo-doc-team",
    name: "运营报表",
    parentId: null,
    path: "/library/documents/team/ops",
    itemCount: 3,
  },
  {
    id: "folder-doc-pitch",
    repositoryId: "repo-doc-archive",
    name: "对外资料",
    parentId: null,
    path: "/library/documents/archive/pitch",
    itemCount: 2,
  },
  {
    id: "folder-note-meeting",
    repositoryId: "repo-note-workspace",
    name: "会议纪要",
    parentId: null,
    path: "/library/notes/workspace/meetings",
    itemCount: 2,
  },
  {
    id: "folder-note-spec",
    repositoryId: "repo-note-workspace",
    name: "规范草稿",
    parentId: null,
    path: "/library/notes/workspace/specs",
    itemCount: 2,
  },
  {
    id: "folder-note-ideas",
    repositoryId: "repo-note-personal",
    name: "灵感池",
    parentId: null,
    path: "/library/notes/personal/ideas",
    itemCount: 2,
  },
  {
    id: "folder-video-local",
    repositoryId: "repo-video-local",
    name: "本地素材",
    parentId: null,
    path: "/library/videos/local/assets",
    itemCount: 4,
  },
];

export const DOCUMENT_ITEMS: DocumentItem[] = [
  {
    id: "doc-001",
    title: "EverOS 路线图",
    repositoryId: "repo-doc-team",
    folderId: "folder-doc-product",
    format: "docx",
    previewKind: "office",
    size: "1.4 MB",
    createdAt: "2026-05-05 10:20",
    updatedAt: "2026-05-12 09:30",
    path: "/library/documents/team/product/everos-roadmap.docx",
    previewUri: "https://file-examples.com/wp-content/storage/2017/02/file-sample_100kB.docx",
    description: "产品路线图与版本规划说明。",
  },
  {
    id: "doc-002",
    title: "增长周报",
    repositoryId: "repo-doc-team",
    folderId: "folder-doc-ops",
    format: "xlsx",
    previewKind: "office",
    size: "824 KB",
    createdAt: "2026-05-07 12:10",
    updatedAt: "2026-05-12 18:15",
    path: "/library/documents/team/ops/growth-weekly.xlsx",
    previewUri: "https://file-examples.com/wp-content/storage/2017/02/file_example_XLSX_100.xlsx",
    description: "渠道新增、留存与转化统计。",
  },
  {
    id: "doc-003",
    title: "媒体采购清单",
    repositoryId: "repo-doc-team",
    folderId: "folder-doc-ops",
    format: "csv",
    previewKind: "table",
    size: "12 KB",
    createdAt: "2026-05-02 14:35",
    updatedAt: "2026-05-10 11:22",
    path: "/library/documents/team/ops/media-buy.csv",
    tableContent: [
      ["渠道", "预算", "负责人"],
      ["搜索广告", "32000", "Ava"],
      ["信息流", "28000", "Lucas"],
      ["品牌投放", "18000", "Mia"],
    ],
    description: "投放预算与负责人清单。",
  },
  {
    id: "doc-004",
    title: "产品宣讲材料",
    repositoryId: "repo-doc-archive",
    folderId: "folder-doc-pitch",
    format: "pptx",
    previewKind: "office",
    size: "6.3 MB",
    createdAt: "2026-04-18 09:12",
    updatedAt: "2026-05-03 20:40",
    path: "/library/documents/archive/pitch/product-deck.pptx",
    previewUri: "https://file-examples.com/wp-content/storage/2017/08/file_example_PPT_500kB.ppt",
    description: "对外演示版本，含商业模式介绍。",
  },
  {
    id: "doc-005",
    title: "接口对接说明",
    repositoryId: "repo-doc-archive",
    folderId: "folder-doc-pitch",
    format: "pdf",
    previewKind: "office",
    size: "2.1 MB",
    createdAt: "2026-04-26 16:55",
    updatedAt: "2026-05-08 08:05",
    path: "/library/documents/archive/pitch/api-integration.pdf",
    previewUri: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "第三方系统集成规范 PDF。",
  },
  {
    id: "doc-006",
    title: "待办交接清单",
    repositoryId: "repo-doc-team",
    folderId: "folder-doc-product",
    format: "txt",
    previewKind: "text",
    size: "3 KB",
    createdAt: "2026-05-01 08:10",
    updatedAt: "2026-05-11 13:10",
    path: "/library/documents/team/product/todo-handover.txt",
    textContent:
      "1. 补齐文档库权限校验\n2. 接入实际上传接口\n3. 完成回收站恢复链路\n4. 联调视频字幕服务",
    description: "当前阶段的交接事项与注意点。",
  },
];

export const NOTE_ITEMS: NoteItem[] = [
  {
    id: "note-001",
    title: "桌面系统交互草案",
    repositoryId: "repo-note-workspace",
    folderId: "folder-note-spec",
    path: "/library/notes/workspace/specs/desktop-interaction.md",
    excerpt: "整理窗口、Dock、通知中心和侧栏的交互优先级。",
    tags: ["交互", "桌面", "规范"],
    wordCount: 428,
    updatedAt: "2026-05-12 15:25",
    markdown: `# 桌面系统交互草案

## 目标

- 保持多窗口操作连贯
- 避免高饱和视觉干扰
- 在 220ms 内完成主要反馈

## 当前待完善

1. Dock 最小化联动
2. 侧栏逻辑分组
3. 文件右键菜单

> 需要同步考虑亮色与暗色主题。`,
  },
  {
    id: "note-002",
    title: "05-12 评审纪要",
    repositoryId: "repo-note-workspace",
    folderId: "folder-note-meeting",
    path: "/library/notes/workspace/meetings/2026-05-12-review.md",
    excerpt: "确认文档、笔记、播放器、回收站四类新入口。",
    tags: ["会议", "需求"],
    wordCount: 356,
    updatedAt: "2026-05-12 19:40",
    markdown: `# 05-12 评审纪要

## 结论

- 左侧边栏新增四个菜单
- 文档与笔记都采用存储库模式
- 回收站支持批量恢复和彻底删除

## 风险

- RTSP 需要后端转码或网关接入
- Office 预览依赖公开可访问文件源`,
  },
  {
    id: "note-003",
    title: "灵感速记",
    repositoryId: "repo-note-personal",
    folderId: "folder-note-ideas",
    path: "/library/notes/personal/ideas/quick-ideas.md",
    excerpt: "把文件库和 AI 摘要面板组合成工作台。",
    tags: ["灵感", "AI"],
    wordCount: 123,
    updatedAt: "2026-05-11 22:18",
    markdown: `# 灵感速记

- 文档预览旁边放摘要卡
- 笔记支持一键导出 Markdown
- 为播放器增加字幕切换和剧场模式`,
  },
];

export const PLAYER_SOURCES: VideoSourceItem[] = [
  {
    id: "player-001",
    title: "产品发布会回放",
    sourceType: "local",
    repositoryId: "repo-video-local",
    folderId: "folder-video-local",
    sourceUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    playbackUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    subtitleUrl: "https://raw.githubusercontent.com/andreyvit/subtitle-tools/master/sample.srt",
    poster: "https://picsum.photos/seed/everos-player-1/1200/700",
    duration: "09:56",
    resolution: "1080p",
    size: "72 MB",
    status: "可直接播放",
  },
  {
    id: "player-002",
    title: "样例 HLS 直播流",
    sourceType: "hls",
    sourceUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    poster: "https://picsum.photos/seed/everos-player-2/1200/700",
    duration: "LIVE",
    resolution: "自适应",
    size: "--",
    status: "直播中",
  },
  {
    id: "player-003",
    title: "园区监控 RTSP",
    sourceType: "rtsp",
    sourceUrl: "rtsp://192.168.1.18/live/camera-01",
    poster: "https://picsum.photos/seed/everos-player-3/1200/700",
    duration: "--",
    resolution: "1080p",
    size: "--",
    status: "需要网关转为 HLS/MP4",
  },
  {
    id: "player-004",
    title: "访谈素材",
    sourceType: "local",
    repositoryId: "repo-video-local",
    folderId: "folder-video-local",
    sourceUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    playbackUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: "https://picsum.photos/seed/everos-player-4/1200/700",
    duration: "00:30",
    resolution: "4K",
    size: "18 MB",
    status: "可直接播放",
  },
];

export const TRASH_RECORDS: TrashRecord[] = [
  {
    id: "trash-001",
    name: "旧版需求说明.docx",
    itemType: "document",
    repositoryName: "团队文档库",
    realPath: "/library/documents/team/product/old-requirement.docx",
    deletedAt: "2026-05-12 20:16",
    size: "486 KB",
  },
  {
    id: "trash-002",
    name: "阶段复盘.md",
    itemType: "note",
    repositoryName: "工作笔记库",
    realPath: "/library/notes/workspace/meetings/retrospective.md",
    deletedAt: "2026-05-12 18:44",
    size: "18 KB",
  },
  {
    id: "trash-003",
    name: "现场录屏.mp4",
    itemType: "video",
    repositoryName: "本地视频库",
    realPath: "/library/videos/local/assets/onsite-recording.mp4",
    deletedAt: "2026-05-11 09:08",
    size: "1.6 GB",
  },
  {
    id: "trash-004",
    name: "旧截图素材",
    itemType: "image",
    repositoryName: "图片库",
    realPath: "/library/images/screenshots/legacy",
    deletedAt: "2026-05-10 13:22",
    size: "96 MB",
  },
];
