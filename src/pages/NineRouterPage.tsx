/**
 * NineRouterPage.tsx — Admin view cho 9router DB.
 *
 * Hiển thị toàn bộ Gemini keys đang lưu trong 9router SQLite, kèm:
 *   - DB path (host), size, mtime
 *   - Tổng active/inactive
 *   - Từng connection: priority, name, isActive, api_key (giá trị thật), createdAt, updatedAt
 *   - Nút Reload pool (force re-read DB)
 *
 * Endpoint backend: tts-proxy GET /api/admin/9router/keys
 * Endpoint reload : tts-proxy POST /api/admin/9router/reload
 */
import { useCallback, useEffect, useState } from "react";

import { ttsApi, type NineRouterKey, type NineRouterKeysData } from "../api/tts";

const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

const RowKey = ({ k }: { k: NineRouterKey }) => {
  const [show, setShow] = useState(false);
  const v = k.api_key ?? "";
  const display = !v ? "—" : show ? v : `${v.slice(0, 6)}…${v.slice(-4)}`;
  return (
    <code
      onClick={() => v && setShow((s) => !s)}
      className={`font-mono text-xs px-1.5 py-0.5 rounded cursor-pointer select-all ${
        v ? "bg-gray-100 hover:bg-gray-200 text-gray-800" : "bg-red-50 text-red-500"
      }`}
      title={v ? "Click để toggle hiển thị" : "Row không có apiKey"}
    >
      {display}
    </code>
  );
};

export default function NineRouterPage() {
  const [data, setData] = useState<NineRouterKeysData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await ttsApi.adminNineRouterKeys();
      setData(d);
      setLastFetched(new Date());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = async () => {
    setReloading(true);
    setError(null);
    try {
      await ttsApi.adminNineRouterReload();
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setReloading(false);
    }
  };

  const filtered = (data?.keys ?? []).filter((k) => {
    if (filter === "active" && !k.isActive) return false;
    if (filter === "inactive" && k.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(k.name ?? "").toLowerCase().includes(q) &&
        !(k.email ?? "").toLowerCase().includes(q) &&
        !(k.data_email ?? "").toLowerCase().includes(q) &&
        !(k.api_key ?? "").toLowerCase().includes(q) &&
        !String(k.priority).includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">9router Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tất cả Gemini keys đang lưu trong 9router SQLite DB
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={!data}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => void reload()}
            disabled={reloading || !data}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {reloading ? "Reloading…" : "⚡ Reload pool"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {error}
          <p className="text-xs mt-1 text-red-600">
            Container tts-proxy không thấy 9router DB. Cần mount host path vào container hoặc set
            <code className="mx-1 px-1 bg-red-100">NINE_ROUTER_DB</code> env đúng.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">DB path</p>
              <p className="mt-1 font-mono text-xs text-gray-800 break-all" title={data.db_path}>
                {data.db_path}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {data.db_exists ? (
                  <>
                    {fmtBytes(data.db_size_bytes)} · mtime {fmtDate(data.db_mtime)}
                  </>
                ) : (
                  <span className="text-red-600">FILE NOT FOUND</span>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {data.total_connections}
              </p>
              <p className="text-xs text-gray-400">connections</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                {data.active_connections}
              </p>
              <p className="text-xs text-gray-400">isActive=1</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inactive</p>
              <p className="mt-1 text-2xl font-semibold text-gray-400">
                {data.inactive_connections}
              </p>
              <p className="text-xs text-gray-400">isActive=0</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 font-medium ${
                    filter === f
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search name, email, key, priority…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            {lastFetched && (
              <span className="text-xs text-gray-400">
                fetched {lastFetched.toLocaleTimeString("vi-VN")}
              </span>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Pri</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">apiKey (admin)</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Active</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Updated</th>
                    <th className="px-3 py-2 text-left">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                        No keys match filter
                      </td>
                    </tr>
                  )}
                  {filtered.map((k) => (
                    <tr
                      key={k.id}
                      className={`hover:bg-gray-50 ${k.isActive ? "" : "opacity-60"}`}
                    >
                      <td className="px-3 py-2 font-mono text-gray-600">{k.priority}</td>
                      <td className="px-3 py-2 text-gray-800">{k.name ?? "—"}</td>
                      <td className="px-3 py-2"><RowKey k={k} /></td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {k.email || k.data_email || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {k.isActive ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            OFF
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {fmtDate(k.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {fmtDate(k.updatedAt)}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-400">
                        {k.id.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
              {filtered.length} / {data.keys.length} rows
            </div>
          </div>
        </>
      )}
    </div>
  );
}
