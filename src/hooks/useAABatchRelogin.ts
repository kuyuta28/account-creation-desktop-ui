import { useRef, useState } from "react";
import { api } from "../api/client";

export interface AABatchReloginProgress {
  total: number;
  done: number;
  success: number;
  failed: number;
}

export interface UseAABatchReloginReturn {
  relogging: boolean;
  reloginProgress: AABatchReloginProgress | null;
  handleBatchRelogin: () => Promise<void>;
  handleStopBatchRelogin: () => Promise<void>;
}

export function useAABatchRelogin(onRefresh?: () => void): UseAABatchReloginReturn {
  const [relogging, setRelogging]               = useState(false);
  const [reloginProgress, setReloginProgress]   = useState<AABatchReloginProgress | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBatchRelogin = async () => {
    if (relogging) return;
    setRelogging(true);
    setReloginProgress(null);

    await api.aaBatchRelogin(5, true);

    pollRef.current = setInterval(async () => {
      const status = await api.aaBatchReloginStatus();
      setReloginProgress({
        total:   status.total,
        done:    status.done,
        success: status.success,
        failed:  status.failed,
      });
      if (!status.running) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setRelogging(false);
        onRefresh?.();
      }
    }, 2000);
  };

  const handleStopBatchRelogin = async () => {
    if (!relogging) return;
    await api.aaBatchReloginCancel();
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setRelogging(false);
    onRefresh?.();
  };

  return { relogging, reloginProgress, handleBatchRelogin, handleStopBatchRelogin };
}
