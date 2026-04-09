import { Filters } from "../pages/AccountsPage/types";

const sel = "px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-brand-400";
const inp = "px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-brand-400";

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  activeCount: number;
}

export default function FilterBar({ filters, onChange, onReset, activeCount }: Props) {
  const hasFilters =
    filters.email ||
    filters.status !== "all" ||
    filters.quotaOp ||
    filters.hasKey !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50/80 rounded-lg border border-gray-100">
      {/* Email / API key search */}
      <div className="relative">
        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          placeholder="Email / API key…"
          value={filters.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className={`${inp} pl-7 w-[200px]`}
        />
      </div>

      <span className="text-gray-300 text-xs">│</span>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as Filters["status"] })}
        className={sel}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
        <option value="unchecked">Unchecked</option>
        <option value="expired">Expired</option>
      </select>

      {/* Quota filter */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Quota</span>
        <select
          value={filters.quotaOp}
          onChange={(e) => onChange({ quotaOp: e.target.value as Filters["quotaOp"] })}
          className={`${sel} w-[50px]`}
        >
          <option value="">—</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
        {filters.quotaOp && (
          <input
            type="number"
            min={0}
            max={100}
            placeholder="%"
            value={filters.quotaVal}
            onChange={(e) => onChange({ quotaVal: e.target.value })}
            className={`${inp} w-[60px]`}
          />
        )}
      </div>

      {/* Has key */}
      <select
        value={filters.hasKey}
        onChange={(e) => onChange({ hasKey: e.target.value as Filters["hasKey"] })}
        className={sel}
      >
        <option value="all">All Keys</option>
        <option value="yes">Has Key</option>
        <option value="no">No Key</option>
      </select>

      {/* Count + reset */}
      <span className="text-xs text-gray-400 ml-auto">{activeCount} results</span>
      {hasFilters && (
        <button onClick={onReset} className="text-xs text-red-500 hover:text-red-700 font-medium">
          ✕ Clear
        </button>
      )}
    </div>
  );
}
