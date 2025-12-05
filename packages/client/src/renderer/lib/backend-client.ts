/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { ADMIN_API_BASE, CLIENT_API_TOKEN } from "@/config/api";

type RequestOptions = {
  method?: string;
  body?: string | null;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = init.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && method !== "HEAD" && init.body !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  }
  if (CLIENT_API_TOKEN) {
    headers.set("x-client-token", CLIENT_API_TOKEN);
  }

  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `请求失败: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
