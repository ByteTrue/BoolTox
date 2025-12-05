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

import type { PluginRegistryEntry } from '@booltox/shared';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
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
  plugins: PluginRegistryEntry[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 默认配置
const DEFAULT_CONFIG: GitOpsConfig = {
  provider: 'github',
  owner: 'ByteTrue',
  repo: 'BoolTox',
  branch: 'ref',
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
   * 获取插件列表
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
      // 1. 获取索引文件 (索引文件使用 GitHub raw URL 避免 CDN 缓存延迟)
      const indexUrl = this.getRawUrl('resources/plugins/index.json', false);
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

      // 2. 并行获取所有插件 metadata
      const metadataPromises = index.plugins.map(async (item) => {
        try {
          const metadataUrl = this.getRawUrl(`resources/plugins/${item.metadataFile}`);
          logger.info(`[GitOps] Fetching metadata for ${item.id} from:`, metadataUrl);
          const res = await fetch(metadataUrl);
          
          if (!res.ok) {
            logger.warn(`[GitOps] Failed to fetch metadata for ${item.id}: ${res.statusText}`);
            return null;
          }
          
          const metadata = await res.json() as Omit<PluginRegistryEntry, 'downloadUrl'>;
          // 使用索引中的下载文件路径
          const downloadUrl = this.getRawUrl(`resources/plugins/${item.downloadFile}`, false); // 下载用原始URL
          
          logger.info(`[GitOps] Successfully loaded metadata for ${item.id}`);
          return { ...metadata, downloadUrl } as PluginRegistryEntry;
        } catch (error) {
          logger.error(`[GitOps] Error fetching metadata for ${item.id}:`, error);
          return null;
        }
      });

      const plugins = (await Promise.all(metadataPromises)).filter((p): p is PluginRegistryEntry => p !== null);
      
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
   * 从本地文件系统读取插件列表 (开发模式)
   */
  private async getLocalPluginRegistry(): Promise<PluginRegistry> {
    try {
      // 在开发模式下,需要找到工作空间根目录
      // process.cwd() 在 packages/client,需要向上两级到达根目录
      const workspaceRoot = path.resolve(process.cwd(), '../..');
      const resourcesDir = path.join(workspaceRoot, 'resources', 'plugins');
      logger.info('[GitOps] Reading local plugins from:', resourcesDir);
      
      const entries = await fs.readdir(resourcesDir, { withFileTypes: true });
      const pluginDirs = entries.filter(e => e.isDirectory());
      
      const plugins: PluginRegistryEntry[] = [];
      
      for (const dir of pluginDirs) {
        try {
          const metadataPath = path.join(resourcesDir, dir.name, 'metadata.json');
          const content = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(content) as Omit<PluginRegistryEntry, 'downloadUrl'>;
          
          // 本地开发: 使用file://协议
          const pluginZipPath = path.join(resourcesDir, dir.name, 'plugin.zip');
          const downloadUrl = `file:///${pluginZipPath.replace(/\\/g, '/')}`;
          
          plugins.push({ ...metadata, downloadUrl });
        } catch (error) {
          logger.warn(`[GitOps] Failed to read metadata for ${dir.name}:`, error);
        }
      }
      
      logger.info(`[GitOps] Loaded ${plugins.length} local plugins`);
      return { plugins };
      
    } catch (error) {
      logger.error('[GitOps] Error reading local plugin registry:', error);
      return { plugins: [] };
    }
  }

  /**
   * 获取文件的下载链接 (用于插件下载)
   * 如果是私有仓库，可能需要通过此服务代理下载，或者生成带 Token 的 URL
   * 这里简单返回 Raw URL，如果客户端直接下载有问题，可能需要主进程下载
   */
  getFileUrl(filePath: string): string {
    return this.getRawUrl(filePath);
  }
}

export const gitOpsService = new GitOpsService();
