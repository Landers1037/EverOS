"use client";

import { useMemo, useState } from "react";
import type { AppInstance } from "@/types/app";
import type { TrashRecord } from "@/types/content";
import { TRASH_RECORDS } from "@/mock/content";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/utils/cn";
import { AlertTriangle, RotateCcw, Search, Trash2 } from "lucide-react";

interface TrashManagerProps {
  instance: AppInstance;
}

/** 回收站应用。 */
export function TrashManager({}: TrashManagerProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<TrashRecord[]>(TRASH_RECORDS);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!search) return true;
      const keyword = search.toLowerCase();
      return (
        record.name.toLowerCase().includes(keyword) ||
        record.realPath.toLowerCase().includes(keyword) ||
        record.repositoryName.toLowerCase().includes(keyword)
      );
    });
  }, [records, search]);

  const selectedRecords = filteredRecords.filter((record) =>
    selectedIds.includes(record.id)
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredRecords.map((record) => record.id));
  };

  const handleRestore = () => {
    setRecords((current) => current.filter((record) => !selectedIds.includes(record.id)));
    setSelectedIds([]);
    setConfirmAction(null);
  };

  const handleDelete = () => {
    setRecords((current) => current.filter((record) => !selectedIds.includes(record.id)));
    setSelectedIds([]);
    setConfirmAction(null);
  };

  return (
    <div className="flex h-full flex-col">
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

          <button
            className="ui-control"
            disabled={selectedIds.length === 0}
            onClick={() => setConfirmAction("restore")}
          >
            <RotateCcw size={14} />
            批量恢复
          </button>
          <button
            className={cn("ui-control", selectedIds.length > 0 && "ui-control-active")}
            disabled={selectedIds.length === 0}
            onClick={() => setConfirmAction("delete")}
          >
            <Trash2 size={14} />
            彻底删除
          </button>
        </div>

        <div className="mt-3 rounded-[var(--radius-lg)] border px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            NAS 风格逻辑删除区，记录文件名称、真实路径和删除时间，支持多选恢复与二次确认删除。
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--divider-strong)", color: "var(--text-tertiary)" }}>
              <th className="px-2 py-3 text-left font-medium">
                <input
                  type="checkbox"
                  checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-3 text-left font-medium">{t("common.name")}</th>
              <th className="px-2 py-3 text-left font-medium">{t("common.type")}</th>
              <th className="px-2 py-3 text-left font-medium">存储库</th>
              <th className="px-2 py-3 text-left font-medium">真实存储路径</th>
              <th className="px-2 py-3 text-left font-medium">删除时间</th>
              <th className="px-2 py-3 text-left font-medium">{t("common.size")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => {
              const checked = selectedIds.includes(record.id);
              return (
                <tr
                  key={record.id}
                  className={cn("hover:bg-[var(--accent-muted)]", checked && "bg-[var(--accent-muted)]")}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedIds((current) =>
                          checked
                            ? current.filter((id) => id !== record.id)
                            : [...current, record.id]
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-3" style={{ color: "var(--text-primary)" }}>{record.name}</td>
                  <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{record.itemType}</td>
                  <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{record.repositoryName}</td>
                  <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{record.realPath}</td>
                  <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{record.deletedAt}</td>
                  <td className="px-2 py-3" style={{ color: "var(--text-secondary)" }}>{record.size}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmAction && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="ui-surface w-[460px] rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle size={22} style={{ color: confirmAction === "delete" ? "var(--state-danger)" : "var(--state-warning)" }} />
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {confirmAction === "delete" ? "确认彻底删除" : "确认恢复所选数据"}
                </p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  已选择 {selectedIds.length} 项
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-40 overflow-y-auto rounded-[var(--radius-lg)] border p-3 text-sm scrollbar-thin" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-panel)" }}>
              {selectedRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-3 py-1">
                  <span style={{ color: "var(--text-secondary)" }}>{record.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{record.realPath}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="ui-control" onClick={() => setConfirmAction(null)}>
                {t("common.cancel")}
              </button>
              <button
                className={cn("ui-control", confirmAction === "delete" && "ui-control-active")}
                onClick={confirmAction === "delete" ? handleDelete : handleRestore}
              >
                {confirmAction === "delete" ? "确认删除" : "确认恢复"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
