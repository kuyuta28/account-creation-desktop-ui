import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAACheckSessions } from "../../hooks/useAACheckSessions";
import type { Account } from "./types";

export function useAAAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [openingBrowser, setOpeningBrowser] = useState(false);

  const refreshAccounts = () =>
    api.getAccounts("ARTIFICIALANALYSIS").then((accs) => {
      const withSession = accs.filter((a) => a.session_state && !a.disabled);
      setAccounts(withSession);
      if (withSession.length > 0 && !selectedEmail) setSelectedEmail(withSession[0].email);
    });

  const { checkingAll, checkProgress, handleCheckAllSessions, handleStopCheckSessions } =
    useAACheckSessions(refreshAccounts);

  useEffect(() => {
    refreshAccounts();
  }, []);

  useEffect(() => {
    if (!selectedEmail) return;
    setBalance(null);
    setSessionError("");
    api
      .aaGetSession(selectedEmail)
      .then((s) => setBalance(s.org.balance))
      .catch((e) => setSessionError(String(e)));
  }, [selectedEmail]);

  const handleOpenBrowser = async () => {
    if (!selectedEmail || openingBrowser) return;
    setOpeningBrowser(true);
    try {
      await api.aaRelogin(selectedEmail);
      setSessionError("");
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
  };
}
