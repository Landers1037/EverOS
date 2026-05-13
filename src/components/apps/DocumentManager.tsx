"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AppInstance } from "@/types/app";
import type { DocumentFormat, DocumentItem } from "@/types/content";
import {
  CONTENT_FOLDERS,
  DOCUMENT_ITEMS,
  DOCUMENT_REPOSITORIES,
} from "@/mock/content";
import { useTranslation } from "@/hooks/useTranslation";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";
import {
  Eye,
  FileText,
  FolderPlus,
  Grid3X3,
  Info,
  List,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";

const DocViewer = dynamic(
  async () => (await import("@cyntler/react-doc-viewer")).default,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        正在加载预览组件...
      </div>
    ),
  }
);

interface DocumentManagerProps {
  instance: AppInstance;
}

interface ContextMenuState {
  x: number;
  y: number;
  item: DocumentItem;
}

const DOCUMENT_FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "docx", label: "DOCX" },
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "XLSX" },
  { value: "pptx", label: "PPTX" },
  { value: "txt", label: "TXT" },
];

const UPLOAD_ACCEPT = ".docx,.csv,.xlsx,.pptx,.pdf,.txt";

function getFormatFromFileName(name: string): DocumentFormat | null {
  const extension = name.split(".").pop()?.toLowerCase();
  if (
    extension === "docx" ||
    extension === "csv" ||
    extension === "xlsx" ||
    extension === "pptx" ||
    extension === "pdf" ||
    extension === "txt"
  ) {
    return extension;
  }
  return null;
}

function createPreviewKind(format: DocumentFormat) {
  if (format === "csv") return "table" as const;
  if (format === "txt") return "text" as const;
  return "office" as const;
}

function createFallbackContent(format: DocumentFormat, title: string) {
  if (format === "txt") {
    return `${title}\n\n这是一个新建的 TXT 文档占位内容。\n后续接入后端后可保存真实文件。`;
  }
  if (format === "csv") {
    return undefined;
  }
  return undefined;
}

export function DocumentManager({}: DocumentManagerProps) {
  const { t } = useTranslation();
  const [repositories, setRepositories] = useState(DOCUMENT_REPOSITORIES);
  const [folders, setFolders] = useState(CONTENT_FOLDERS);
  const [documents, setDocuments] = useState(DOCUMENT_ITEMS);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(
    DOCUMENT_REPOSITORIES[0]?.id ?? null
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<DocumentItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoPath, setRepoPath] = useState("/library/documents/new-repository");
  const [repoDescription, setRepoDescription] = useState("");
  const [folderName, setFolderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docFormat, setDocFormat] = useState<DocumentFormat>("docx");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const contextRef = useClickOutside<HTMLDivElement>(() => setContextMenu(null));

  const repositoryFolders = useMemo(
    () => folders.filter((folder) => folder.repositoryId === selectedRepositoryId),
    [folders, selectedRepositoryId]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((item) => {
      if (selectedRepositoryId && item.repositoryId !== selectedRepositoryId) return false;
      if (selectedFolderId && item.folderId !== selectedFolderId) return false;
      if (search) {
        const keyword = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(keyword) ||
          item.format.toLowerCase().includes(keyword) ||
          item.path.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [documents, search, selectedFolderId, selectedRepositoryId]);

  const selectedRepository = repositories.find((repo) => repo.id === selectedRepositoryId) ?? null;

  const createRepository = () => {
    if (!repoName.trim()) return;
    const newRepoId = `repo-doc-${Date.now()}`;
    const newRepo = {
      id: newRepoId,
      name: repoName.trim(),
      kind: "documents" as const,
      storagePath: repoPath.trim() || `/library/documents/${newRepoId}`,
      description: repoDescription.trim() || "新建文档存储库",
      itemCount: 0,
    };
    setRepositories((current) => [newRepo, ...current]);
    setSelectedRepositoryId(newRepoId);
    setSelectedFolderId(null);
    setRepoName("");
    setRepoPath(`/library/documents/${newRepoId}`);
    setRepoDescription("");
    setShowCreateRepo(false);
  };

  const createFolder = () => {
    if (!folderName.trim() || !selectedRepositoryId || !selectedRepository) return;
    const folderId = `folder-doc-${Date.now()}`;
    setFolders((current) => [
      {
      id: folderId,
      repositoryId: selectedRepositoryId,
      name: folderName.trim(),
      parentId: null,
      path: `${selectedRepository.storagePath}/${folderName.trim()}`,
      itemCount: 0,
      },
      ...current,
    ]);
    setSelectedFolderId(folderId);
    setFolderName("");
    setShowCreateFolder(false);
  };

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  const createDocument = () => {
    if (!docTitle.trim() || !selectedRepositoryId || !selectedRepository) return;
    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    const nextDocument: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: docTitle.trim(),
      repositoryId: selectedRepositoryId,
      folderId: selectedFolderId,
      format: docFormat,
      previewKind: createPreviewKind(docFormat),
      size: docFormat === "csv" ? "2 KB" : "0 KB",
      createdAt: now,
      updatedAt: now,
      path: `${selectedRepository.storagePath}/${docTitle.trim()}.${docFormat}`,
      textContent: createFallbackContent(docFormat, docTitle.trim()),
      tableContent:
        docFormat === "csv"
          ? [
              ["字段", "值"],
              ["标题", docTitle.trim()],
              ["状态", "新建"],
            ]
          : undefined,
      description: "由前端新建的文档占位数据。",
    };
    setDocuments((current) => [nextDocument, ...current]);
    setDocTitle("");
    setDocFormat("docx");
    setShowCreateDoc(false);
    setPreviewItem(nextDocument);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRepositoryId || !selectedRepository) return;
    const format = getFormatFromFileName(file.name);
    if (!format) return;

    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    const item: DocumentItem = {
      id: `doc-upload-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      repositoryId: selectedRepositoryId,
      folderId: selectedFolderId,
      format,
      previewKind: createPreviewKind(format),
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      createdAt: now,
      updatedAt: now,
      path: `${selectedRepository.storagePath}/${file.name}`,
      previewUri: URL.createObjectURL(file),
      textContent: format === "txt" ? "已上传本地 TXT 文档，可继续接入真实保存链路。" : undefined,
      description: "本地上传的演示文件。",
    };
    setDocuments((current) => [item, ...current]);
    setPreviewItem(item);
    event.target.value = "";
  };

  return (
    <div className="flex h-full" onClick={() => setContextMenu(null)}>
      <input
        ref={uploadInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleUpload}
      />

      <aside
        className="w-64 flex-shrink-0 overflow-y-auto border-r p-3 scrollbar-thin"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-soft)" }}
      >
        <div className="mb-4 rounded-[var(--radius-lg)] border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-tertiary)" }}>
            文档存储库
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            首次使用建议先创建存储库，也可以直接查看示例数据。
          </p>
          <button className="ui-control ui-control-active mt-3 w-full justify-center" onClick={() => setShowCreateRepo(true)}>
            <Plus size={14} />
            创建存储库
          </button>
        </div>

        <div className="space-y-1">
          {repositories.map((repo) => {
            const active = repo.id === selectedRepositoryId;
            return (
              <button
                key={repo.id}
                className={cn(
                  "ui-control w-full justify-start rounded-[var(--radius-md)] px-3 py-3",
                  active && "ui-control-active"
                )}
                style={{ minHeight: 52 }}
                onClick={() => {
                  setSelectedRepositoryId(repo.id);
                  setSelectedFolderId(null);
                }}
              >
                <FileText size={16} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{repo.name}</span>
                  <span className="block truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {repo.itemCount} 项
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="ui-divider my-4 h-px" />

        <div className="flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-tertiary)" }}>
            {t("media.folders")}
          </p>
          <button className="ui-control ui-icon-button h-8 w-8" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus size={14} />
          </button>
        </div>

        <button
          className={cn(
            "ui-control mt-2 w-full justify-start rounded-[var(--radius-md)] px-3",
            !selectedFolderId && "ui-control-active"
          )}
          onClick={() => setSelectedFolderId(null)}
        >
          <FileText size={14} />
          所有文档
        </button>

        {repositoryFolders.map((folder) => (
          <button
            key={folder.id}
            className={cn(
              "ui-control mt-1 w-full justify-start rounded-[var(--radius-md)] px-3",
              selectedFolderId === folder.id && "ui-control-active"
            )}
            onClick={() => setSelectedFolderId(folder.id)}
          >
            <FileText size={14} />
            <span className="min-w-0 flex-1 truncate text-left">{folder.name}</span>
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {folder.itemCount}
            </span>
          </button>
        ))}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--divider-strong)" }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
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

            <button className="ui-control" onClick={() => setShowCreateDoc(true)}>
              <Plus size={14} />
              新建文档
            </button>
            <button className="ui-control" onClick={() => uploadInputRef.current?.click()}>
              <Upload size={14} />
              上传文档
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                className={cn("ui-control ui-icon-button", viewMode === "grid" && "ui-control-active")}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                className={cn("ui-control ui-icon-button", viewMode === "list" && "ui-control-active")}
                onClick={() => setViewMode("list")}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-3 py-2" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {selectedRepository?.name ?? "未选择存储库"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {selectedRepository?.storagePath ?? "先创建存储库再开始管理文档"}
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              支持 `docx / csv / xlsx / pptx / pdf / txt`
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
          {filteredDocuments.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-sm text-center">
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  当前还没有文档
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  先创建存储库或上传文档后，再在这里完成预览、整理和详情查看。
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((item) => (
                <button
                  key={item.id}
                  className="ui-card text-left rounded-[var(--radius-lg)] p-4"
                  onClick={() => setPreviewItem(item)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setContextMenu({ x: event.clientX, y: event.clientY, item });
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}>
                      <FileText size={18} />
                    </div>
                    <span className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>
                      {item.format}
                    </span>
                  </div>
                  <p className="mt-4 truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {item.description ?? item.path}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    <span>{item.size}</span>
                    <span>{item.updatedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--divider-strong)", color: "var(--text-tertiary)" }}>
                  <th className="px-2 py-3 text-left font-medium">{t("common.name")}</th>
                  <th className="px-2 py-3 text-left font-medium">{t("common.format")}</th>
                  <th className="px-2 py-3 text-left font-medium">{t("common.size")}</th>
                  <th className="px-2 py-3 text-left font-medium">路径</th>
                  <th className="px-2 py-3 text-left font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-[var(--accent-muted)]"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onClick={() => setPreviewItem(item)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setContextMenu({ x: event.clientX, y: event.clientY, item });
                    }}
                  >
                    <td className="px-2 py-3" style={{ color: "var(--text-primary)" }}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{item.format}</td>
                    <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{item.size}</td>
                    <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{item.path}</td>
                    <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{item.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {previewItem && (
        <div
          className="w-[38%] min-w-[360px] border-l"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--divider-strong)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {previewItem.title}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                预览与文件详情
              </p>
            </div>
            <button className="ui-control ui-icon-button" onClick={() => setPreviewItem(null)}>
              <X size={14} />
            </button>
          </div>

          <div className="flex h-[calc(100%-73px)] flex-col">
            <div className="border-b px-4 py-3 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-2">
                <Eye size={14} />
                打开后可在线预览，右键查看文件详情
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4 scrollbar-thin">
              {previewItem.previewKind === "office" && previewItem.previewUri ? (
                <div className="h-full overflow-hidden rounded-[var(--radius-lg)] border" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
                  <DocViewer
                    documents={[{ uri: previewItem.previewUri, fileName: previewItem.title }]}
                    style={{ height: "100%" }}
                    config={{ header: { disableHeader: false, disableFileName: false } }}
                  />
                </div>
              ) : previewItem.previewKind === "table" ? (
                <div className="overflow-hidden rounded-[var(--radius-lg)] border" style={{ borderColor: "var(--border-default)" }}>
                  <table className="w-full text-sm">
                    <tbody>
                      {previewItem.tableContent?.map((row, rowIndex) => (
                        <tr key={`${previewItem.id}-${rowIndex}`} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${previewItem.id}-${rowIndex}-${cellIndex}`}
                              className="px-3 py-2"
                              style={{
                                color: rowIndex === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                                fontWeight: rowIndex === 0 ? 600 : 400,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : previewItem.previewKind === "text" ? (
                <pre
                  className="rounded-[var(--radius-lg)] border p-4 text-sm whitespace-pre-wrap"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {previewItem.textContent ?? "暂无可展示的文本内容。"}
                </pre>
              ) : (
                <div className="rounded-[var(--radius-lg)] border p-4 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                  当前文件已创建，但还没有可用于前端预览的内容。上传真实文件后即可联动在线预览。
                </div>
              )}

              <div className="mt-4 rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  文件信息
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-tertiary)" }}>格式</span>
                    <span style={{ color: "var(--text-secondary)" }}>{previewItem.format}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-tertiary)" }}>大小</span>
                    <span style={{ color: "var(--text-secondary)" }}>{previewItem.size}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-tertiary)" }}>更新时间</span>
                    <span style={{ color: "var(--text-secondary)" }}>{previewItem.updatedAt}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "var(--text-tertiary)" }}>真实路径</span>
                    <span className="break-all text-xs" style={{ color: "var(--text-secondary)" }}>
                      {previewItem.path}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-[9999] w-72 rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-md)]"
          style={{
            left: Math.min(contextMenu.x, viewportWidth - 304),
            top: Math.min(contextMenu.y, viewportHeight - 220),
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-elevated)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center gap-2">
            <Info size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              文档详情
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p style={{ color: "var(--text-secondary)" }}>{contextMenu.item.title}</p>
            <p style={{ color: "var(--text-tertiary)" }}>格式：{contextMenu.item.format}</p>
            <p style={{ color: "var(--text-tertiary)" }}>大小：{contextMenu.item.size}</p>
            <p style={{ color: "var(--text-tertiary)" }}>创建时间：{contextMenu.item.createdAt}</p>
            <p className="break-all text-xs" style={{ color: "var(--text-tertiary)" }}>
              路径：{contextMenu.item.path}
            </p>
          </div>
        </div>
      )}

      {showCreateRepo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[420px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              创建文档存储库
            </p>
            <div className="mt-4 space-y-3">
              <input className="ui-input w-full px-3 py-2 text-sm outline-none" placeholder="存储库名称" value={repoName} onChange={(event) => setRepoName(event.target.value)} />
              <input className="ui-input w-full px-3 py-2 text-sm outline-none" placeholder="存储路径" value={repoPath} onChange={(event) => setRepoPath(event.target.value)} />
              <textarea className="ui-input min-h-24 w-full px-3 py-2 text-sm outline-none" placeholder="说明" value={repoDescription} onChange={(event) => setRepoDescription(event.target.value)} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateRepo(false)}>{t("common.cancel")}</button>
              <button className="ui-control ui-control-active" onClick={createRepository}>{t("common.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateFolder && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[360px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              创建文件夹
            </p>
            <input className="ui-input mt-4 w-full px-3 py-2 text-sm outline-none" placeholder="文件夹名称" value={folderName} onChange={(event) => setFolderName(event.target.value)} />
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateFolder(false)}>{t("common.cancel")}</button>
              <button className="ui-control ui-control-active" onClick={createFolder}>{t("common.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateDoc && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[420px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              新建文档
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
              新建文档支持 `docx / csv / xlsx / pptx / txt`，不支持直接新建 PDF。
            </p>
            <div className="mt-4 space-y-3">
              <input className="ui-input w-full px-3 py-2 text-sm outline-none" placeholder="文档标题" value={docTitle} onChange={(event) => setDocTitle(event.target.value)} />
              <select className="ui-input w-full px-3 py-2 text-sm outline-none" value={docFormat} onChange={(event) => setDocFormat(event.target.value as DocumentFormat)}>
                {DOCUMENT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateDoc(false)}>{t("common.cancel")}</button>
              <button className="ui-control ui-control-active" onClick={createDocument}>{t("common.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
