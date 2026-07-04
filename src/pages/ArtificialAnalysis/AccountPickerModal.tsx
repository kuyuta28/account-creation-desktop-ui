import { useMemo, useState } from "react";
import type { AccountStatus } from "./useAAAccounts";
import { accountStatusColor, accountStatusLabel } from "./accountStatus";

type Props = {
  open: boolean;
  accounts: { email: string }[];
  statuses: Record<string, AccountStatus>;
  selectedEmail: string;
  onPick: (email: string) => void;
  onClose: () => void;
};

export function AccountPickerModal({
  open, accounts, statuses, selectedEmail, onPick, onClose,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter((a) => a.email.toLowerCase().includes(needle));
  }, [accounts, q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search account..."
            className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          <span className="text-xs text-gray-400 font-mono shrink-0">
            {filtered.length}/{accounts.length}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2"
            title="Đóng"
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-12">
              Không tìm thấy account phù hợp
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {filtered.map((a) => {
                const isSel = a.email === selectedEmail;
                return (
                  <button
                    key={a.email}
                    onClick={() => onPick(a.email)}
                    title={a.email}
                    className={`text-left text-xs px-2 py-1.5 rounded-md border truncate transition-colors ${
                      isSel
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${accountStatusColor(a.email, statuses)}`}
                  >
                    {accountStatusLabel(a.email, statuses)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
