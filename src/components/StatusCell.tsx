import { Account } from "../api/client";

export function QuotaBadge({ pct }: { pct?: number | null }) {
  if (pct == null) return <span className="text-gray-300 text-xs">—</span>;
  const color =
    pct > 50 ? "text-emerald-700 bg-emerald-50"
    : pct > 20 ? "text-amber-700 bg-amber-50"
    : "text-red-700 bg-red-50";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  active:    { label: "Active",    dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  disabled:  { label: "Disabled",  dot: "bg-red-500",     bg: "bg-red-50 text-red-700" },
  unchecked: { label: "Unchecked", dot: "bg-gray-400",    bg: "bg-gray-100 text-gray-500" },
  expired:   { label: "Expired",   dot: "bg-amber-500",   bg: "bg-amber-50 text-amber-700" },
};

export function StatusCell({ acc }: { acc: Account }) {
  const status = acc.status ?? "unchecked";
  const cursor = status === "disabled" && acc.last_error ? "cursor-help" : "";
  const { label, dot, bg } = STATUS_CONFIG[status] ?? STATUS_CONFIG.unchecked;
  return (
    <span
      title={acc.last_error || undefined}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${bg} ${cursor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
