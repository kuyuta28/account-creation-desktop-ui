import { useRef, useState } from "react";
import { api } from "../api/client";

export interface AACheckProgress {
  total: number;
  checked: number;
  valid: number;
  expired: number;
  errors: number;
}

export interface UseAACheckSessionsReturn {
  checkingAll: boolean;
  checkProgress: AACheckProgress | null;
  handleCheckAllSessions: () => Promise<void>;
  handleStopCheckSessions: () => Promise<void>;
}

export function useAACheckSessions(onRefresh?: () => void): UseAACheckSessionsReturn {
  const [checkingAll, setCheckingAll]       = useState(false);
  const [checkProgress, setCheckProgress]   = useState<AACheckProgress | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCheckAllSessions = async () => {
    if (checkingAll) return;
    setCheckingAll(true);
    setCheckProgress(null);

    await api.aaCheckSessions();

    pollRef.current = setInterval(async () => {
      const status = await api.aaCheckSessionsStatus();
      setCheckProgress({
        total:   status.total,
        checked: status.checked,
        valid:   status.valid,
        expired: status.expired,
        errors:  status.errors,
      });
      if (!status.running) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setCheckingAll(false);
        onRefresh?.();
      }
    }, 1000);
  };

  const handleStopCheckSessions = async () => {
    if (!checkingAll) return;
    await api.aaCheckSessionsCancel();
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setCheckingAll(false);
    onRefresh?.();
  };

  return { checkingAll, checkProgress, handleCheckAllSessions, handleStopCheckSessions };
}
