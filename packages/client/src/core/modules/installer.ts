import type { ComponentType } from "react";
import type { ModuleDefinition, RemoteModuleEntry } from "./types";

/**
 * 模块安装器 - 负责下载和缓存远程模块
 */
export class ModuleInstaller {
  private readonly cacheDir = "booltox-modules"; // 缓存目录名
  private downloadingModules = new Set<string>();

  /**
   * 从远程安装模块
   */
  async installRemoteModule(entry: RemoteModuleEntry): Promise<ModuleDefinition> {
    if (this.downloadingModules.has(entry.id)) {
      throw new Error(`模块 ${entry.id} 正在下载中`);
    }

    this.downloadingModules.add(entry.id);

    try {
      // 1. 下载模块包
      console.warn(`[Installer] 开始下载模块: ${entry.name} (${entry.version})`);
      const bundleCode = await this.downloadBundle(entry.bundleUrl);

      // 2. 验证校验和（可选）
      if (entry.checksum) {
        await this.verifyChecksum(bundleCode, entry.checksum);
      }

      // 3. 缓存到本地
      const cachedPath = await this.cacheModule(entry.id, bundleCode);

      // 4. 创建模块定义
      const definition: ModuleDefinition = {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        version: entry.version,
        author: entry.author,
        category: entry.category,
        keywords: entry.keywords,
        icon: entry.icon,
        source: "remote",
        remote: {
          bundleUrl: entry.bundleUrl,
          checksum: entry.checksum,
          size: entry.size,
        },
        loader: this.createModuleLoader(entry.id, cachedPath),
      };

      console.warn(`[Installer] 模块安装完成: ${entry.name}`);
      return definition;
    } finally {
      this.downloadingModules.delete(entry.id);
    }
  }

  /**
   * 下载模块包
   */
  private async downloadBundle(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`下载模块失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证文件校验和
   */
  private async verifyChecksum(content: string, expectedChecksum: string): Promise<void> {
    // 使用 Web Crypto API 计算 SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (hashHex !== expectedChecksum) {
      throw new Error("模块文件校验失败，可能已被篡改");
    }
  }

  /**
   * 缓存模块到本地存储
   */
  private async cacheModule(moduleId: string, bundleCode: string): Promise<string> {
    const key = `${this.cacheDir}:${moduleId}`;

    // 使用 localStorage 存储（小模块）或 IndexedDB（大模块）
    if (bundleCode.length < 1024 * 1024) {
      // < 1MB 使用 localStorage
      localStorage.setItem(key, bundleCode);
      return key;
    } else {
      // >= 1MB 使用 IndexedDB
      await this.saveToIndexedDB(key, bundleCode);
      return key;
    }
  }

  /**
   * 从缓存加载模块
   */
  private async loadFromCache(key: string): Promise<string | null> {
    // 先尝试 localStorage
    const cached = localStorage.getItem(key);
    if (cached) {
      return cached;
    }

    // 再尝试 IndexedDB
    return await this.loadFromIndexedDB(key);
  }

  /**
   * 创建模块加载器
   */
  private createModuleLoader(moduleId: string, cachedPath: string) {
    return async () => {
      // 从缓存读取模块代码
      const bundleCode = await this.loadFromCache(cachedPath);
      if (!bundleCode) {
        throw new Error(`模块缓存丢失: ${moduleId}`);
      }

      // 动态执行模块代码
      // 注意: 这里使用 Function 构造器执行代码，模块拥有完整权限
      const moduleExports: { default: unknown } = { default: null };
      const moduleFactory = new Function(
        "React",
        "exports",
        `
        ${bundleCode}
        if (typeof module !== 'undefined' && module.exports) {
          exports.default = module.exports.default || module.exports;
        }
        return exports.default;
      `,
      ) as (reactModule: typeof import("react"), exports: { default: unknown }) => unknown;

      // 动态导入 React（确保模块可以使用）
      const React = await import("react");
      const componentCandidate = moduleFactory(React, moduleExports) ?? moduleExports.default;

      if (!componentCandidate || (typeof componentCandidate !== "function" && typeof componentCandidate !== "object")) {
        throw new Error(`模块 ${moduleId} 未导出有效组件`);
      }

      return componentCandidate as ComponentType;
    };
  }

  /**
   * 卸载模块（清理缓存）
   */
  async uninstallModule(moduleId: string): Promise<void> {
    const key = `${this.cacheDir}:${moduleId}`;

    // 清理 localStorage
    localStorage.removeItem(key);

    // 清理 IndexedDB
    await this.deleteFromIndexedDB(key);

    console.warn(`[Installer] 模块已卸载: ${moduleId}`);
  }

  /**
   * 检查模块是否已安装
   */
  async isModuleInstalled(moduleId: string): Promise<boolean> {
    const key = `${this.cacheDir}:${moduleId}`;
    const cached = await this.loadFromCache(key);
    return cached !== null;
  }

  // ==================== IndexedDB 辅助方法 ====================

  private async saveToIndexedDB(key: string, data: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(["modules"], "readwrite");
    const store = transaction.objectStore("modules");
    await store.put({ key, data });
  }

  private async loadFromIndexedDB(key: string): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(["modules"], "readonly");
      const store = transaction.objectStore("modules");
      const request = store.get(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result?.data || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(["modules"], "readwrite");
      const store = transaction.objectStore("modules");
      await store.delete(key);
    } catch {
      // 忽略错误
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("BooltoxModules", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("modules")) {
          db.createObjectStore("modules", { keyPath: "key" });
        }
      };
    });
  }
}

// 单例实例
export const moduleInstaller = new ModuleInstaller();
