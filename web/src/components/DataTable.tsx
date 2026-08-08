import { useMemo, useState, type ReactNode } from "react";
import { DownloadIcon, SearchIcon, SortIcon } from "./icons";
import { SkeletonRows } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  csvValue?: (row: T) => string | number;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder = "Ara...",
  searchFn,
  pageSize = 10,
  onRowClick,
  exportFilename,
  emptyMessage = "Kayıt bulunamadı.",
  loading = false,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  exportFilename?: string;
  emptyMessage?: string;
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    if (searchFn) return data.filter((row) => searchFn(row, q));
    return data.filter((row) =>
      columns.some((col) => String(col.csvValue ? col.csvValue(row) : "").toLowerCase().includes(q))
    );
  }, [data, query, searchFn, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageData = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const header = columns.map((c) => c.header).join(",");
    const rows = sorted.map((row) =>
      columns
        .map((c) => {
          const raw = c.csvValue ? c.csvValue(row) : "";
          const s = String(raw).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename ?? "veri"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="data-table">
      <div className="data-table__toolbar">
        <div className="data-table__search">
          <SearchIcon size={16} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
          />
        </div>
        {exportFilename && (
          <button type="button" className="secondary" onClick={exportCsv} disabled={sorted.length === 0}>
            <DownloadIcon size={15} /> CSV indir
          </button>
        )}
      </div>

      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ textAlign: col.align ?? "left", width: col.width, cursor: col.sortValue ? "pointer" : undefined }}
                  onClick={() => toggleSort(col)}
                >
                  <span className="data-table__th-inner">
                    {col.header}
                    {col.sortValue && (
                      <SortIcon size={12} className={sortKey === col.key ? "data-table__sort-active" : "data-table__sort"} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <SkeletonRows rows={5} columns={columns.length} />
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyMessage} />
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "data-table__row--clickable" : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="data-table__pagination">
          <button type="button" className="secondary" disabled={clampedPage <= 1} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </button>
          <span>
            {clampedPage} / {totalPages}
          </span>
          <button type="button" className="secondary" disabled={clampedPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
