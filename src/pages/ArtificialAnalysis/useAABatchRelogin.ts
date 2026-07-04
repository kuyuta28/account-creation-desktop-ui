import { useCallback, useEffect, useRef, useState } from "react";
import { api, wsAABatchReloginLogs } from "../../api/client";

export interface BatchLogEntry {
  email: string;
  msg: string;
  ts: number;
}

export interface BatchReloginProgress {
  total: number;
  done: number;
  success: number;
  failed: number;
  workers: number;
}

interface UseAABatchReloginReturn {
  running: boolean;
  progress: BatchReloginProgress | null;
  logs: BatchLogEntry[];
  results: { email: string; status: string; error: string }[];
  handleStart: (workers: number, onlyExpired: boolean) => Promise<void>;
  handleStop: () => Promise<void>;
}

export function useAABatchRelogin(): UseAABatchReloginReturn {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<BatchReloginProgress | null>(null);
  const [logs, setLogs] = useState<BatchLogEntry[]>([]);
  const [results, setResults] = useState<{ email: string; status: string; error: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const start = useCallback(async (workers: number, onlyExpired: boolean) => {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setResults([]);
    setProgress(null);

    try {
      await api.aaBatchRelogin(workers, onlyExpired);
    } catch (e) {
      setRunning(false);
      throw e;
    }

    // WS: realtime per-account logs
    const ws = wsAABatchReloginLogs();
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      // "__END__" là string frame (không phải JSON) → JSON.parse throw → catch bỏ qua.
      try {
        const data = JSON.parse(ev.data);
        if (data.email && data.msg) {
          setLogs((prev) => [...prev, { email: data.email, msg: data.msg, ts: Date.now() }]);
        }
      } catch {
        /* non-JSON frame (vd __END__) — ignore */
      }
    };
    ws.onerror = () => { /* status poll still drives terminal state */ };

    // Poll status for counters + terminal detection
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.aaBatchReloginStatus();
        setProgress({ total: s.total, done: s.done, success: s.success, failed: s.failed, workers: s.workers });
        setResults(s.results);
        if (!s.running) {
          stopPolling();
          setRunning(false);
        }
      } catch {
        /* transient — keep polling */
      }
    }, 1000);
  }, [running, stopPolling]);

  const stop = useCallback(async () => {
    try {
      await api.aaBatchReloginCancel();
    } catch {
      /* backend may already be done — reset regardless */
    }
    // Backend cancel chỉ ngăn account mới; account đang chạy phải xong.
    // Poll tiếp tục đến khi running=false. Nếu backend đã xong, reset ngay.
    try {
      const s = await api.aaBatchReloginStatus();
      if (!s.running) {
        stopPolling();
        setRunning(false);
      }
    } catch {
      stopPolling();
      setRunning(false);
    }
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { running, progress, logs, results, handleStart: start, handleStop: stop };
}
