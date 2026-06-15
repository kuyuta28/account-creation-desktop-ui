/**
 * Logger — browser-only logging.
 *
 * In the Tauri desktop app logs were persisted to disk; in the web app we
 * only log to the browser console. Error handlers still capture unhandled
 * errors and promise rejections.
 */

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function _format(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

function _log(level: LogLevel, message: string, data?: unknown): void {
  const line = _format(level, message, data);
  const consoleFn =
    level === "error" ? console.error :
    level === "warn" ? console.warn :
    console.log;
  consoleFn(line);
}

export const logger = {
  debug: (message: string, data?: unknown) => _log("debug", message, data),
  info: (message: string, data?: unknown) => _log("info", message, data),
  warn: (message: string, data?: unknown) => _log("warn", message, data),
  error: (message: string, data?: unknown) => _log("error", message, data),
  flushNow: async () => { /* no-op in browser */ },
};

export function initErrorHandler(): void {
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason?.stack || String(event.reason),
    });
  });

  logger.info("Error handlers initialized");
}

export default logger;
