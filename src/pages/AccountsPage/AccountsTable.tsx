import { Account } from "../../api/client";
import { StatusCell, QuotaBadge } from "../../components/StatusCell";
import { ThSortable } from "../../components/ThSortable";
import { SortKey, SortDir, ColKey } from "./types";
import { SERVICE_COLORS, CHECKABLE_SERVICES, isGmailMailbox } from "../../constants/accounts";

interface Props {
  pageData: Account[];
  loading: boolean;

  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;

  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  sortedCount: number;

  visibleCols: Set<ColKey>;
  col: (k: ColKey) => boolean;

  checking: Set<string>;
  copied: string | null;
  setCopied: (v: string | null) => void;
  onToast: (msg: string, ok: boolean) => void;

  onCheckOne: (acc: Account) => void;
  onOpenDetail: (acc: Account) => void;
  onOpenEdit: (acc: Account) => void;
  onToggleDisabled: (acc: Account) => void;
  onRemove: (acc: Account) => void;
  onGmailVariations: (acc: Account) => void;
}

export default function AccountsTable({
  pageData, loading,
  sortKey, sortDir, onSort,
  page, setPage, totalPages, sortedCount,
  visibleCols, col,
  checking, copied, setCopied, onToast,
  onCheckOne, onOpenDetail, onOpenEdit, onToggleDisabled, onRemove, onGmailVariations,
}: Props) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          {col("email")        && <col className="w-[22%]" />}
          {col("service")      && <col className="w-[90px]" />}
          {col("api_key")      && <col className="w-[160px]" />}
          {col("password")     && <col className="w-[110px]" />}
          {col("credits")      && <col className="w-[65px]" />}
          {col("status")       && <col className="w-[85px]" />}
          {col("quota_pct")    && <col className="w-[65px]" />}
          {col("created_at")   && <col className="w-[80px]" />}
          {col("last_checked") && <col className="w-[130px]" />}
          {col("last_error")   && <col className="w-[18%]" />}
          {col("actions")      && <col className="w-[100px]" />}
        </colgroup>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {col("email")        && <ThSortable label="Email"    col="email"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("service")      && <ThSortable label="Service"  col="service"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("api_key")      && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">API Key</th>}
            {col("password")     && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Password</th>}
            {col("credits")      && <ThSortable label="Credits"  col="credits"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("status")       && <ThSortable label="Status"   col="status"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("quota_pct")    && <ThSortable label="Quota"    col="quota_pct" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("created_at")   && <ThSortable label="Created"  col="created_at" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            {col("last_checked") && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Last Checked</th>}
            {col("last_error")   && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Last Error</th>}
            {col("actions")      && <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {pageData.map((a) => {
            const rowKey = `${a.service}:${a.email}`;
            const isChecking = checking.has(rowKey);
            return (
              <tr key={rowKey} className={`hover:bg-blue-50/40 transition-colors group ${a.disabled ? "opacity-50" : ""}`}>
                {col("email") && (
                  <td
                    className="px-4 py-3 font-mono text-xs text-gray-700 truncate cursor-pointer hover:text-brand-600"
                    onClick={() => { navigator.clipboard.writeText(a.email); onToast(`Copied: ${a.email}`, true); }}
                    title={a.email}
                  >
                    {a.email}
                  </td>
                )}
                {col("service") && (
                  <td className="px-4 py-3">
                    <span className={`badge ${SERVICE_COLORS[a.service] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.service}
                    </span>
                  </td>
                )}
                {col("api_key") && (
                  <td className="px-3 py-3">
                    {a.api_key ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(a.api_key!);
                          setCopied(a.api_key!);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="flex items-center gap-1 font-mono text-xs text-gray-500 hover:text-brand-600 transition-colors w-full truncate"
                      >
                        {copied === a.api_key ? (
                          <span className="text-emerald-600 font-medium shrink-0">✓ Copied</span>
                        ) : (
                          <>
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{a.api_key.slice(0, 18)}…</span>
                          </>
                        )}
                      </button>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                )}
                {col("password") && (
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 truncate">
                    {a.password
                      ? <button onClick={() => { navigator.clipboard.writeText(a.password!); onToast("Copied password", true); }}
                          className="hover:text-brand-600 transition-colors truncate w-full text-left"
                          title={a.password}>{a.password}</button>
                      : <span className="text-gray-300">—</span>}
                  </td>
                )}
                {col("credits") && (
                  <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">
                    {a.credits != null ? a.credits.toLocaleString() : <span className="text-gray-300">—</span>}
                  </td>
                )}
                {col("status") && (
                  <td className="px-4 py-3"><StatusCell acc={a} /></td>
                )}
                {col("quota_pct") && (
                  <td className="px-4 py-3"><QuotaBadge pct={a.quota_pct} /></td>
                )}
                {col("created_at") && (
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString("vi-VN") : "—"}
                  </td>
                )}
                {col("last_checked") && (
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {a.last_checked ?? "—"}
                  </td>
                )}
                {col("last_error") && (
                  <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate" title={a.last_error ?? ""}>
                    {a.last_error || <span className="text-gray-300">—</span>}
                  </td>
                )}
                {col("actions") && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {a.service === "OPENROUTER" && a.api_key && (
                        <button onClick={() => onOpenDetail(a)} title="Key Detail"
                          className="p-1 rounded hover:bg-violet-50 text-gray-400 hover:text-violet-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {CHECKABLE_SERVICES.has(a.service) && (
                        <button onClick={() => onCheckOne(a)} disabled={isChecking}
                          title={a.last_checked ? `Checked: ${a.last_checked}` : "Check account"}
                          className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600 disabled:opacity-40">
                          <svg className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => onOpenEdit(a)} title="Edit account"
                        className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {isGmailMailbox(a.email) && !!a.app_password && (
                        <button onClick={() => onGmailVariations(a)} title="Gmail variations (+/./googlemail)"
                          className="p-1 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => onToggleDisabled(a)}
                        title={a.disabled ? "Enable" : "Disable"}
                        className={`p-1 rounded hover:bg-gray-100 ${a.disabled ? "text-emerald-500 hover:text-emerald-700" : "text-gray-400 hover:text-amber-600"}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {a.disabled ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                          )}
                        </svg>
                      </button>
                      <button onClick={() => onRemove(a)} title="Delete"
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {!loading && pageData.length === 0 && (
            <tr>
              <td colSpan={visibleCols.size} className="py-16 text-center">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <p className="text-sm text-gray-400">Không tìm thấy kết quả</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            Trang {page}/{totalPages} · {sortedCount} kết quả
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(1)}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    p === page
                      ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}>{p}</button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
            <button disabled={page === totalPages} onClick={() => setPage(totalPages)}
              className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
