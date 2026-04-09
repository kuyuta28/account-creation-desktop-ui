import { SortKey, SortDir } from "../pages/AccountsPage/types";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-flex flex-col gap-[1px] ${active ? "text-brand-600" : "text-gray-300"}`}>
      <svg
        className={`w-3 h-3 transition-transform ${active && dir === "desc" ? "rotate-180" : ""}`}
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M7.247 4.86l-4.796 5.481A.5.5 0 003 11h10a.5.5 0 00.371-.834l-4.796-5.48a.5.5 0 00-.742 0z" />
      </svg>
    </span>
  );
}

interface ThSortableProps {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (c: SortKey) => void;
}

export function ThSortable({ label, col, sortKey, sortDir, onSort }: ThSortableProps) {
  return (
    <th
      onClick={() => onSort(col)}
      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
    >
      {label}
      <SortIcon active={sortKey === col} dir={sortDir} />
    </th>
  );
}
