/**
 * 插件运行器
 * 管理插件的启动、停止和生命周期
 */

import { EventEmitter } from 'eventemitter3';
import type { PluginRuntime } from './plugin-manager.js';
import { getBackendRunner, type BackendEvent } from '../runtime/backend-runner.js';

/**
 * 插件状态
 */
export interface PluginState {
  pluginId: string;
  runtime: PluginRuntime;
  channelId?: string;
  pid?: number;
  refCount: number;
}

/**
 * 插件运行器
 */
export class PluginRunner extends EventEmitter {
  private states = new Map<string, PluginState>();
  private backendRunner = getBackendRunner();

  constructor() {
    super();

    // 监听后端事件
    this.backendRunner.on('message', (event: BackendEvent) => {
      // 转发后端事件
      this.emit('backend-event', event);
    });
  }

  /**
   * 启动插件
   */
  async startPlugin(runtime: PluginRuntime): Promise<{ channelId?: string; pid?: number }> {
    const pluginId = runtime.id;

    // 获取或创建状态
    let state = this.states.get(pluginId);
    if (!state) {
      state = {
        pluginId,
        runtime,
        refCount: 0,
      };
      this.states.set(pluginId, state);
    }

    // 增加引用计数
    state.refCount++;

    // 如果已经在运行，返回现有信息
    if (runtime.status === 'running') {
      return {
        channelId: state.channelId,
        pid: state.pid,
      };
    }

    // 更新状态
    runtime.status = 'loading';
    this.emit('plugin-status-changed', { pluginId, status: 'loading' });

    try {
      // 根据插件模式启动
      if (runtime.mode === 'webview') {
        await this.startWebviewPlugin(state);
      } else if (runtime.mode === 'standalone') {
        await this.startStandalonePlugin(state);
      }

      // 更新状态
      runtime.status = 'running';
      this.emit('plugin-status-changed', { pluginId, status: 'running' });

      return {
        channelId: state.channelId,
        pid: state.pid,
      };
    } catch (error) {
      // 更新错误状态
      runtime.status = 'error';
      runtime.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('plugin-status-changed', {
        pluginId,
        status: 'error',
        error: runtime.error,
      });
      throw error;
    }
  }

  /**
   * 启动 Webview 插件
   */
  private async startWebviewPlugin(state: PluginState): Promise<void> {
    const { runtime } = state;

    // 检查是否有后端配置
    const runtimeConfig = runtime.manifest.runtime;
    if (!runtimeConfig || runtimeConfig.type === 'standalone') {
      throw new Error('Invalid runtime config for webview plugin');
    }

    const backendConfig = runtimeConfig.backend;
    if (!backendConfig) {
      // 纯前端插件，无需启动后端
      console.log(`[${runtime.id}] Pure frontend plugin, no backend needed`);
      return;
    }

    // 启动后端进程
    const { pid, channelId } = await this.backendRunner.registerBackend(
      runtime.id,
      runtime.path,
      backendConfig
    );

    state.pid = pid;
    state.channelId = channelId;

    // 等待后端就绪
    await this.backendRunner.waitForReady(channelId, 10000);

    console.log(`[${runtime.id}] Backend started: pid=${pid}, channelId=${channelId}`);
  }

  /**
   * 启动 Standalone 插件
   */
  private async startStandalonePlugin(state: PluginState): Promise<void> {
    const { runtime } = state;

    // Standalone 插件直接作为独立进程运行
    const runtimeConfig = runtime.manifest.runtime;
    if (!runtimeConfig || runtimeConfig.type !== 'standalone') {
      throw new Error('Invalid runtime config for standalone plugin');
    }

    const entryPath = runtimeConfig.entry;
    if (!entryPath) {
      throw new Error('Standalone plugin missing entry path');
    }

    // 作为普通后端进程启动
    const { pid, channelId } = await this.backendRunner.registerBackend(
      runtime.id,
      runtime.path,
      {
        type: 'python',
        entry: entryPath,
        requirements: runtimeConfig.requirements,
      }
    );

    state.pid = pid;
    state.channelId = channelId;

    console.log(`[${runtime.id}] Standalone plugin started: pid=${pid}`);
  }

  /**
   * 停止插件
   */
  async stopPlugin(pluginId: string): Promise<void> {
    const state = this.states.get(pluginId);
    if (!state) {
      return;
    }

    // 减少引用计数
    state.refCount = Math.max(0, state.refCount - 1);

    // 如果还有引用，不销毁
    if (state.refCount > 0) {
      return;
    }

    // 延迟销毁（允许快速重启）
    setTimeout(async () => {
      if (state.refCount > 0) {
        return;
      }

      // 销毁后端进程
      if (state.channelId) {
        await this.backendRunner.dispose(state.channelId);
      }

      // 更新状态
      state.runtime.status = 'stopped';
      this.emit('plugin-status-changed', { pluginId, status: 'stopped' });

      // 清理状态
      this.states.delete(pluginId);

      console.log(`[${pluginId}] Plugin stopped`);
    }, 1000);
  }

  /**
   * 调用插件后端方法
   */
  async callBackend<TResult = any>(
    pluginId: string,
    method: string,
    params?: any,
    timeout?: number
  ): Promise<TResult> {
    const state = this.states.get(pluginId);
    if (!state || !state.channelId) {
      throw new Error(`Plugin ${pluginId} backend not available`);
    }

    return this.backendRunner.call<TResult>(state.channelId, method, params, timeout);
  }

  /**
   * 获取插件状态
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return this.states.get(pluginId);
  }

  /**
   * 获取所有运行中的插件
   */
  getRunningPlugins(): PluginState[] {
    return Array.from(this.states.values()).filter(
      (s) => s.runtime.status === 'running'
    );
  }

  /**
   * 停止所有插件
   */
  async stopAll(): Promise<void> {
    const pluginIds = Array.from(this.states.keys());
    await Promise.all(pluginIds.map((id) => this.stopPlugin(id)));
  }
}

/**
 * 创建插件运行器单例
 */
let _pluginRunner: PluginRunner | null = null;

export function getPluginRunner(): PluginRunner {
  if (!_pluginRunner) {
    _pluginRunner = new PluginRunner();
  }
  return _pluginRunner;
}
