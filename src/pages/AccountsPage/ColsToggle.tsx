import { useState } from "react";
import { ALL_COLS, ColKey } from "./types";

interface Props {
  visibleCols: Set<ColKey>;
  onToggle: (k: ColKey) => void;
}

export default function ColsToggle({ visibleCols, onToggle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary text-xs py-2 gap-1"
        title="Toggle columns"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Cols
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Hiện cột</p>
            {ALL_COLS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleCols.has(key)}
                  onChange={() => onToggle(key)}
                  className="accent-violet-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
