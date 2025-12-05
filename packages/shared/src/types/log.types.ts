/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Client log
 */
export interface ClientLog {
  id: string;
  clientIdentifier: string;
  level: LogLevel;
  namespace: string;
  message: string;
  args: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  appVersion: string;
  platform: string | null;
  timestamp: string;
  receivedAt: string;
}

/**
 * Log ingest request
 */
export interface LogIngestRequest {
  clientIdentifier: string;
  payload: string; // Base64 encoded log data
  checksum?: string; // SHA-256 checksum
  metadata: {
    appVersion: string;
    mode?: string;
    batchSize: number;
    userAgent?: string;
    locale?: string;
    timestamp: number;
  };
}

/**
 * Log query params
 */
export interface LogQueryParams {
  clientIdentifier?: string;
  level?: LogLevel;
  namespace?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Decoded log entry (before storing to DB)
 */
export interface DecodedLogEntry {
  level: LogLevel;
  namespace: string;
  message: string;
  args?: unknown[];
  context?: Record<string, unknown>;
  timestamp: number;
}