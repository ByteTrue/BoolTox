/**
 * Agent 自动探测模块
 * 检测本地 Agent 是否运行
 */

export interface AgentInfo {
  available: boolean;
  url: string;
  version?: string;
  protocol?: string;
}

export interface AgentDetectorOptions {
  /**
   * 候选 Agent URL 列表
   * @default ['http://localhost:9527']
   */
  urls?: string[];

  /**
   * 超时时间（毫秒）
   * @default 3000
   */
  timeout?: number;

  /**
   * 是否自动重试
   * @default true
   */
  autoRetry?: boolean;

  /**
   * 重试间隔（毫秒）
   * @default 5000
   */
  retryInterval?: number;
}

/**
 * Agent 探测器类
 */
export class AgentDetector {
  private options: Required<AgentDetectorOptions>;
  private retryTimer?: ReturnType<typeof setInterval>;
  private listeners: Array<(info: AgentInfo) => void> = [];

  constructor(options: AgentDetectorOptions = {}) {
    this.options = {
      urls: options.urls || ['http://localhost:9527'],
      timeout: options.timeout || 3000,
      autoRetry: options.autoRetry !== false,
      retryInterval: options.retryInterval || 5000,
    };
  }

  /**
   * 检测 Agent 是否可用
   */
  async detect(): Promise<AgentInfo> {
    // 尝试每个候选 URL
    for (const url of this.options.urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        const response = await fetch(`${url}/api/health`, {
          signal: controller.signal,
          mode: 'cors',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const info: AgentInfo = {
            available: true,
            url,
            version: data.version,
            protocol: data.protocol,
          };

          // 通知监听器
          this.notifyListeners(info);
          return info;
        }
      } catch (error) {
        // 继续尝试下一个 URL
        continue;
      }
    }

    // 所有 URL 都失败
    const info: AgentInfo = {
      available: false,
      url: this.options.urls[0],
    };

    this.notifyListeners(info);
    return info;
  }

  /**
   * 启动自动检测（轮询）
   */
  startAutoDetect(callback?: (info: AgentInfo) => void): void {
    if (callback) {
      this.on(callback);
    }

    // 立即检测一次
    this.detect();

    // 启动定时检测
    if (this.options.autoRetry && !this.retryTimer) {
      this.retryTimer = setInterval(() => {
        this.detect();
      }, this.options.retryInterval);
    }
  }

  /**
   * 停止自动检测
   */
  stopAutoDetect(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  /**
   * 监听 Agent 状态变化
   */
  on(listener: (info: AgentInfo) => void): () => void {
    this.listeners.push(listener);
    return () => this.off(listener);
  }

  /**
   * 取消监听
   */
  off(listener: (info: AgentInfo) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(info: AgentInfo): void {
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (error) {
        console.error('Error in AgentDetector listener:', error);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopAutoDetect();
    this.listeners = [];
  }
}

/**
 * 快速检测（单次）
 */
export async function detectAgent(
  urls?: string[],
  timeout?: number
): Promise<AgentInfo> {
  const detector = new AgentDetector({ urls, timeout, autoRetry: false });
  return detector.detect();
}
