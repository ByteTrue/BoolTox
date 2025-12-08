"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AgentDetector, AgentClient, type AgentInfo } from "@booltox/sdk";

type AgentState = {
  info: AgentInfo;
  client: AgentClient | null;
  isDetecting: boolean;
};

const DEFAULT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:9527";

// 单例状态，避免多处组件重复创建探测器与轮询
let state: AgentState = {
  info: { available: false, url: DEFAULT_URL },
  client: null,
  isDetecting: true,
};

let detector: AgentDetector | null = null;
let started = false;
let clientUrl: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function updateState(nextInfo: AgentInfo) {
  const nextClient = nextInfo.available
    ? (() => {
        if (clientUrl === nextInfo.url && state.client) return state.client;
        clientUrl = nextInfo.url;
        return new AgentClient({ baseUrl: nextInfo.url });
      })()
    : null;

  state = {
    info: nextInfo,
    isDetecting: false,
    client: nextClient,
  };

  if (!nextInfo.available) {
    clientUrl = null;
  }
  notify();
}

function ensureDetector() {
  if (detector) return detector;
  detector = new AgentDetector({
    urls: [DEFAULT_URL],
    timeout: 3000,
    autoRetry: true,
    retryInterval: 5000,
  });
  detector.on((info) => updateState(info));
  return detector;
}

function startDetectOnce() {
  if (started) return;
  started = true;
  ensureDetector().startAutoDetect();
}

/**
 * useAgent Hook
 * 自动检测 Agent 状态并提供 API 客户端（单例）
 */
export function useAgent() {
  // 订阅单例状态，避免重复创建 AgentDetector
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      startDetectOnce();
      return () => listeners.delete(listener);
    },
    () => state,
    // getServerSnapshot - SSR 时返回完整的初始状态
    () => ({
      isDetecting: true,
      info: { available: false, version: null, error: null },
      client: null,
    })
  );

  const redetect = useCallback(async () => {
    const manualDetector = new AgentDetector({
      urls: [DEFAULT_URL],
      timeout: 3000,
      autoRetry: false,
    });
    updateState(await manualDetector.detect());
    manualDetector.destroy();
  }, []);

  // 确保首次挂载也能触发检测（在 SSR 环境下仅运行于客户端）
  useEffect(() => {
    startDetectOnce();
  }, []);

  return {
    agentInfo: snapshot.info,
    isAvailable: snapshot.info.available,
    isDetecting: snapshot.isDetecting,
    client: snapshot.client,
    redetect,
  };
}
