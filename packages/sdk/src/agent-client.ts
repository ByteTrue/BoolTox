/**
 * Agent HTTP 客户端
 * 封装所有 Agent API 调用
 */

import ky, { type KyInstance, type Options } from 'ky';
import type { PluginManifest } from '@booltox/shared';

export interface AgentClientOptions {
  /**
   * Agent 基础 URL
   * @default 'http://localhost:9527'
   */
  baseUrl?: string;

  /**
   * 请求超时（毫秒）
   * @default 30000
   */
  timeout?: number;

  /**
   * 自定义请求配置
   */
  kyOptions?: Options;
}

/**
 * 插件信息（运行时状态）
 */
export interface PluginInfo {
  id: string;
  manifest: PluginManifest;
  status: 'stopped' | 'running' | 'loading' | 'error';
  installed: boolean;
  version: string;
  mode?: 'webview' | 'standalone';
  isDev?: boolean;
}

/**
 * 插件安装选项
 */
export interface PluginInstallOptions {
  /**
   * 插件来源
   */
  source: string;

  /**
   * 安装类型
   */
  type: 'url' | 'local' | 'git';

  /**
   * SHA-256 哈希（可选，用于验证）
   */
  hash?: string;
}

/**
 * Agent HTTP 客户端
 */
export class AgentClient {
  private client: KyInstance;
  private baseUrl: string;

  constructor(options: AgentClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:9527';

    this.client = ky.create({
      prefixUrl: this.baseUrl,
      timeout: options.timeout || 30000,
      retry: {
        limit: 2,
        methods: ['get', 'post', 'put', 'delete'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
      },
      hooks: {
        beforeRequest: [
          (request) => {
            // TODO: 添加认证 token
            // request.headers.set('Authorization', `Bearer ${token}`);
          },
        ],
      },
      ...options.kyOptions,
    });
  }

  // ==================== 健康检查 ====================

  /**
   * 检查 Agent 健康状态
   */
  async health(): Promise<{
    status: string;
    version: string;
    timestamp: string;
    uptime?: number;
  }> {
    return this.client.get('api/health').json();
  }

  /**
   * 获取 Agent 信息
   */
  async info(): Promise<{
    name: string;
    version: string;
    protocol: string;
    platform: string;
    arch: string;
    nodeVersion: string;
  }> {
    return this.client.get('api/info').json();
  }

  // ==================== 插件管理 ====================

  /**
   * 获取所有插件列表
   */
  async getPlugins(): Promise<PluginInfo[]> {
    const response = await this.client.get('api/plugins').json<{
      plugins: PluginInfo[];
      total: number;
    }>();
    return response.plugins;
  }

  /**
   * 获取单个插件信息
   */
  async getPlugin(pluginId: string): Promise<PluginInfo> {
    return this.client.get(`api/plugins/${pluginId}`).json();
  }

  /**
   * 安装插件
   */
  async installPlugin(options: PluginInstallOptions): Promise<{
    success: boolean;
    pluginId: string;
    message?: string;
  }> {
    return this.client
      .post('api/plugins/install', {
        json: options,
      })
      .json();
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.client.delete(`api/plugins/${pluginId}`).json();
  }

  /**
   * 启动插件
   */
  async startPlugin(pluginId: string): Promise<{
    success: boolean;
    channelId?: string;
    pid?: number;
    message?: string;
  }> {
    return this.client.post(`api/plugins/${pluginId}/start`, { json: {} }).json();
  }

  /**
   * 停止插件
   */
  async stopPlugin(pluginId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.client.post(`api/plugins/${pluginId}/stop`, { json: {} }).json();
  }

  /**
   * 调用插件后端方法
   */
  async callBackend(
    pluginId: string,
    method: string,
    params?: any
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    return this.client
      .post(`api/plugins/${pluginId}/call`, {
        json: { method, params },
      })
      .json();
  }

  /**
   * 获取插件日志
   */
  async getPluginLogs(pluginId: string, limit?: number): Promise<{
    logs: Array<{
      timestamp: string;
      level: 'info' | 'warn' | 'error';
      message: string;
    }>;
  }> {
    const searchParams = limit ? { limit: limit.toString() } : undefined;
    return this.client
      .get(`api/plugins/${pluginId}/logs`, { searchParams })
      .json();
  }

  // ==================== 插件市场 ====================

  /**
   * 从远程市场获取插件列表
   */
  async getMarketPlugins(params?: {
    category?: 'official' | 'community' | 'examples';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    plugins: Array<{
      id: string;
      name: string;
      description: string;
      version: string;
      category: string;
      verified: boolean;
      icon?: string;
      downloads?: number;
      rating?: number;
    }>;
    total: number;
    page: number;
  }> {
    return this.client.get('api/market/plugins', { searchParams: params as any }).json();
  }

  /**
   * 检查插件更新
   */
  async checkUpdates(
    installed: Array<{ id: string; version: string }>
  ): Promise<{
    updates: Array<{
      id: string;
      currentVersion: string;
      latestVersion: string;
      downloadUrl: string;
    }>;
  }> {
    return this.client
      .post('api/plugins/check-updates', {
        json: { installed },
      })
      .json();
  }

  // ==================== WebSocket 连接 ====================

  /**
   * 创建 WebSocket 连接（用于实时日志流）
   */
  createWebSocket(path: string): WebSocket {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + path;
    return new WebSocket(wsUrl);
  }

  /**
   * 监听插件日志流
   */
  subscribePluginLogs(
    pluginId: string,
    callback: (log: { timestamp: string; level: string; message: string }) => void
  ): () => void {
    const ws = this.createWebSocket(`/ws/plugins/${pluginId}/logs`);

    ws.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        callback(log);
      } catch (error) {
        console.error('Failed to parse log message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // 返回清理函数
    return () => {
      ws.close();
    };
  }
}

/**
 * 创建 Agent 客户端实例
 */
export function createAgentClient(options?: AgentClientOptions): AgentClient {
  return new AgentClient(options);
}
