/** 存储库类型。 */
export type RepositoryKind = "documents" | "notes" | "videos";

/** 文档格式。 */
export type DocumentFormat = "docx" | "csv" | "xlsx" | "pptx" | "pdf" | "txt";

/** 文档预览类型。 */
export type DocumentPreviewKind = "office" | "table" | "text";

/** 播放源类型。 */
export type VideoSourceKind = "local" | "hls" | "rtsp";

/** 回收站项目类型。 */
export type TrashItemType = "document" | "note" | "video" | "image" | "folder";

/** 存储库定义。 */
export interface ContentRepository {
  /** 存储库 ID。 */
  id: string;
  /** 存储库名称。 */
  name: string;
  /** 存储库类别。 */
  kind: RepositoryKind;
  /** 存储根路径。 */
  storagePath: string;
  /** 存储库说明。 */
  description: string;
  /** 项目数量。 */
  itemCount: number;
}

/** 存储库文件夹。 */
export interface RepositoryFolder {
  /** 文件夹 ID。 */
  id: string;
  /** 所属存储库 ID。 */
  repositoryId: string;
  /** 文件夹名称。 */
  name: string;
  /** 父级文件夹 ID。 */
  parentId: string | null;
  /** 完整路径。 */
  path: string;
  /** 项目数量。 */
  itemCount: number;
}

/** 文档文件定义。 */
export interface DocumentItem {
  /** 文档 ID。 */
  id: string;
  /** 文档标题。 */
  title: string;
  /** 所属存储库 ID。 */
  repositoryId: string;
  /** 所属文件夹 ID。 */
  folderId: string | null;
  /** 文档格式。 */
  format: DocumentFormat;
  /** 预览类型。 */
  previewKind: DocumentPreviewKind;
  /** 文件大小。 */
  size: string;
  /** 最后更新时间。 */
  updatedAt: string;
  /** 创建时间。 */
  createdAt: string;
  /** 实际存储路径。 */
  path: string;
  /** 预览地址。 */
  previewUri?: string;
  /** 文本内容。 */
  textContent?: string;
  /** 表格内容。 */
  tableContent?: string[][];
  /** 摘要信息。 */
  description?: string;
}

/** Markdown 笔记定义。 */
export interface NoteItem {
  /** 笔记 ID。 */
  id: string;
  /** 笔记标题。 */
  title: string;
  /** 所属存储库 ID。 */
  repositoryId: string;
  /** 所属文件夹 ID。 */
  folderId: string | null;
  /** 文件路径。 */
  path: string;
  /** Markdown 内容。 */
  markdown: string;
  /** 摘要内容。 */
  excerpt: string;
  /** 标签集合。 */
  tags: string[];
  /** 字数。 */
  wordCount: number;
  /** 更新时间。 */
  updatedAt: string;
}

/** 视频播放源定义。 */
export interface VideoSourceItem {
  /** 播放源 ID。 */
  id: string;
  /** 播放源名称。 */
  title: string;
  /** 播放源类型。 */
  sourceType: VideoSourceKind;
  /** 所属存储库 ID。 */
  repositoryId?: string;
  /** 所属文件夹 ID。 */
  folderId?: string | null;
  /** 原始地址。 */
  sourceUrl: string;
  /** 实际播放地址。 */
  playbackUrl?: string;
  /** 封面地址。 */
  poster?: string;
  /** 字幕地址。 */
  subtitleUrl?: string;
  /** 时长。 */
  duration: string;
  /** 清晰度。 */
  resolution: string;
  /** 文件大小。 */
  size: string;
  /** 状态说明。 */
  status: string;
}

/** 回收站记录。 */
export interface TrashRecord {
  /** 记录 ID。 */
  id: string;
  /** 原始名称。 */
  name: string;
  /** 项目类型。 */
  itemType: TrashItemType;
  /** 存储库名称。 */
  repositoryName: string;
  /** 真实存储路径。 */
  realPath: string;
  /** 删除时间。 */
  deletedAt: string;
  /** 文件大小。 */
  size: string;
}
