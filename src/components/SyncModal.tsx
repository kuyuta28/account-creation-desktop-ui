"use client";

import { useState, useEffect, useMemo } from "react";

interface SyncItem {
  email: string;
  api_key?: string;
  account_id?: string;
  priority?: number;
  // Status
  exists_in_target: boolean;
  will_sync: boolean;
  // Optional fields
  lastUsedAt?: string;
  consecutiveUseCount?: number;
  testStatus?: string;
  lastError?: string;
  lastErrorAt?: string;
  [key: string]: any;
}

interface FilterState {
  search: string;
  status: "all" | "new" | "exists";
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  targetName: string; // e.g., "9router", "CLIProxy"
  items: SyncItem[];
  loading: boolean;
  onSync: (selectedEmails: string[]) => void;
  syncing: boolean;
  // Stats from API (frontend không tính toán)
  total: number;
  newCount: number;
  existsCount: number;
}

const ITEMS_PER_PAGE = 50;

export default function SyncModal({
  open,
  onClose,
  title,
  targetName,
  items,
  loading,
  onSync,
  syncing,
  total,
  newCount,
  existsCount,
}: Props) {
  const [filter, setFilter] = useState<FilterState>({ search: "", status: "all" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset when open - auto select items that are not synced
  useEffect(() => {
    if (open) {
      setPage(1);
      setFilter({ search: "", status: "all" });
      // Auto-select items that can be synced (not exists in target)
      const notSynced = items.filter((i) => !i.exists_in_target).map((i) => i.email);
      setSelected(new Set(notSynced));
    }
  }, [open, items]);

  // Filter items
  const filtered = useMemo(() => {
    let result = items;

    if (filter.status === "new") {
      result = result.filter((i) => !i.exists_in_target);
    } else if (filter.status === "exists") {
      result = result.filter((i) => i.exists_in_target);
    }

    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      result = result.filter((i) => i.email.toLowerCase().includes(q));
    }

    return result;
  }, [items, filter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // Stats - from API response (props)
  const stats = { total, newCount, existsCount };

  const filteredStats = useMemo(() => {
    const willSync = filtered.filter((i) => i.will_sync).length;
    return { total: filtered.length, willSync };
  }, [filtered]);

  // Selection handlers
  const toggleSelect = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const emails = pageItems.map((i) => i.email);
    const allSelected = emails.every((e) => selected.has(e));
    setSelected((prev) => {
      const next = new Set(prev);
      emails.forEach((e) => {
        if (allSelected) next.delete(e);
        else next.add(e);
      });
      return next;
    });
  };

  const selectAllWillSync = () => {
    const willSyncEmails = filtered.filter((i) => i.will_sync).map((i) => i.email);
    setSelected(new Set(willSyncEmails));
  };

  const handleSync = () => {
    if (selected.size === 0) return;
    onSync(Array.from(selected));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sync to {targetName} · {stats.total} accounts ·{" "}
              <span className="text-emerald-600 font-medium">{stats.newCount} new</span> ·{" "}
              <span className="text-gray-400">{stats.existsCount} exists</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search email..."
            value={filter.search}
            onChange={(e) => {
              setFilter((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter((f) => ({ ...f, status: e.target.value as FilterState["status"] }));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All ({filteredStats.total})</option>
            <option value="new">Not synced ({filteredStats.willSync})</option>
            <option value="exists">Exists ({stats.existsCount})</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={selectAllWillSync}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            Select all not synced
          </button>
        </div>

        {/* Table header */}
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-xs font-medium text-gray-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pageItems.length > 0 && pageItems.every((i) => selected.has(i.email))}
              onChange={toggleSelectAll}
              className="rounded border-gray-300"
            />
            Select ({selected.size})
          </label>
          <span className="flex-1">Email</span>
          <span className="w-24 text-center">Status</span>
          <span className="w-16 text-center">API Key</span>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-8 h-8 animate-spin text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              No accounts found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pageItems.map((item) => (
                <div
                  key={item.email}
                  className={`px-5 py-2.5 flex items-center gap-3 text-sm hover:bg-gray-50 ${
                    item.exists_in_target ? "bg-gray-50/50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.email)}
                    onChange={() => toggleSelect(item.email)}
                    disabled={item.exists_in_target}
                    className="rounded border-gray-300"
                  />
                  <span className="flex-1 font-mono text-xs truncate">{item.email}</span>
                  <span className="w-24 text-center">
                    {item.exists_in_target ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Exists</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">New</span>
                    )}
                  </span>
                  <span className="w-16 text-center">
                    {item.api_key ? (
                      <svg className="w-4 h-4 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {filtered.length} items
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      page === p
                        ? "bg-brand-600 text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {selected.size > 0 ? (
              <span className="text-emerald-600 font-medium">{selected.size}</span>
            ) : (
              "No"
            )}{" "}
            account{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSync}
              disabled={selected.size === 0 || syncing}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync {selected.size > 0 && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
