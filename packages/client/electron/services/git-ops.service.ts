/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Git Operations Service
 * 
 * 资源获取策略:
 * - 索引文件 (index.json): 直连 GitHub raw URL,避免 CDN 缓存导致更新延迟
 * - 元数据文件 (metadata.json): 使用 jsDelivr CDN 加速
 * - 下载文件 (plugin.zip): 使用 jsDelivr CDN 加速
 * 
 * 这种混合策略确保索引实时更新,同时大文件享受 CDN 加速
 */

import type { ToolRegistryEntry, ToolSourceConfig } from '@booltox/shared';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createLogger } from '../utils/logger.js';
import { configService } from './config.service.js';

export type GitProvider = 'github' | 'gitlab';

export interface GitOpsConfig {
  provider: GitProvider;
  owner: string;
  repo: string;
  branch: string;
  baseUrl?: string; // For self-hosted GitLab, e.g., 'https://gitlab.company.com'
  token?: string; // For private repos
}

export interface ToolRegistry {
  tools: ToolRegistryEntry[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 默认配置 (主应用仓库)
const DEFAULT_CONFIG: GitOpsConfig = {
  provider: 'github',
  owner: 'ByteTrue',
  repo: 'BoolTox',
  branch: 'ref',
};

// 缓存时间(毫秒)
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

const logger = createLogger('GitOpsService');

export class GitOpsService {
  private config: GitOpsConfig;
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(config: Partial<GitOpsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<GitOpsConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): GitOpsConfig {
    return { ...this.config };
  }

  /**
   * 获取缓存
   */
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 构建 Raw 文件 URL
   * 优先使用 jsDelivr CDN 加速(GitHub only)
   */
  private getRawUrl(filePath: string, useCdn = true): string {
    const { provider, owner, repo, branch, baseUrl } = this.config;
    
    // 移除开头的斜杠
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    if (provider === 'github') {
      // 使用 jsDelivr CDN 加速,更快且不消耗 API 配额
      if (useCdn) {
        return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`;
      }
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
    } else {
      // GitLab
      const host = baseUrl || 'https://gitlab.com';
      // GitLab Raw URL format: https://gitlab.com/owner/repo/-/raw/branch/path
      return `${host}/${owner}/${repo}/-/raw/${branch}/${cleanPath}`;
    }
  }

  /**
   * 构建工具仓库的 Raw 文件 URL
   */
  private getToolRepoUrl(filePath: string, repoConfig: ToolSourceConfig, useCdn = true): string {
    const { provider, owner, repo, branch } = repoConfig;

    // 移除开头的斜杠
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    if (provider === 'github') {
      // GitHub: 使用 jsDelivr CDN (更快) 或 raw.githubusercontent.com (实时)
      if (useCdn) {
        return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`;
      } else {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
      }
    } else {
      // GitLab
      const baseUrl = repoConfig.baseUrl || 'https://gitlab.com';
      return `${baseUrl}/${owner}/${repo}/-/raw/${branch}/${cleanPath}`;
    }
  }

  /**
   * 获取请求头 (处理 Token)
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.token) {
      if (this.config.provider === 'github') {
        headers['Authorization'] = `token ${this.config.token}`;
      } else {
        headers['PRIVATE-TOKEN'] = this.config.token;
      }
    }
    return headers;
  }

  /**
   * 调用 GitHub/GitLab API
   */
  private async fetchApi(path: string): Promise<unknown> {
    const { provider, owner, repo, baseUrl } = this.config;
    let url = '';
    const headers = this.getHeaders();

    if (provider === 'github') {
      // GitHub API
      url = `https://api.github.com/repos/${owner}/${repo}/${path}`;
      headers['Accept'] = 'application/vnd.github.v3+json';
    } else {
      // GitLab API
      const host = baseUrl || 'https://gitlab.com';
      const projectId = encodeURIComponent(`${owner}/${repo}`);
      url = `${host}/api/v4/projects/${projectId}/${path}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * 从配置获取启用的工具源列表（按优先级排序）
   */
  private getEnabledToolSources(): ToolSourceConfig[] {
    try {
      const config = configService.get('toolSources');
      return config.sources
        .filter(source => source.enabled)
        .sort((a, b) => a.priority - b.priority);
    } catch (error) {
      logger.error('[GitOps] Failed to get tool sources from config:', error);
      // 回退到空数组
      return [];
    }
  }

  /**
   * 从单个工具源加载工具列表
   *
   * 支持两种类型：
   * - remote: 远程 Git 仓库（自动检测多工具/单工具模式）
   * - local: 本地目录（读取 booltox.json 或 booltox-index.json）
   */
  private async getToolsFromRepo(source: ToolSourceConfig): Promise<ToolRegistryEntry[]> {
    try {
      logger.info(`[GitOps] Loading tools from tool source: ${source.name} (${source.type})`);

      // 本地类型
      if (source.type === 'local') {
        return await this.getToolsFromLocal(source);
      }

      // 远程类型：尝试两种模式
      // 1. 尝试加载 booltox-index.json（多工具模式）
      try {
        return await this.getToolsFromIndexMode(source);
      } catch {
        logger.debug(`[GitOps] No booltox-index.json found, trying single tool mode`);
        // 2. 降级到单工具模式（读取根目录 booltox.json）
        return await this.getToolsFromSingleMode(source);
      }
    } catch (error) {
      logger.error(`[GitOps] Error loading tools from ${source.name}:`, error);
      return [];
    }
  }

  /**
   * 多工具模式：从 booltox-index.json 加载
   */
  private async getToolsFromIndexMode(source: ToolSourceConfig): Promise<ToolRegistryEntry[]> {
    // 1. 获取索引文件
    const indexUrl = this.getToolRepoUrl('booltox-index.json', source, false);
    logger.debug(`[GitOps] Fetching index from: ${indexUrl}`);

    const headers: Record<string, string> = {};
    if (source.token) {
      if (source.provider === 'github') {
        headers['Authorization'] = `token ${source.token}`;
      } else {
        headers['PRIVATE-TOKEN'] = source.token;
      }
    }

    const indexRes = await fetch(indexUrl, { headers });
    if (!indexRes.ok) {
      throw new Error(`Failed to fetch booltox-index.json: ${indexRes.statusText}`);
    }

    const index = await indexRes.json() as {
      tools: Array<{ id: string; path: string }>;  // 简化格式
    };

    logger.debug(`[GitOps] Found ${index.tools.length} tools in ${source.name}`);

    // 2. 并行加载所有工具的 booltox.json
    const metadataPromises = index.tools.map(async (item) => {
      try {
        const booltoxUrl = this.getToolRepoUrl(`${item.path}/booltox.json`, source);
        const res = await fetch(booltoxUrl, { headers });

        if (!res.ok) {
          logger.warn(`[GitOps] Failed to fetch booltox.json for ${item.id}: ${res.statusText}`);
          return null;
        }

        const metadata = await res.json() as Omit<ToolRegistryEntry, 'downloadUrl'>;

        // 下载 URL 指向工具目录（tarball）
        const downloadUrl = this.getTarballUrl(source, item.path);

        // 标记来源
        return {
          ...metadata,
          downloadUrl,
          gitPath: item.path,  // 工具在仓库中的路径
          sourceId: source.id,
          sourceName: source.name,
          _uniqueKey: `${source.id}:${metadata.id}`,
        } as ToolRegistryEntry & { sourceId: string; sourceName: string; _uniqueKey: string };
      } catch (error) {
        logger.error(`[GitOps] Error fetching booltox.json for ${item.id}:`, error);
        return null;
      }
    });

    const tools = (await Promise.all(metadataPromises)).filter((p): p is ToolRegistryEntry & { sourceId: string; sourceName: string; _uniqueKey: string } => p !== null);
    logger.info(`[GitOps] Loaded ${tools.length} tools from ${source.name} (index mode)`);

    return tools as unknown as ToolRegistryEntry[];
  }

  /**
   * 单工具模式：读取根目录 booltox.json
   */
  private async getToolsFromSingleMode(source: ToolSourceConfig): Promise<ToolRegistryEntry[]> {
    const booltoxUrl = this.getToolRepoUrl('booltox.json', source);
    logger.debug(`[GitOps] Fetching single tool config from: ${booltoxUrl}`);

    const headers: Record<string, string> = {};
    if (source.token) {
      if (source.provider === 'github') {
        headers['Authorization'] = `token ${source.token}`;
      } else {
        headers['PRIVATE-TOKEN'] = source.token;
      }
    }

    const res = await fetch(booltoxUrl, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch booltox.json: ${res.statusText}`);
    }

    const metadata = await res.json() as Omit<ToolRegistryEntry, 'downloadUrl'>;

    // 下载 URL 指向根目录
    const downloadUrl = this.getTarballUrl(source, '');

    logger.info(`[GitOps] Loaded single tool from ${source.name}: ${metadata.name}`);

    return [{
      ...metadata,
      downloadUrl,
      gitPath: '',  // 根目录
      sourceId: source.id,
      sourceName: source.name,
      _uniqueKey: `${source.id}:${metadata.id}`,
    }] as unknown as ToolRegistryEntry[];
  }

  /**
   * 从本地目录加载工具
   * 支持两种模式：多工具（booltox-index.json）和单工具（booltox.json）
   */
  private async getToolsFromLocal(source: ToolSourceConfig): Promise<ToolRegistryEntry[]> {
    if (!source.localPath) {
      throw new Error('本地路径未设置');
    }

    // 1. 尝试多工具模式（booltox-index.json）
    const indexPath = path.join(source.localPath, 'booltox-index.json');
    try {
      await fs.access(indexPath);
      const content = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(content) as { tools: Array<{ id: string; path: string }> };

      const tools = await Promise.all(
        index.tools.map(async (item) => {
          try {
            const booltoxPath = path.join(source.localPath!, item.path, 'booltox.json');
            const toolContent = await fs.readFile(booltoxPath, 'utf-8');
            const metadata = JSON.parse(toolContent) as ToolRegistryEntry;

            return {
              ...metadata,
              gitPath: item.path,
              sourceId: source.id,
              sourceName: source.name,
              _uniqueKey: `${source.id}:${metadata.id}`,
            };
          } catch (error) {
            logger.warn(`[GitOps] Failed to load local tool ${item.id}:`, error);
            return null;
          }
        })
      );

      const validTools = tools.filter(p => p !== null) as ToolRegistryEntry[];
      logger.info(`[GitOps] Loaded ${validTools.length} local tools from index`);
      return validTools;
    } catch {
      logger.debug(`[GitOps] No booltox-index.json in ${source.localPath}, trying single tool mode`);
    }

    // 2. 尝试单工具模式（booltox.json）
    const booltoxPath = path.join(source.localPath, 'booltox.json');
    try {
      const content = await fs.readFile(booltoxPath, 'utf-8');
      const metadata = JSON.parse(content) as ToolRegistryEntry;

      logger.info(`[GitOps] Loaded single local tool: ${metadata.name}`);

      return [{
        ...metadata,
        downloadUrl: '',
        gitPath: source.localPath,
        sourceId: source.id,
        sourceName: source.name,
        _uniqueKey: `${source.id}:${metadata.id}`,
      }];
    } catch (error) {
      logger.error(`[GitOps] Failed to read booltox.json from ${source.localPath}:`, error);
      return [];
    }
  }

  /**
   * 获取 Tarball 下载 URL
   */
  private getTarballUrl(source: ToolSourceConfig, _toolPath: string): string {
    const { provider, owner, repo, branch } = source;

    if (provider === 'github') {
      // GitHub tarball API
      return `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`;
    } else {
      // GitLab archive API
      const baseUrl = source.baseUrl || 'https://gitlab.com';
      return `${baseUrl}/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/archive.tar.gz?sha=${branch}`;
    }
  }

  /**
   * 获取工具列表
   * 从所有配置的工具源加载
   */
  async getToolRegistry(): Promise<ToolRegistry> {
    const cacheKey = 'tools';

    // 检查缓存
    const cached = this.getCache<ToolRegistry>(cacheKey);
    if (cached) {
      logger.debug('[GitOps] Using cached tool registry');
      return cached;
    }

    try {
      // 获取所有启用的工具源，只取远程类型
      const sources = this.getEnabledToolSources();
      const remoteSources = sources.filter(s => s.type === 'remote');

      if (remoteSources.length === 0) {
        logger.warn('[GitOps] No enabled remote tool sources found');
        return { tools: [] };
      }

      logger.info(`[GitOps] Loading tools from ${remoteSources.length} remote tool sources`);

      // 并发从所有远程工具源加载工具
      const allToolsArrays = await Promise.all(
        remoteSources.map(source => this.getToolsFromRepo(source))
      );

      // 展平（不合并同 ID 工具，全部保留）
      const tools = allToolsArrays.flat();

      const result = { tools };

      // 缓存结果
      this.setCache(cacheKey, result);
      logger.info(`[GitOps] Loaded ${tools.length} total tools from all tool sources`);

      return result;
    } catch (error) {
      logger.error('[GitOps] Error fetching tool registry:', error);
      return { tools: [] };
    }
  }

  /**
   * 获取文件的下载链接 (用于工具下载)
   * 如果是私有仓库，可能需要通过此服务代理下载，或者生成带 Token 的 URL
   * 这里简单返回 Raw URL，如果客户端直接下载有问题，可能需要主进程下载
   */
  getFileUrl(filePath: string): string {
    return this.getRawUrl(filePath);
  }

  /**
   * 下载工具源码（从 Git tarball）
   * 支持 GitHub / GitLab / 私有化 GitLab
   *
   * @param toolPath - 工具在仓库中的路径（如 'uiautodev'）
   * @param targetDir - 目标目录（如 '~/.booltox/tools/com.booltox.uiautodev'）
   * @param config - 可选的仓库配置（默认使用第一个启用的仓库）
   */
  async downloadToolSource(
    toolPath: string,
    targetDir: string,
    config: Partial<GitOpsConfig> = {}
  ): Promise<void> {
    // 开发模式：检测本地 booltox-plugins 仓库，创建符号链接
    if (!app.isPackaged) {
      const localToolPath = path.resolve(process.cwd(), '..', 'booltox-plugins', toolPath);

      // 如果本地存在，创建符号链接
      if (fsSync.existsSync(localToolPath)) {
        logger.info(`[GitOps] 开发模式：创建符号链接 ${targetDir} → ${localToolPath}`);

        // 确保父目录存在
        await fs.mkdir(path.dirname(targetDir), { recursive: true });

        // 创建符号链接（目录类型）
        await fs.symlink(localToolPath, targetDir, 'dir');

        logger.info(`[GitOps] 符号链接创建成功，修改源码将立即生效`);
        return;
      }

      logger.warn(`[GitOps] 本地工具目录不存在: ${localToolPath}，降级到 GitHub 下载`);
    }

    // 生产模式或本地不存在：从 Git 仓库下载
    // 获取默认工具源配置（使用第一个启用的工具源）
    const sources = this.getEnabledToolSources();
    const defaultSource = sources.length > 0 ? sources[0] : null;

    if (!defaultSource) {
      throw new Error('[GitOps] No enabled tool sources found for tool download');
    }

    const repoConfig = { ...defaultSource, ...config };
    const { provider, owner, repo, branch, baseUrl, token } = repoConfig;

    logger.info(`[GitOps] 下载工具源码: ${toolPath} from ${provider}://${owner}/${repo}/${branch}`);

    let tarballUrl = '';
    const headers: Record<string, string> = {};

    // 构建 tarball URL
    if (provider === 'github') {
      // GitHub API
      tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`;
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }
      headers['Accept'] = 'application/vnd.github.v3+json';
    } else {
      // GitLab API
      const host = baseUrl || 'https://gitlab.com';
      const projectId = encodeURIComponent(`${owner}/${repo}`);
      tarballUrl = `${host}/api/v4/projects/${projectId}/repository/archive.tar.gz?sha=${branch}`;
      if (token) {
        headers['PRIVATE-TOKEN'] = token;
      }
    }

    // 下载 tarball
    logger.info(`[GitOps] 下载 tarball: ${tarballUrl}`);
    const response = await fetch(tarballUrl, { headers });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const tarballBuffer = Buffer.from(await response.arrayBuffer());
    logger.info(`[GitOps] Tarball 下载完成: ${(tarballBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // 解压 tarball（只提取指定工具目录）
    const tar = await import('tar');
    const tempDir = path.join(app.getPath('temp'), `booltox-tool-${Date.now()}`);

    await fs.mkdir(tempDir, { recursive: true });

    try {
      // 写入临时文件（tar 需要从文件读取）
      const tempTarPath = path.join(tempDir, 'temp.tar.gz');
      await fs.writeFile(tempTarPath, tarballBuffer);

      // 解压整个 tarball
      await tar.extract({
        file: tempTarPath,
        cwd: tempDir,
      });

      // 删除临时 tar 文件
      await fs.unlink(tempTarPath);

      // 查找工具目录（tarball 顶层目录名不固定）
      const entries = await fs.readdir(tempDir);
      if (entries.length === 0) {
        throw new Error('Tarball 解压后为空');
      }

      // 顶层目录（如 'ByteTrue-booltox-plugins-abc123'）
      const topDir = entries[0];
      const toolSourceDir = path.join(tempDir, topDir, toolPath);

      if (!fsSync.existsSync(toolSourceDir)) {
        throw new Error(`工具目录未找到: ${toolPath}`);
      }

      // 确保目标目录的父目录存在
      await fs.mkdir(path.dirname(targetDir), { recursive: true });

      // 移动到目标目录
      await fs.rename(toolSourceDir, targetDir);

      logger.info(`[GitOps] 工具源码已安装到: ${targetDir}`);
    } finally {
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

export const gitOpsService = new GitOpsService();
