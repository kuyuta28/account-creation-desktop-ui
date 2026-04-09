import { Account } from "../../../api/client";
import { EditFormState } from "../types";
import { isGmailMailbox } from "../../../constants/accounts";

interface Props {
  acc: Account;
  form: EditFormState;
  setForm: (f: (prev: EditFormState) => EditFormState) => void;
  error: string;
  editing: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export default function EditModal({ acc, form, setForm, error, editing, onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Account</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[340px]" title={acc.email}>
              {acc.service} · {acc.email}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input
              type="text"
              value={form.api_key}
              onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              placeholder="sk-... / aa_..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {acc.service === "GMAIL" && isGmailMailbox(acc.email) && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  TOTP Secret <span className="text-gray-400 font-normal">(base32)</span>
                </label>
                <input
                  type="text"
                  value={form.totp_secret}
                  onChange={(e) => setForm((f) => ({ ...f, totp_secret: e.target.value.replace(/\s/g, "").toUpperCase() }))}
                  placeholder="B5ALQJP5LX2M..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  App Password <span className="text-gray-400 font-normal">(IMAP — myaccount.google.com/apppasswords)</span>
                </label>
                <input
                  type="text"
                  value={form.app_password}
                  onChange={(e) => setForm((f) => ({ ...f, app_password: e.target.value.replace(/\s/g, "") }))}
                  placeholder="hbjdivqfpjqjirnx"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={onSubmit} disabled={editing} className="btn-primary text-sm">
            {editing ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
