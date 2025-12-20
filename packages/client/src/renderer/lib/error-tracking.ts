/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { logger } from '@/lib/logger';
import { formatError } from '@/lib/error-handler';
import { enqueueLogRecord, flushLogsSync } from '@/lib/log-ingest-service';

let initialized = false;

const reportError = (error: unknown, context?: Record<string, unknown>) => {
  const formatted = formatError(error, context);

  enqueueLogRecord({
    level: 'ERROR',
    namespace: 'GlobalError',
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
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', event => {
    reportError(event.error ?? event.message, {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    reportError(event.reason, {
      source: 'unhandledrejection',
    });
  });

  window.addEventListener('beforeunload', () => {
    flushLogsSync();
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
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

  installGlobalHandlers();
  logger.info('Error tracking initialized');
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  reportError(error, context);
};
