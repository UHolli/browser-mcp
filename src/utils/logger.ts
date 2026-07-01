/**
 * Structured logger that writes to stderr.
 * MCP uses stdout for the transport protocol, so stderr is safe for logs.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env["LOG_LEVEL"]?.toLowerCase();
  if (env === "debug" || env === "info" || env === "warn" || env === "error") {
    return env;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

function writeLog(level: LogLevel, message: string, error?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const formatted = formatMessage(level, message);
  if (error !== undefined) {
    console.error(formatted, error);
  } else {
    console.error(formatted);
  }
}

export const logger = {
  debug(message: string): void {
    writeLog("debug", message);
  },
  info(message: string): void {
    writeLog("info", message);
  },
  warn(message: string): void {
    writeLog("warn", message);
  },
  error(message: string, error?: unknown): void {
    writeLog("error", message, error);
  },
};
