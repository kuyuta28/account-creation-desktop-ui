import { AddFormState } from "../types";
import { getServiceFields, AddField } from "../../../constants/accounts";

interface Props {
  services: string[];
  form: AddFormState;
  setForm: (f: (prev: AddFormState) => AddFormState) => void;
  error: string;
  adding: boolean;
  onSubmit: (onDone: () => void) => void;
  onClose: () => void;
}

export default function AddModal({ services, form, setForm, error, adding, onSubmit, onClose }: Props) {
  const fields = new Set<AddField>(getServiceFields(form.service));
  const show = (f: AddField) => !form.service || fields.has(f);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
            <select
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">— Chọn service —</option>
              {services.filter((s) => s !== "ALL").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {show("api_key") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
              <input
                type="text"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                placeholder="sk-..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          {show("password") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          {show("totp_secret") && (
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
          )}

          {show("app_password") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                App Password <span className="text-gray-400 font-normal">(IMAP)</span>
              </label>
              <input
                type="text"
                value={form.app_password}
                onChange={(e) => setForm((f) => ({ ...f, app_password: e.target.value.replace(/\s/g, "") }))}
                placeholder="hbjdivqfpjqjirnx"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          {show("source_email") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Source Email <span className="text-gray-400 font-normal">(base Gmail nếu là alias)</span>
              </label>
              <input
                type="text"
                value={form.source_email}
                onChange={(e) => setForm((f) => ({ ...f, source_email: e.target.value }))}
                placeholder="base@gmail.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={() => onSubmit(onClose)} disabled={adding} className="btn-primary text-sm">
            {adding ? "Adding..." : "Add Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
