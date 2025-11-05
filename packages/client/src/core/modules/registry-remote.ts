import type { RemoteModuleManifest, RemoteModuleEntry } from "./types";

/**
 * 远程模块清单管理器
 */
export class ModuleRegistry {
  private manifestCache: RemoteModuleManifest | null = null;
  private lastFetchTime = 0;
  private readonly cacheDuration = 5 * 60 * 1000; // 5分钟缓存

  // 默认的模块清单地址（可以配置为你的 CDN 或 GitHub）
  private readonly defaultManifestUrl =
    "https://raw.githubusercontent.com/ByteTrue/booltox-modules/main/manifest.json";

  /**
   * 获取远程模块清单
   */
  async fetchManifest(url?: string): Promise<RemoteModuleManifest> {
    const manifestUrl = url || this.defaultManifestUrl;

    // 使用缓存
    if (this.manifestCache && Date.now() - this.lastFetchTime < this.cacheDuration) {
      return this.manifestCache;
    }

    try {
      console.warn("[Registry] 获取远程模块清单...");
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        throw new Error(`获取清单失败: ${response.statusText}`);
      }

      const manifest: RemoteModuleManifest = await response.json();

      // 验证清单格式
      this.validateManifest(manifest);

      // 更新缓存
      this.manifestCache = manifest;
      this.lastFetchTime = Date.now();

      console.warn(`[Registry] 成功获取 ${manifest.modules.length} 个远程模块`);
      return manifest;
    } catch (error) {
      console.error("[Registry] 获取模块清单失败:", error);
      throw new Error(`无法获取模块清单: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证清单格式
   */
  private validateManifest(manifest: unknown): asserts manifest is RemoteModuleManifest {
    if (typeof manifest !== "object" || manifest === null) {
      throw new Error("清单格式无效");
    }

    const m = manifest as Partial<RemoteModuleManifest>;

    if (!m.version || typeof m.version !== "string") {
      throw new Error("清单缺少版本信息");
    }

    if (!Array.isArray(m.modules)) {
      throw new Error("清单缺少模块列表");
    }

    // 验证每个模块条目
    m.modules.forEach((entry, index) => {
      if (!entry.id || !entry.name || !entry.version || !entry.bundleUrl) {
        throw new Error(`模块 #${index + 1} 格式无效`);
      }
    });
  }

  /**
   * 按 ID 查找远程模块
   */
  async findModule(moduleId: string): Promise<RemoteModuleEntry | null> {
    const manifest = await this.fetchManifest();
    return manifest.modules.find((m) => m.id === moduleId) || null;
  }

  /**
   * 搜索模块
   */
  async searchModules(query: string): Promise<RemoteModuleEntry[]> {
    const manifest = await this.fetchManifest();
    const lowerQuery = query.toLowerCase();

    return manifest.modules.filter(
      (module) =>
        module.name.toLowerCase().includes(lowerQuery) ||
        module.description.toLowerCase().includes(lowerQuery) ||
        module.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * 按分类获取模块
   */
  async getModulesByCategory(category: string): Promise<RemoteModuleEntry[]> {
    const manifest = await this.fetchManifest();
    return manifest.modules.filter((m) => m.category === category);
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    const manifest = await this.fetchManifest();
    const categories = new Set(manifest.modules.map((m) => m.category));
    return Array.from(categories).sort();
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.manifestCache = null;
    this.lastFetchTime = 0;
  }
}

// 单例实例
export const moduleRegistry = new ModuleRegistry();
