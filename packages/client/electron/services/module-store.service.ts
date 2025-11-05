/**
 * 模块存储服务
 * @description 使用 electron-store 管理模块配置的持久化存储
 */

import Store from 'electron-store';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { 
  ModulesConfig, 
  StoredModuleInfo,
} from '../../src/shared/types/module-store.types';

/**
 * 模块存储服务类
 */
class ModuleStoreService {
  private store: Store<ModulesConfig>;
  private cacheBasePath: string;

  constructor() {
    // 初始化 electron-store
    this.store = new Store<ModulesConfig>({
      name: 'modules-config',
      defaults: {
        version: '1.0.0',
        installedModules: [],
      } as ModulesConfig,
      // 美化 JSON 输出，便于调试
      serialize: (value) => JSON.stringify(value, null, 2),
    });

    // 设置缓存目录路径
    this.cacheBasePath = path.join(app.getPath('userData'), 'modules-cache');
    
    // 确保缓存目录存在
    this.ensureCacheDirectory();
  }

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheBasePath)) {
      fs.mkdirSync(this.cacheBasePath, { recursive: true });
    }
  }

  /**
   * 获取所有已安装的模块
   */
  getInstalledModules(): StoredModuleInfo[] {
    return this.store.get('installedModules', []);
  }

  /**
   * 添加已安装模块记录
   */
  addModule(info: StoredModuleInfo): void {
    const modules = this.getInstalledModules();
    
    // 检查是否已存在
    const existingIndex = modules.findIndex(m => m.id === info.id);
    
    if (existingIndex >= 0) {
      // 更新现有记录
      modules[existingIndex] = {
        ...modules[existingIndex],
        ...info,
        lastUsedAt: new Date().toISOString(),
      };
    } else {
      // 添加新记录
      modules.push(info);
    }
    
    this.store.set('installedModules', modules);
  }

  /**
   * 更新模块状态
   */
  updateModuleStatus(id: string, status: 'enabled' | 'disabled'): void {
    const modules = this.getInstalledModules();
    const module = modules.find(m => m.id === id);
    
    if (module) {
      module.status = status;
      module.lastUsedAt = new Date().toISOString();
      this.store.set('installedModules', modules);
    }
  }

  /**
   * 更新模块信息 (部分更新)
   */
  updateModuleInfo(id: string, partialInfo: Partial<StoredModuleInfo>): void {
    const modules = this.getInstalledModules();
    const moduleIndex = modules.findIndex(m => m.id === id);
    
    if (moduleIndex >= 0) {
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        ...partialInfo,
        lastUsedAt: new Date().toISOString(),
      };
      this.store.set('installedModules', modules);
    }
  }

  /**
   * 删除模块记录
   */
  removeModule(id: string): void {
    const modules = this.getInstalledModules();
    const filteredModules = modules.filter(m => m.id !== id);
    this.store.set('installedModules', filteredModules);
  }

  /**
   * 获取模块的缓存文件路径
   */
  getModuleCachePath(moduleId: string): string {
    return path.join(this.cacheBasePath, `${moduleId}.js`);
  }

  /**
   * 删除模块的缓存文件
   */
  removeModuleCache(moduleId: string): boolean {
    const cachePath = this.getModuleCachePath(moduleId);
    
    try {
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[ModuleStore] Failed to remove cache for ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * 获取模块信息
   */
  getModuleInfo(id: string): StoredModuleInfo | undefined {
    const modules = this.getInstalledModules();
    return modules.find(m => m.id === id);
  }

  /**
   * 清空所有配置 (危险操作，仅用于测试)
   */
  clearAll(): void {
    this.store.set('installedModules', []);
  }

  /**
   * 获取配置文件路径 (用于调试)
   */
  getConfigPath(): string {
    return this.store.path;
  }
}

// 导出单例
export const moduleStoreService = new ModuleStoreService();
