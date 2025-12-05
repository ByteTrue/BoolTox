'use client';

import { useState, useEffect, useCallback } from 'react';
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
    detector.on((info) => {
      setAgentInfo(info);
      setIsDetecting(false);

      // 创建或销毁客户端
      if (info.available && !client) {
        setClient(new AgentClient({ baseUrl: info.url }));
      } else if (!info.available && client) {
        setClient(null);
      }
    });

    // 启动自动检测
    detector.startAutoDetect();

    // 清理
    return () => {
      detector.destroy();
    };
  }, []);

  // 手动重新检测
  const redetect = useCallback(async () => {
    setIsDetecting(true);
    const detector = new AgentDetector({ autoRetry: false });
    const info = await detector.detect();
    setAgentInfo(info);
    setIsDetecting(false);

    if (info.available) {
      setClient(new AgentClient({ baseUrl: info.url }));
    }
  }, []);

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
