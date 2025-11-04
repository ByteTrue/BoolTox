import { LogLevel, registerLogSink, type LogEvent } from "@/lib/logger";
import { formatError } from "@/lib/error-handler";
import { enqueueLogRecord, flushLogsSync } from "@/lib/log-ingest-service";

let initialized = false;

const levelName = (level: LogLevel) => {
  switch (level) {
    case LogLevel.DEBUG:
      return "DEBUG";
    case LogLevel.INFO:
      return "INFO";
    case LogLevel.WARN:
      return "WARN";
    case LogLevel.ERROR:
      return "ERROR";
    case LogLevel.NONE:
      return "NONE";
    default:
      return "INFO";
  }
};

const handleLogEvent = (event: LogEvent) => {
  if (event.level < LogLevel.WARN) {
    return;
  }

  enqueueLogRecord({
    level: levelName(event.level),
    namespace: event.namespace,
    message: event.message,
    args: event.args,
    timestamp: event.timestamp,
  });
};

const reportError = (error: unknown, context?: Record<string, unknown>) => {
  const formatted = formatError(error, context);

  enqueueLogRecord({
    level: "ERROR",
    namespace: "GlobalError",
    message: formatted.message,
    timestamp: formatted.timestamp,
    context: {
      ...context,
      code: formatted.code,
      type: formatted.type,
      stack: formatted.stack,
    },
  });
};

const installGlobalHandlers = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, {
      source: "window.onerror",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, {
      source: "unhandledrejection",
    });
  });

  window.addEventListener("beforeunload", () => {
    flushLogsSync();
  });

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushLogsSync();
      }
    });
  }
};

export const initErrorTracking = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  registerLogSink(handleLogEvent);
  installGlobalHandlers();
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  reportError(error, context);
};
