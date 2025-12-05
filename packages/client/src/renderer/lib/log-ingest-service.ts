/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { APP_VERSION } from "@/config/app-info";
import { CLIENT_IDENTIFIER, INGEST_SHARED_SECRET } from "@/config/api";
import { apiFetch } from "@/lib/backend-client";

export interface LogRecord {
  level: string;
  namespace: string;
  message: string;
  args?: unknown[];
  timestamp: number;
  context?: Record<string, unknown>;
}

const logQueue: LogRecord[] = [];
const MAX_QUEUE_SIZE = 200;
const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5_000;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;

const runtimeMode = typeof import.meta !== "undefined" ? import.meta.env.MODE : undefined;

const shouldUpload = () => CLIENT_IDENTIFIER.length > 0;

const sanitizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    const result: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      if (typeof val === "function" || typeof val === "symbol") {
        continue;
      }
      result[key] = sanitizeValue(val);
    }
    return result;
  }

  return String(value);
};

const sanitizeRecord = (record: LogRecord): LogRecord => {
  const sanitized: LogRecord = {
    level: record.level,
    namespace: record.namespace,
    message: record.message,
    timestamp: record.timestamp,
  };

  if (record.args) {
    sanitized.args = record.args.map((item) => sanitizeValue(item));
  }

  if (record.context) {
    sanitized.context = sanitizeValue(record.context) as Record<string, unknown>;
  }

  return sanitized;
};

const encodeBase64 = (value: string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  throw new Error("Base64 encoding not supported");
};

const computeChecksum = async (value: string) => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return undefined;
};

const scheduleFlush = (delay = FLUSH_INTERVAL) => {
  if (!shouldUpload() || logQueue.length === 0 || flushTimer !== null) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushLogs();
  }, delay);
};

const buildMetadata = (batchSize: number) => ({
  appVersion: APP_VERSION,
  mode: runtimeMode,
  batchSize,
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  locale: typeof navigator !== "undefined" ? navigator.language : undefined,
  timestamp: Date.now(),
});

export const enqueueLogRecord = (record: LogRecord) => {
  if (!shouldUpload()) {
    return;
  }

  const entry = sanitizeRecord(record);

  logQueue.push(entry);

  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue.splice(0, logQueue.length - MAX_QUEUE_SIZE);
  }

  scheduleFlush();
};

export const flushLogs = async () => {
  if (!shouldUpload() || inflight || logQueue.length === 0) {
    return;
  }

  inflight = true;

  const batch = logQueue.splice(0, Math.min(logQueue.length, MAX_BATCH_SIZE));
  const bodyObject = { logs: batch };
  const bodyString = JSON.stringify(bodyObject);

  try {
    const payload = encodeBase64(bodyString);
    const checksum = await computeChecksum(bodyString);
    const headers: Record<string, string> = {};

    if (INGEST_SHARED_SECRET) {
      headers["x-ingest-secret"] = INGEST_SHARED_SECRET;
    }

    await apiFetch<unknown>("/api/logs/ingest", {
      method: "POST",
      body: JSON.stringify({
        clientIdentifier: CLIENT_IDENTIFIER,
        payload,
        checksum,
        metadata: buildMetadata(batch.length),
      }),
      headers,
    });
  } catch {
    logQueue.unshift(...batch);
    scheduleFlush(FLUSH_INTERVAL * 2);
  } finally {
    inflight = false;

    if (logQueue.length > 0) {
      scheduleFlush();
    }
  }
};

export const flushLogsSync = () => {
  if (!shouldUpload() || logQueue.length === 0) {
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  void flushLogs();
};
