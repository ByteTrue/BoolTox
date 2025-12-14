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

import type { ToolRegistryEntry } from '@booltox/shared';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createLogger } from '../utils/logger.js';

export type GitProvider = 'github' | 'gitlab';

export interface GitOpsConfig {
  provider: GitProvider;
  owner: string;
  repo: string;
  branch: string;
  baseUrl?: string; // For self-hosted GitLab, e.g., 'https://gitlab.company.com'
  token?: string; // For private repos
}

export interface Announcement {
  id: string;
  title: string;
  content?: string;
  contentFile?: string;
  date: string;
  type: 'announcement' | 'update';
}

export interface PluginRegistry {
  plugins: ToolRegistryEntry[];
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

// 工具仓库配置（独立仓库）
const PLUGIN_REPO_CONFIG: GitOpsConfig = {
  provider: 'github',
  owner: 'ByteTrue',
  repo: 'booltox-plugins', // 工具独立仓库
  branch: 'main',
};

// 缓存时间(毫秒)
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

const logger = createLogger('GitOpsService');

type GitHubContentItem = {
  type: string;
  name: string;
  path: string;
};

type GitLabContentItem = {
  type: string;
  name: string;
};

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
   * 使用主仓库的 resources/tools/ 目录
   */
  private getPluginRepoUrl(filePath: string, useCdn = true): string {
    const { provider, owner, repo, branch } = PLUGIN_REPO_CONFIG;

    // 移除开头的斜杠
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    // 工具文件都在 resources/tools/ 下
    const fullPath = `resources/tools/${cleanPath}`;

    if (provider === 'github') {
      // GitHub: 使用 jsDelivr CDN (更快) 或 raw.githubusercontent.com (实时)
      if (useCdn) {
        return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${fullPath}`;
      } else {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
      }
    } else {
      // GitLab
      return `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/${fullPath}`;
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
   * 列出目录下的 Markdown 文件
   */
  private async listMarkdownFiles(dirPath: string): Promise<string[]> {
    const { provider, branch } = this.config;
    try {
      if (provider === 'github') {
        const data = await this.fetchApi(`contents/${dirPath}?ref=${branch}`);
        if (Array.isArray(data)) {
          return (data as GitHubContentItem[])
            .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
            .map((item) => item.path);
        }
      } else {
        // GitLab
        const data = await this.fetchApi(`repository/tree?path=${dirPath}&ref=${branch}`);
        if (Array.isArray(data)) {
          return (data as GitLabContentItem[])
            .filter((item) => item.type === 'blob' && item.name.endsWith('.md'))
            .map((item) => `${dirPath}/${item.name}`);
        }
      }
    } catch (e) {
      logger.warn(`[GitOps] Failed to list files in ${dirPath}`, e);
    }
    return [];
  }

  /**
   * 解析 Markdown 内容元数据
   */
  private parseMarkdownMetadata(content: string, filename: string): { title: string; date: string } {
    // 1. 尝试从 Frontmatter 获取日期 (date: YYYY-MM-DD)
    const frontmatterDate = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    // 2. 尝试从文件名获取日期 (YYYY-MM-DD-xxx.md)
    const filenameDate = filename.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    
    const date = frontmatterDate || filenameDate || new Date().toISOString().split('T')[0];

    // 1. 尝试从 Frontmatter 获取标题 (title: xxx)
    const frontmatterTitle = content.match(/^title:\s*(.+)$/m)?.[1];
    // 2. 尝试从一级标题获取 (# Title)
    const h1Title = content.match(/^#\s+(.+)$/m)?.[1];
    
    const title = frontmatterTitle || h1Title || filename.replace('.md', '');

    return { title, date };
  }

  /**
   * 获取公告列表 (新闻 + 发布说明)
   * 使用索引文件,避免 API 调用
   */
  async getAnnouncements(): Promise<Announcement[]> {
    const cacheKey = 'announcements';
    
    // 检查缓存
    const cached = this.getCache<Announcement[]>(cacheKey);
    if (cached) {
      logger.debug('[GitOps] Using cached announcements');
      return cached;
    }

    try {
      // 1. 获取索引文件 (索引文件使用 GitHub raw URL 避免 CDN 缓存延迟)
      const indexUrl = this.getRawUrl('resources/announcements/index.json', false);
      const indexRes = await fetch(indexUrl);
      if (!indexRes.ok) {
        throw new Error(`Failed to fetch announcements index: ${indexRes.statusText}`);
      }
      
      const index = await indexRes.json() as {
        announcements: Array<{ id: string; file: string; type: 'announcement' | 'update' }>;
      };

      // 2. 并发获取所有公告内容
      const items = await Promise.all(index.announcements.map(async (item) => {
        try {
          const fileUrl = this.getRawUrl(`resources/announcements/${item.file}`);
          const response = await fetch(fileUrl);
          if (!response.ok) return null;
          
          const content = await response.text();
          const filename = item.file.split('/').pop() || '';
          const { title, date } = this.parseMarkdownMetadata(content, filename);

          // 移除 Frontmatter
          const contentBody = content.replace(/^---[\s\S]*?---\n/, '').trim();

          return {
            id: item.id,
            title,
            content: contentBody,
            date,
            type: item.type,
            contentFile: item.file
          } as Announcement;
        } catch (err) {
          logger.warn(`[GitOps] Failed to process announcement ${item.file}:`, err);
          return null;
        }
      }));

      const result = items.filter((item): item is Announcement => item !== null);
      
      // 缓存结果
      this.setCache(cacheKey, result);
      logger.info(`[GitOps] Loaded ${result.length} announcements`);
      
      return result;
    } catch (error) {
      logger.error('[GitOps] Error fetching announcements:', error);
      return [];
    }
  }

  /**
   * 获取工具列表
   * 使用索引文件,避免 API 调用
   */
  async getPluginRegistry(): Promise<PluginRegistry> {
    const cacheKey = 'plugins';
    
    // 开发模式: 从本地读取
    if (!app.isPackaged) {
      logger.info('[GitOps] Development mode: using local plugin registry');
      return await this.getLocalPluginRegistry();
    }
    
    // 检查缓存
    const cached = this.getCache<PluginRegistry>(cacheKey);
    if (cached) {
      logger.debug('[GitOps] Using cached plugin registry');
      return cached;
    }

    try {
      // 1. 获取索引文件 (从独立的工具仓库获取)
      const indexUrl = this.getPluginRepoUrl('plugins/index.json', false);
      logger.info('[GitOps] Fetching plugin index from:', indexUrl);
      const indexRes = await fetch(indexUrl);
      if (!indexRes.ok) {
        throw new Error(`Failed to fetch plugin index: ${indexRes.statusText}`);
      }

      const index = await indexRes.json() as {
        plugins: Array<{ id: string; metadataFile: string; downloadFile: string }>;
      };

      logger.debug(`[GitOps] Found ${index.plugins.length} plugins in index:`, index.plugins.map(p => p.id));
      logger.debug('[GitOps] Index data:', JSON.stringify(index, null, 2));

      // 2. 并行获取所有工具 metadata
      const metadataPromises = index.plugins.map(async (item) => {
        try {
          const metadataUrl = this.getPluginRepoUrl(`plugins/${item.metadataFile}`);
          logger.info(`[GitOps] Fetching metadata for ${item.id} from:`, metadataUrl);
          const res = await fetch(metadataUrl);

          if (!res.ok) {
            logger.warn(`[GitOps] Failed to fetch metadata for ${item.id}: ${res.statusText}`);
            return null;
          }

          const metadata = await res.json() as Omit<ToolRegistryEntry, 'downloadUrl'>;
          // 使用索引中的下载文件路径
          const downloadUrl = this.getPluginRepoUrl(`plugins/${item.downloadFile}`, false); // 下载用原始URL

          logger.info(`[GitOps] Successfully loaded metadata for ${item.id}`);
          return { ...metadata, downloadUrl } as ToolRegistryEntry;
        } catch (error) {
          logger.error(`[GitOps] Error fetching metadata for ${item.id}:`, error);
          return null;
        }
      });

      const plugins = (await Promise.all(metadataPromises)).filter((p): p is ToolRegistryEntry => p !== null);
      
      const result = { plugins };
      
      // 缓存结果
      this.setCache(cacheKey, result);
      logger.info(`[GitOps] Loaded ${plugins.length} plugins from registry`);
      
      return result;
    } catch (error) {
      logger.error('[GitOps] Error fetching plugin registry:', error);
      return { plugins: [] };
    }
  }

  /**
   * 从本地文件系统读取工具列表 (开发模式)
   */
  private async getLocalPluginRegistry(): Promise<PluginRegistry> {
    try {
      // 在开发模式下，从主仓库的 resources/tools/ 目录读取
      const toolsDir = path.resolve(process.cwd(), 'resources/tools');
      const indexPath = path.join(toolsDir, 'index.json');

      logger.info('[GitOps] Reading local plugins from:', indexPath);

      // 检查文件是否存在
      try {
        await fs.access(indexPath);
      } catch {
        logger.warn('[GitOps] Local tools/index.json not found, falling back to empty registry');
        return { plugins: [] };
      }

      // 直接读取 index.json（简化格式）
      const content = await fs.readFile(indexPath, 'utf-8');
      const data = JSON.parse(content) as { plugins: ToolRegistryEntry[] };

      logger.info(`[GitOps] Loaded ${data.plugins.length} plugins from local index`);
      return { plugins: data.plugins };
    } catch (error) {
      logger.error('[GitOps] Failed to load local plugin registry:', error);
      return { plugins: [] };
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
   * @param config - 可选的仓库配置（默认使用 PLUGIN_REPO_CONFIG）
   */
  async downloadToolSource(
    toolPath: string,
    targetDir: string,
    config: Partial<GitOpsConfig> = {}
  ): Promise<void> {
    const repoConfig = { ...PLUGIN_REPO_CONFIG, ...config };
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
