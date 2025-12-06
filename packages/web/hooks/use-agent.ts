'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AgentDetector,
  AgentClient,
  type AgentInfo,
} from '@booltox/sdk';

/**
 * useAgent Hook
 * 自动检测 Agent 状态并提供 API 客户端
 */
export function useAgent() {
  const [agentInfo, setAgentInfo] = useState<AgentInfo>({
    available: false,
    url: 'http://localhost:9527',
  });
  const [client, setClient] = useState<AgentClient | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const clientUrlRef = useRef<string | null>(null);

  const updateStateFromInfo = useCallback((info: AgentInfo) => {
    setIsDetecting(false);

    setAgentInfo((prev) => {
      if (
        prev.available === info.available &&
        prev.url === info.url &&
        prev.version === info.version &&
        prev.protocol === info.protocol
      ) {
        return prev;
      }
      return info;
    });

    setClient((prev) => {
      if (!info.available) {
        if (prev === null && clientUrlRef.current === null) {
          return prev;
        }
        clientUrlRef.current = null;
        return null;
      }

      if (clientUrlRef.current === info.url && prev) {
        return prev;
      }

      clientUrlRef.current = info.url;
      return new AgentClient({ baseUrl: info.url });
    });
  }, []);

  useEffect(() => {
    // 创建探测器
    const detector = new AgentDetector({
      urls: [
        process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:9527',
      ],
      timeout: 3000,
      autoRetry: true,
      retryInterval: 5000,
    });

    // 监听状态变化
    const unsubscribe = detector.on(updateStateFromInfo);

    // 启动自动检测
    detector.startAutoDetect();

    // 清理
    return () => {
      unsubscribe();
      detector.destroy();
    };
  }, [updateStateFromInfo]);

  // 手动重新检测
  const redetect = useCallback(async () => {
    setIsDetecting(true);
    const detector = new AgentDetector({
      urls: [
        process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:9527',
      ],
      timeout: 3000,
      autoRetry: false,
    });
    const info = await detector.detect();
    updateStateFromInfo(info);
  }, [updateStateFromInfo]);

  return {
    /** Agent 信息 */
    agentInfo,
    /** 是否可用 */
    isAvailable: agentInfo.available,
    /** 是否正在检测 */
    isDetecting,
    /** API 客户端（仅当 Agent 可用时） */
    client,
    /** 手动重新检测 */
    redetect,
  };
}
