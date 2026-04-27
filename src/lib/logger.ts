/**
 * Logger - Tự động ghi log ra file trong Tauri
 * File: %APPDATA%/com.tauri.dev/fe.log
 */

import { writeTextFile, BaseDirectory, exists, create } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = typeof LOG_LEVELS[number];

class Logger {
  private logQueue: string[] = [];
  private logFile = "fe.log";
  private initialized = false;
  private flushInterval = 1000; // Flush mỗi 1 giây

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Only use Tauri fs in production (Tauri context)
      // In dev mode, just log to console
      this.initialized = true;

      // Tự động flush định kỳ (console only in dev)
      setInterval(() => this.flush(), this.flushInterval);
    } catch (e) {
      console.error("[Logger] Init failed:", e);
    }
  }

  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const line = this.format(level, message, data);

    // Luôn ghi ra console
    const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    consoleFn(line);

    // Thêm vào queue để flush ra file
    this.logQueue.push(line);
  }

  private async flush() {
    if (!this.initialized || this.logQueue.length === 0) return;

    const lines = this.logQueue.splice(0, this.logQueue.length);
    // In dev mode, just clear the queue (console.log already output)
    if (typeof window === "undefined" || !("__TAURI__" in window)) {
      return;
    }

    const content = lines.join("\n") + "\n";
    try {
      await writeTextFile(this.logFile, content, {
        dir: BaseDirectory.AppData,
        append: true,
      });
    } catch (e) {
      // Silently fail - dev mode doesn't need file logs
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  // Force flush ngay lập tức
  async flushNow() {
    await this.flush();
  }

  // Lấy đường dẫn file log
  async getLogPath(): Promise<string> {
    const appData = await appDataDir();
    return `${appData}/${this.logFile}`;
  }
}

// Singleton instance
export const logger = new Logger();

// Error handlers
export function initErrorHandler() {
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

  // Log mỗi 5 giây để đảm bảo flush
  setInterval(() => logger.flushNow(), 5000);

  logger.info("Error handlers initialized");
}

export default logger;
