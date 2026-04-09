import { Account } from "../../../api/client";

interface KeyDetailData {
  is_free_tier?: boolean;
  label?: string;
  limit?: number | null;
  limit_remaining?: number | null;
  limit_reset?: string | null;
  usage?: number;
  byok_usage?: number;
  usage_monthly?: number;
  byok_usage_monthly?: number;
  usage_weekly?: number;
  byok_usage_weekly?: number;
  usage_daily?: number;
  byok_usage_daily?: number;
}

interface Props {
  acc: Account;
  data: KeyDetailData | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toFixed(4)}`;

export default function DetailModal({ acc, data, loading, error, onClose }: Props) {
  const limitPct = data?.limit && data.limit > 0 && data.limit_remaining != null
    ? Math.round((data.limit_remaining / data.limit) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">OpenRouter Key Detail</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[350px]" title={acc.email}>
              {acc.email}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <svg className="w-6 h-6 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Valid
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                data.is_free_tier ? "bg-gray-100 text-gray-600" : "bg-violet-50 text-violet-700"
              }`}>
                {data.is_free_tier ? "Free Tier" : "Paid"}
              </span>
              {data.label && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {data.label}
                </span>
              )}
            </div>

            {/* Credit limit bar */}
            {data.limit != null && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Credit Limit</span>
                  <span className="font-semibold text-gray-900">{fmt(data.limit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-semibold ${
                    limitPct != null && limitPct < 20 ? "text-red-600"
                    : limitPct != null && limitPct < 50 ? "text-amber-600"
                    : "text-emerald-600"
                  }`}>{fmt(data.limit_remaining)}</span>
                </div>
                {limitPct != null && (
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        limitPct < 20 ? "bg-red-500" : limitPct < 50 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${limitPct}%` }}
                    />
                  </div>
                )}
                {data.limit_reset && (
                  <p className="text-xs text-gray-400">Resets: {data.limit_reset}</p>
                )}
              </div>
            )}

            {/* Usage table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Period</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-2">Usage</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-2">BYOK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {([
                    ["All Time", data.usage, data.byok_usage],
                    ["Monthly",  data.usage_monthly, data.byok_usage_monthly],
                    ["Weekly",   data.usage_weekly, data.byok_usage_weekly],
                    ["Daily",    data.usage_daily, data.byok_usage_daily],
                  ] as [string, number, number][]).map(([label, usage, byok]) => (
                    <tr key={label} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700 font-medium">{label}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-900">{fmt(usage)}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-400">{fmt(byok)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
