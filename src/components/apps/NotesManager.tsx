"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MarkdownIt from "markdown-it";
import { saveAs } from "file-saver";
import type { AppInstance } from "@/types/app";
import type { NoteItem } from "@/types/content";
import {
  CONTENT_FOLDERS,
  NOTE_ITEMS,
  NOTE_REPOSITORIES,
} from "@/mock/content";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/utils/cn";
import {
  Download,
  Eye,
  FolderPlus,
  ImagePlus,
  NotebookPen,
  PanelLeftOpen,
  Plus,
  Search,
} from "lucide-react";

const MarkdownEditor = dynamic(
  async () => (await import("react-markdown-editor-lite")).default,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        正在加载 Markdown 编辑器...
      </div>
    ),
  }
);

const markdownParser = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

interface NotesManagerProps {
  instance: AppInstance;
}

/** 笔记应用。 */
export function NotesManager({}: NotesManagerProps) {
  const { t } = useTranslation();
  const [repositories, setRepositories] = useState(NOTE_REPOSITORIES);
  const [folders, setFolders] = useState(CONTENT_FOLDERS);
  const [notes, setNotes] = useState(NOTE_ITEMS);
  const [search, setSearch] = useState("");
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(
    NOTE_REPOSITORIES[0]?.id ?? null
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(NOTE_ITEMS[0]?.id ?? null);
  const [showPreview, setShowPreview] = useState(true);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const repositoryFolders = useMemo(
    () => folders.filter((folder) => folder.repositoryId === selectedRepositoryId),
    [folders, selectedRepositoryId]
  );

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedRepositoryId && note.repositoryId !== selectedRepositoryId) return false;
      if (selectedFolderId && note.folderId !== selectedFolderId) return false;
      if (!search) return true;
      const keyword = search.toLowerCase();
      return (
        note.title.toLowerCase().includes(keyword) ||
        note.excerpt.toLowerCase().includes(keyword) ||
        note.tags.some((tag) => tag.toLowerCase().includes(keyword))
      );
    });
  }, [notes, search, selectedFolderId, selectedRepositoryId]);

  const activeNote =
    notes.find((note) => note.id === activeNoteId) ??
    filteredNotes[0] ??
    null;

  const updateActiveNote = (updater: (current: NoteItem) => NoteItem) => {
    if (!activeNoteId) return;
    setNotes((current) =>
      current.map((note) => (note.id === activeNoteId ? updater(note) : note))
    );
  };

  const handleCreateRepository = () => {
    if (!repoName.trim()) return;
    const repoId = `repo-note-${Date.now()}`;
    const nextRepo = {
      id: repoId,
      name: repoName.trim(),
      kind: "notes" as const,
      storagePath: `/library/notes/${repoId}`,
      description: "新建笔记存储库",
      itemCount: 0,
    };
    setRepositories((current) => [nextRepo, ...current]);
    setSelectedRepositoryId(repoId);
    setSelectedFolderId(null);
    setRepoName("");
    setShowCreateRepo(false);
  };

  const handleCreateFolder = () => {
    if (!folderName.trim() || !selectedRepositoryId) return;
    const repo = repositories.find((item) => item.id === selectedRepositoryId);
    if (!repo) return;
    const folderId = `folder-note-${Date.now()}`;
    setFolders((current) => [
      {
        id: folderId,
        repositoryId: selectedRepositoryId,
        name: folderName.trim(),
        parentId: null,
        path: `${repo.storagePath}/${folderName.trim()}`,
        itemCount: 0,
      },
      ...current,
    ]);
    setSelectedFolderId(folderId);
    setFolderName("");
    setShowCreateFolder(false);
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim() || !selectedRepositoryId) return;
    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    const note: NoteItem = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim(),
      repositoryId: selectedRepositoryId,
      folderId: selectedFolderId,
      path: `/library/notes/${selectedRepositoryId}/${noteTitle.trim()}.md`,
      excerpt: "新建 Markdown 笔记",
      tags: ["新建"],
      wordCount: 0,
      updatedAt: now,
      markdown: `# ${noteTitle.trim()}\n\n在这里开始书写你的 Markdown 富文本内容。`,
    };
    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
    setNoteTitle("");
    setShowCreateNote(false);
  };

  const handleImageUpload = async (file: File) => {
    return Promise.resolve(URL.createObjectURL(file));
  };

  const handleImportImage = () => {
    fileInputRef.current?.click();
  };

  const handleInlineImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeNote) return;
    const imageUrl = URL.createObjectURL(file);
    const nextMarkdown = `${activeNote.markdown}\n\n![${file.name}](${imageUrl})\n`;
    updateActiveNote((current) => ({
      ...current,
      markdown: nextMarkdown,
      excerpt: "已插入图片资源",
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    }));
    event.target.value = "";
  };

  const handleExport = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    saveAs(blob, `${activeNote.title}.md`);
  };

  return (
    <div className="flex h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInlineImage}
      />

      <aside
        className="w-72 flex-shrink-0 overflow-y-auto border-r p-3 scrollbar-thin"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-soft)" }}
      >
        <div className="rounded-[var(--radius-lg)] border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-tertiary)" }}>
            Markdown 笔记
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            先创建存储库，再在目录下新建 Markdown 富文本笔记。
          </p>
          <button className="ui-control ui-control-active mt-3 w-full justify-center" onClick={() => setShowCreateRepo(true)}>
            <Plus size={14} />
            创建存储库
          </button>
        </div>

        <div className="mt-4 space-y-1">
          {repositories.map((repo) => {
            const active = repo.id === selectedRepositoryId;
            return (
              <button
                key={repo.id}
                className={cn("ui-control w-full justify-start px-3 py-3", active && "ui-control-active")}
                style={{ minHeight: 52 }}
                onClick={() => {
                  setSelectedRepositoryId(repo.id);
                  setSelectedFolderId(null);
                }}
              >
                <NotebookPen size={16} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{repo.name}</span>
                  <span className="block truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {repo.itemCount} 篇笔记
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
          className={cn("ui-control mt-2 w-full justify-start px-3", !selectedFolderId && "ui-control-active")}
          onClick={() => setSelectedFolderId(null)}
        >
          <PanelLeftOpen size={14} />
          所有笔记
        </button>

        {repositoryFolders.map((folder) => (
          <button
            key={folder.id}
            className={cn("ui-control mt-1 w-full justify-start px-3", selectedFolderId === folder.id && "ui-control-active")}
            onClick={() => setSelectedFolderId(folder.id)}
          >
            <NotebookPen size={14} />
            <span className="min-w-0 flex-1 truncate text-left">{folder.name}</span>
          </button>
        ))}

        <div className="ui-divider my-4 h-px" />

        <div className="relative">
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
          {filteredNotes.map((note) => {
            const active = note.id === activeNote?.id;
            return (
              <button
                key={note.id}
                className={cn("ui-card w-full rounded-[var(--radius-lg)] p-3 text-left", active && "ui-control-active")}
                onClick={() => setActiveNoteId(note.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {note.title}
                  </span>
                  <span className="rounded-full px-2 py-1 text-[10px]" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    .md
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {note.excerpt}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={`${note.id}-${tag}`}
                      className="rounded-full px-2 py-1 text-[10px]"
                      style={{ backgroundColor: "var(--accent-muted)", color: "var(--text-secondary)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--divider-strong)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <button className="ui-control" onClick={() => setShowCreateNote(true)}>
              <Plus size={14} />
              新建笔记
            </button>
            <button className="ui-control" onClick={handleImportImage}>
              <ImagePlus size={14} />
              插入图片
            </button>
            <button className="ui-control" onClick={handleExport}>
              <Download size={14} />
              导出 Markdown
            </button>
            <button
              className={cn("ui-control", showPreview && "ui-control-active")}
              onClick={() => setShowPreview((current) => !current)}
            >
              <Eye size={14} />
              {showPreview ? "隐藏预览" : "显示预览"}
            </button>
          </div>

          <div className="mt-3 rounded-[var(--radius-lg)] border px-3 py-2" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {activeNote?.title ?? "未选择笔记"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              支持富文本输入、图片插入、Markdown 预览与导出，后续可接入真实上传和保存接口。
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeNote ? (
            <div className="flex h-full min-h-0">
              <div className={cn("min-w-0 flex-1", showPreview ? "w-2/3" : "w-full")}>
                <MarkdownEditor
                  key={activeNote.id}
                  value={activeNote.markdown}
                  style={{ height: "100%" }}
                  config={{
                    view: {
                      menu: true,
                      md: true,
                      html: showPreview,
                    },
                    canView: {
                      menu: true,
                      md: true,
                      html: true,
                      both: true,
                      fullScreen: true,
                      hideMenu: true,
                    },
                    syncScrollMode: ["leftFollowRight", "rightFollowLeft"],
                    imageAccept: ".png,.jpg,.jpeg,.webp,.gif",
                    allowPasteImage: true,
                    onImageUpload: handleImageUpload,
                  }}
                  placeholder="开始编写 Markdown 富文本笔记..."
                  renderHTML={(text: string) => markdownParser.render(text)}
                  onChange={({ text }) => {
                    updateActiveNote((current) => ({
                      ...current,
                      markdown: text,
                      excerpt: text.replace(/[#>*`-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 48) || "空白笔记",
                      wordCount: text.length,
                      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
                    }));
                  }}
                />
              </div>

              <div
                className="w-80 flex-shrink-0 border-l p-4 scrollbar-thin overflow-y-auto"
                style={{
                  display: showPreview ? "block" : "none",
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-panel)",
                }}
              >
                <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    笔记信息
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span style={{ color: "var(--text-tertiary)" }}>更新时间</span>
                      <span style={{ color: "var(--text-secondary)" }}>{activeNote.updatedAt}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span style={{ color: "var(--text-tertiary)" }}>字数</span>
                      <span style={{ color: "var(--text-secondary)" }}>{activeNote.wordCount}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span style={{ color: "var(--text-tertiary)" }}>存储路径</span>
                      <span className="break-all text-xs" style={{ color: "var(--text-secondary)" }}>
                        {activeNote.path}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    高级能力
                  </p>
                  <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <li>支持 Markdown 与富文本工具栏混合输入</li>
                    <li>支持图片上传、拖拽粘贴与即时预览</li>
                    <li>支持导出 Markdown 文件，后续可扩展 PDF/HTML</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-sm text-center">
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  先创建笔记存储库
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  然后在目录下新建 Markdown 笔记，即可开始在线编辑与预览。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {showCreateRepo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[400px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              创建笔记存储库
            </p>
            <input
              className="ui-input mt-4 w-full px-3 py-2 text-sm outline-none"
              placeholder="存储库名称"
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateRepo(false)}>
                {t("common.cancel")}
              </button>
              <button className="ui-control ui-control-active" onClick={handleCreateRepository}>
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateFolder && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[360px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              创建笔记目录
            </p>
            <input
              className="ui-input mt-4 w-full px-3 py-2 text-sm outline-none"
              placeholder="目录名称"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateFolder(false)}>
                {t("common.cancel")}
              </button>
              <button className="ui-control ui-control-active" onClick={handleCreateFolder}>
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateNote && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[400px] rounded-[var(--radius-xl)] p-5">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              新建笔记
            </p>
            <input
              className="ui-input mt-4 w-full px-3 py-2 text-sm outline-none"
              placeholder="笔记标题"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setShowCreateNote(false)}>
                {t("common.cancel")}
              </button>
              <button className="ui-control ui-control-active" onClick={handleCreateNote}>
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
