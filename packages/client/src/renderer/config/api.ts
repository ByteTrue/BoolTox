/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

export const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? 'http://localhost:3000';
export const CLIENT_API_TOKEN = import.meta.env.VITE_CLIENT_API_TOKEN ?? '';
export const RELEASE_CHANNEL =
  (import.meta.env.VITE_RELEASE_CHANNEL as string | undefined) ?? 'STABLE';
export const CLIENT_IDENTIFIER = import.meta.env.VITE_CLIENT_IDENTIFIER ?? '';
export const INGEST_SHARED_SECRET = import.meta.env.VITE_INGEST_SHARED_SECRET ?? '';
