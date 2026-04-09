import { useState } from "react";
import { api, Account } from "../../api/client";
import { AddFormState, EditFormState, DEFAULT_ADD_FORM } from "./types";

interface Deps {
  onRefresh: () => void;
  onToast: (msg: string, ok: boolean) => void;
}

// ── Checking ──────────────────────────────────────────────────────────────

function useChecking(onRefresh: Deps["onRefresh"], onToast: Deps["onToast"]) {
  const [checking, setChecking]         = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");

  const checkOne = (acc: Account) => {
    const key = `${acc.service}:${acc.email}`;
    setChecking((s) => new Set(s).add(key));
    api.checkAccount(acc.service, acc.email)
      .then((r) => {
        const msg = r.valid
          ? `✓ Valid${r.quota_pct ? ` · Quota: ${r.quota_pct}` : ""}${r.token_refreshed ? " (refreshed)" : ""}`
          : `✗ Invalid: ${r.last_error || "unknown"}`;
        onToast(msg, r.valid);
        onRefresh();
      })
      .catch((err) => { onToast(`Lỗi: ${String(err)}`, false); onRefresh(); })
      .finally(() => setChecking((s) => { const next = new Set(s); next.delete(key); return next; }));
  };

  const checkAll = (serviceFilter?: string) => {
    setBatchRunning(true);
    setBatchProgress("Starting...");
    const svc = serviceFilter !== "ALL" ? serviceFilter : undefined;
    api.startBatchCheck(svc)
      .then(({ total }) => {
        setBatchProgress(`0 / ${total}`);
        const poll = setInterval(() => {
          api.getBatchCheckStatus().then((s) => {
            setBatchProgress(`${s.checked} / ${s.total} (✓${s.valid} ✗${s.invalid})`);
            if (!s.running) {
              clearInterval(poll);
              setBatchRunning(false);
              onToast(`Check xong: ✓${s.valid} valid, ✗${s.invalid} invalid, ${s.errors} errors`, s.invalid === 0);
              onRefresh();
            }
          }).catch((err) => {
            clearInterval(poll);
            setBatchRunning(false);
            onToast(`Batch check lỗi: ${String(err)}`, false);
          });
        }, 2000);
      })
      .catch((err) => { onToast(`Lỗi: ${String(err)}`, false); setBatchRunning(false); });
  };

  return { checking, batchRunning, batchProgress, checkOne, checkAll };
}

// ── OR actions ────────────────────────────────────────────────────────────

function useORActions(onRefresh: Deps["onRefresh"], onToast: Deps["onToast"]) {
  const [syncingOR, setSyncingOR]           = useState(false);
  const [orPrivacyRunning, setORPrivacy]    = useState(false);
  const [orPrivacyProgress, setORProgress]  = useState("");
  const [cleaningOR, setCleaningOR]         = useState(false);
  const [cleanORProgress, setCleanProgress] = useState("");
  const [fixingPrivacy, setFixingPrivacy]   = useState(false);
  const [fixPrivacyProgress, setFixProgress] = useState("");

  const syncOpenRouterToCliproxy = () => {
    setSyncingOR(true);
    api.syncOpenRouterToCliproxy()
      .then((r) => onToast(
        r.added > 0
          ? `Đã thêm ${r.added} key vào CLIProxy (tổng: ${r.total})`
          : `CLIProxy đã có đủ key (${r.total} key)`,
        true,
      ))
      .catch((err) => onToast(`Sync OR lỗi: ${String(err)}`, false))
      .finally(() => setSyncingOR(false));
  };

  const checkORPrivacy = () => {
    setORPrivacy(true);
    setORProgress("Starting...");
    api.startORPrivacyCheck()
      .then(({ total }) => {
        setORProgress(`0 / ${total}`);
        const poll = setInterval(() => {
          api.getORPrivacyCheckStatus().then((s) => {
            setORProgress(`${s.checked} / ${s.total} (🚫${s.privacy_blocked} ⏭${s.skipped})`);
            if (!s.running) {
              clearInterval(poll);
              setORPrivacy(false);
              onToast(`OR Privacy check xong: ✓${s.ok} OK, 🚫${s.privacy_blocked} block, ⏭${s.skipped} skip`, s.privacy_blocked === 0);
              onRefresh();
            }
          }).catch((err) => { clearInterval(poll); setORPrivacy(false); onToast(`Lỗi: ${String(err)}`, false); });
        }, 2000);
      })
      .catch((err) => { onToast(`Lỗi: ${String(err)}`, false); setORPrivacy(false); });
  };

  const checkAndCleanOR = () => {
    setCleaningOR(true);
    setCleanProgress("Starting...");
    api.startCheckAndCleanOR()
      .then(({ total }) => {
        setCleanProgress(`0 / ${total}`);
        const poll = setInterval(() => {
          api.getCheckAndCleanORStatus().then((s) => {
            setCleanProgress(`${s.checked} / ${s.total}`);
            if (!s.running) {
              clearInterval(poll);
              setCleaningOR(false);
              onToast(`OR clean xong: ✓${s.ok} sống, 🗑${s.deleted_db} xóa DB, 🗑${s.deleted_cliproxy} xóa CLIProxy`, s.deleted_db >= 0);
              onRefresh();
            }
          }).catch((err) => { clearInterval(poll); setCleaningOR(false); onToast(`Lỗi: ${String(err)}`, false); });
        }, 3000);
      })
      .catch((err) => { onToast(`Lỗi: ${String(err)}`, false); setCleaningOR(false); });
  };

  const fixORPrivacy = () => {
    setFixingPrivacy(true);
    setFixProgress("Starting...");
    api.startFixORPrivacy()
      .then(({ total }) => {
        setFixProgress(`0 / ${total}`);
        const poll = setInterval(() => {
          api.getFixORPrivacyStatus().then((s) => {
            setFixProgress(`${s.processed} / ${s.total} (✓${s.ok} ✗${s.failed})`);
            if (!s.running) {
              clearInterval(poll);
              setFixingPrivacy(false);
              onToast(`Fix privacy xong: ✓${s.ok} OK, ✗${s.failed} fail, ⏭${s.skipped} skip`, s.failed === 0);
            }
          }).catch((err) => { clearInterval(poll); setFixingPrivacy(false); onToast(`Lỗi: ${String(err)}`, false); });
        }, 3000);
      })
      .catch((err) => { onToast(`Lỗi: ${String(err)}`, false); setFixingPrivacy(false); });
  };

  return {
    syncingOR, syncOpenRouterToCliproxy,
    orPrivacyRunning, orPrivacyProgress, checkORPrivacy,
    cleaningOR, cleanORProgress, checkAndCleanOR,
    fixingPrivacy, fixPrivacyProgress, fixORPrivacy,
  };
}

// ── Sync / Kling ──────────────────────────────────────────────────────────

function useSyncActions(_onRefresh: Deps["onRefresh"], onToast: Deps["onToast"]) {
  const [syncing, setSyncing]         = useState(false);
  const [syncingAuth, setSyncingAuth] = useState(false);

  const syncProxy = () => {
    setSyncing(true);
    api.syncCliProxy()
      .then((r) => onToast(`Sync done: xóa ${r.deleted} file (${r.bad_count} disabled)`, true))
      .catch((err) => onToast(`Sync lỗi: ${String(err)}`, false))
      .finally(() => setSyncing(false));
  };

  const syncAuth = () => {
    setSyncingAuth(true);
    api.syncAuth()
      .then((r) => onToast(`Đã sync ${r.synced} auth file(s)`, true))
      .catch((err) => onToast(`Sync auth lỗi: ${String(err)}`, false))
      .finally(() => setSyncingAuth(false));
  };

  const launchKlingSession = () => {
    api.launchKlingSession()
      .then(() => onToast("Browser Kling đã mở — đăng nhập Google để lưu session", true))
      .catch((err) => onToast(`Kling session lỗi: ${String(err)}`, false));
  };

  return { syncing, syncProxy, syncingAuth, syncAuth, launchKlingSession };
}

// ── Delete disabled ───────────────────────────────────────────────────────

function useDeleteDisabled(onRefresh: Deps["onRefresh"], onToast: Deps["onToast"]) {
  const [deletingDisabled, setDeletingDisabled] = useState(false);

  const deleteDisabled = (serviceFilter: string) => {
    setDeletingDisabled(true);
    const svc = serviceFilter !== "ALL" ? serviceFilter : undefined;
    api.deleteDisabledAccounts(svc)
      .then((r) => {
        onToast(`Đã xóa ${r.deleted} tài khoản disabled`, true);
        onRefresh();
      })
      .catch((err) => onToast(`Lỗi: ${String(err)}`, false))
      .finally(() => setDeletingDisabled(false));
  };

  return { deletingDisabled, deleteDisabled };
}

// ── CRUD (add / edit / delete / toggleDisabled) ───────────────────────────

function useCRUD(onRefresh: Deps["onRefresh"], onToast: Deps["onToast"]) {
  const [addForm, setAddForm]   = useState<AddFormState>(DEFAULT_ADD_FORM);
  const [addError, setAddError] = useState("");
  const [adding, setAdding]     = useState(false);

  const [editAcc, setEditAcc]   = useState<Account | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ api_key: "", password: "", totp_secret: "", app_password: "" });
  const [editError, setEditError] = useState("");
  const [editing, setEditing]   = useState(false);

  const resetAddForm = () => {
    setAddForm(DEFAULT_ADD_FORM);
    setAddError("");
  };

  const handleAddAccount = (onDone: () => void) => {
    if (!addForm.service || !addForm.email) { setAddError("Service và Email bắt buộc"); return; }
    setAdding(true);
    setAddError("");
    api.addAccount(
      addForm.service.toUpperCase(),
      addForm.email,
      addForm.api_key,
      addForm.password,
      addForm.totp_secret,
      addForm.app_password,
      addForm.source_email,
    )
      .then(() => {
        onToast(`Đã thêm ${addForm.email}`, true);
        resetAddForm();
        onDone();
        onRefresh();
      })
      .catch((err) => setAddError(String(err)))
      .finally(() => setAdding(false));
  };

  const openEdit = (acc: Account) => {
    setEditAcc(acc);
    setEditForm({
      api_key:      acc.api_key      ?? "",
      password:     acc.password     ?? "",
      totp_secret:  acc.totp_secret  ?? "",
      app_password: acc.app_password ?? "",
    });
    setEditError("");
  };

  const handleEditAccount = () => {
    if (!editAcc) return;
    setEditing(true);
    setEditError("");
    const patch: Record<string, string> = {};
    if (editForm.api_key      !== (editAcc.api_key      ?? "")) patch.api_key      = editForm.api_key;
    if (editForm.password     !== (editAcc.password     ?? "")) patch.password     = editForm.password;
    if (editForm.totp_secret  !== (editAcc.totp_secret  ?? "")) patch.totp_secret  = editForm.totp_secret;
    if (editForm.app_password !== (editAcc.app_password ?? "")) patch.app_password = editForm.app_password;
    if (Object.keys(patch).length === 0) { setEditAcc(null); setEditing(false); return; }
    api.updateAccount(editAcc.service, editAcc.email, patch)
      .then(() => {
        onToast(`Đã cập nhật ${editAcc.email}`, true);
        setEditAcc(null);
        onRefresh();
      })
      .catch((err) => setEditError(String(err)))
      .finally(() => setEditing(false));
  };

  const toggleDisabled = (acc: Account) => {
    api.updateAccount(acc.service, acc.email, { disabled: !acc.disabled })
      .then(onRefresh)
      .catch((err) => onToast(`Update lỗi: ${String(err)}`, false));
  };

  const remove = async (acc: Account) => {
    const ok = await confirm(`Xóa ${acc.email}?`);
    if (!ok) return;
    api.deleteAccount(acc.service, acc.email)
      .then(onRefresh)
      .catch((err) => onToast(`Xóa lỗi: ${String(err)}`, false));
  };

  return {
    addForm, setAddForm, addError, adding, handleAddAccount, resetAddForm,
    editAcc, setEditAcc, editForm, setEditForm, editError, editing, openEdit, handleEditAccount,
    toggleDisabled, remove,
  };
}

// ── OR Key Detail ─────────────────────────────────────────────────────────

function useKeyDetail(_onToast: Deps["onToast"]) {
  const [detailAcc, setDetailAcc]     = useState<Account | null>(null);
  const [detailData, setDetailData]   = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const openDetail = (acc: Account) => {
    if (!acc.api_key) return;
    setDetailAcc(acc);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(true);
    api.getKeyDetail(acc.service, acc.api_key)
      .then(setDetailData)
      .catch((err) => setDetailError(String(err)))
      .finally(() => setDetailLoading(false));
  };

  return { detailAcc, setDetailAcc, detailData, detailLoading, detailError, openDetail };
}

// ── Composed hook ─────────────────────────────────────────────────────────

export function useAccountActions({ onRefresh, onToast }: Deps) {
  return {
    ...useChecking(onRefresh, onToast),
    ...useORActions(onRefresh, onToast),
    ...useSyncActions(onRefresh, onToast),
    ...useDeleteDisabled(onRefresh, onToast),
    ...useCRUD(onRefresh, onToast),
    ...useKeyDetail(onToast),
  };
}
