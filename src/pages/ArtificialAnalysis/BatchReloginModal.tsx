import { useEffect, useMemo, useRef, useState } from "react";
import { useAABatchRelogin } from "./useAABatchRelogin";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BatchReloginModal({ open, onClose }: Props) {
  const { running, progress, logs, results, handleStart, handleStop } = useAABatchRelogin();
  const [workers, setWorkers] = useState(5);
  const [onlyExpired, setOnlyExpired] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of logs) {
      if (!map.has(l.email)) map.set(l.email, []);
      map.get(l.email)!.push(l.msg);
    }
    return map;
  }, [logs]);

  const resultByEmail = useMemo(() => {
    const m = new Map<string, { status: string; error: string }>();
    for (const r of results) m.set(r.email, { status: r.status, error: r.error });
    return m;
  }, [results]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !running) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="text-sm font-semibold text-gray-800">Re-login All (testmail)</span>
          <span className="flex-1" />
          {progress && (
            <span className="text-xs font-mono text-gray-500">
              {progress.done}/{progress.total} · ✓{progress.success} ✗{progress.failed} · {progress.workers}x
            </span>
          )}
          <button
            onClick={() => { if (!running) onClose(); }}
            disabled={running}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 disabled:opacity-30 disabled:cursor-not-allowed"
            title={running ? "Đang chạy — Stop trước" : "Đóng"}
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 shrink-0">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Luồng:
            <input
              type="number"
              min={1}
              max={10}
              value={workers}
              onChange={(e) => setWorkers(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              disabled={running}
              className="w-16 text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50"
            />
            <span className="text-gray-400">(1-10, gateway queue nếu &gt;4)</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyExpired}
              onChange={(e) => setOnlyExpired(e.target.checked)}
              disabled={running}
              className="accent-violet-600"
            />
            Chỉ expired
          </label>
          <span className="flex-1" />
          {running ? (
            <button
              onClick={handleStop}
              className="text-xs px-3 py-1.5 rounded-md border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => handleStart(workers, onlyExpired)}
              className="text-xs px-3 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Start
            </button>
          )}
        </div>

        {/* Log panel */}
        <div className="overflow-y-auto p-3 flex-1 min-h-0 space-y-2 bg-gray-50">
          {grouped.size === 0 && !running && (
            <div className="text-center text-xs text-gray-400 py-12">
              Nhấn Start để re-login toàn bộ AA testmail accounts.
            </div>
          )}
          {running && grouped.size === 0 && (
            <div className="text-xs text-gray-400 text-center py-4">Khởi tạo batch…</div>
          )}
          {Array.from(grouped.entries()).map(([email, lines]) => {
            const res = resultByEmail.get(email);
            const color = res
              ? res.status === "success"
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-red-300 bg-red-50/50"
              : "border-gray-200 bg-white";
            const dot = res ? (res.status === "success" ? "✓" : "✗") : "▶";
            const dotColor = res
              ? res.status === "success" ? "text-emerald-600" : "text-red-500"
              : "text-violet-500 animate-pulse";
            return (
              <div key={email} className={`rounded-md border ${color} p-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono ${dotColor}`}>{dot}</span>
                  <span className="text-xs font-medium text-gray-700 truncate flex-1" title={email}>{email}</span>
                  {res?.status === "failed" && res.error && (
                    <span className="text-xs text-red-500 truncate max-w-[200px]" title={res.error}>{res.error}</span>
                  )}
                </div>
                <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed ml-4">
                  {lines.join("\n")}
                </pre>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
