type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

const shouldLog = (level: LogLevel) => levels[level] >= levels[currentLevel];

const safeMessage = (message: string) => message.replace(/\s+/g, " ");

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("debug")) {
      console.debug(`[debug] ${safeMessage(message)}`, meta ?? "");
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("info")) {
      console.info(`[info] ${safeMessage(message)}`, meta ?? "");
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("warn")) {
      console.warn(`[warn] ${safeMessage(message)}`, meta ?? "");
    }
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("error")) {
      console.error(`[error] ${safeMessage(message)}`, meta ?? "");
    }
  },
};
