import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAACheckSessions } from "../../hooks/useAACheckSessions";
import type { Account } from "./types";

export type AccountStatus = "valid" | "expired" | "unknown";

export function useAAAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [openingBrowser, setOpeningBrowser] = useState(false);
  // Per-account session status: email → "valid" | "expired" | "unknown".
  // Populated by the AA bulk check endpoint or by selecting an account.
  const [statuses, setStatuses] = useState<Record<string, AccountStatus>>({});

  const refreshAccounts = () =>
    api.getAccounts("ARTIFICIALANALYSIS", 1, 1000).then((resp) => {
      const accs = resp.accounts ?? [];
      const withSession = accs.filter((a) => a.session_state && !a.disabled);
      setAccounts(withSession);
      // Seed trạng thái từ check_status trong DB (valid/expired) — không để
      // toàn bộ unknown chờ live probe. Live probe/probeAll sẽ overlay đè sau.
      const seeded: Record<string, AccountStatus> = {};
      for (const a of withSession) {
        const cs = a.check_status?.toLowerCase();
        seeded[a.email] = cs === "valid" ? "valid" : cs === "expired" ? "expired" : "unknown";
      }
      setStatuses(seeded);
      if (withSession.length > 0 && !selectedEmail) setSelectedEmail(withSession[0].email);
    });

  // After bulk check completes, refetch accounts so DB-side check_status
  // ("valid" / "expired") is reflected in the UI.
  const { checkingAll, checkProgress, handleCheckAllSessions, handleStopCheckSessions } =
    useAACheckSessions(refreshAccounts);

  // Probe the currently selected account for live session status.
  // Updates the `statuses` map so the UI can show a ✓/⚠ badge per row.
  const probeStatus = async (email: string): Promise<AccountStatus> => {
    try {
      await api.aaGetSession(email);
      setStatuses((prev) => ({ ...prev, [email]: "valid" }));
      return "valid";
    } catch {
      setStatuses((prev) => ({ ...prev, [email]: "expired" }));
      return "expired";
    }
  };

  // Probe a batch of accounts in parallel — cheap because each request is
  // small and AA rejects expired sessions in <1s.
  const probeAll = async (emails: string[]) => {
    await Promise.all(emails.map((e) => probeStatus(e)));
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  // After accounts load, probe a small batch (first 8) so the dropdown
  // shows a status badge right away — without waiting for the full bulk check.
  useEffect(() => {
    if (accounts.length === 0) return;
    const sample = accounts.slice(0, 8).map((a) => a.email);
    probeAll(sample);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length]);

  // When user picks an account, fetch its live balance + status.
  useEffect(() => {
    if (!selectedEmail) return;
    setBalance(null);
    setSessionError("");
    api
      .aaGetSession(selectedEmail)
      .then((s) => {
        setBalance(s.org.balance);
        setStatuses((prev) => ({ ...prev, [selectedEmail]: "valid" }));
      })
      .catch((e) => {
        setSessionError(String(e));
        setStatuses((prev) => ({ ...prev, [selectedEmail]: "expired" }));
      });
  }, [selectedEmail]);

  const handleOpenBrowser = async () => {
    if (!selectedEmail || openingBrowser) return;
    setOpeningBrowser(true);
    try {
      await api.aaRelogin(selectedEmail);
      setSessionError("");
      setStatuses((prev) => ({ ...prev, [selectedEmail]: "valid" }));
      const s = await api.aaGetSession(selectedEmail);
      setBalance(s.org.balance);
    } finally {
      setOpeningBrowser(false);
    }
  };

  return {
    accounts, selectedEmail, setSelectedEmail,
    balance, sessionError, openingBrowser, handleOpenBrowser,
    checkingAll, checkProgress, handleCheckAllSessions, handleStopCheckSessions,
    statuses,
  };
}
