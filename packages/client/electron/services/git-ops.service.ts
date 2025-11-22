import type { PluginRegistryEntry } from '@booltox/shared';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

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

// 默认配置
const DEFAULT_CONFIG: GitOpsConfig = {
  provider: 'github',
  owner: 'ByteTrue',
  repo: 'BoolTox',
  branch: 'ref',
};

export class GitOpsService {
  private config: GitOpsConfig;

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
   * 构建 Raw 文件 URL
   */
  private getRawUrl(filePath: string): string {
    const { provider, owner, repo, branch, baseUrl } = this.config;
    
    // 移除开头的斜杠
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    if (provider === 'github') {
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
  private async fetchApi(path: string): Promise<any> {
    const { provider, owner, repo, branch, baseUrl } = this.config;
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
          return data
            .filter((item: any) => item.type === 'file' && item.name.endsWith('.md'))
            .map((item: any) => item.path);
        }
      } else {
        // GitLab
        const data = await this.fetchApi(`repository/tree?path=${dirPath}&ref=${branch}`);
        if (Array.isArray(data)) {
           return data
            .filter((item: any) => item.type === 'blob' && item.name.endsWith('.md'))
            .map((item: any) => `${dirPath}/${item.name}`);
        }
      }
    } catch (e) {
      console.warn(`[GitOps] Failed to list files in ${dirPath}`, e);
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
   * 获取公告列表 (自动扫描目录)
   */
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      // 1. 扫描目录
      const [newsFiles, releaseFiles] = await Promise.all([
        this.listMarkdownFiles('resources/announcements/news'),
        this.listMarkdownFiles('resources/announcements/releases')
      ]);

      const allFiles = [
        ...newsFiles.map(f => ({ path: f, type: 'announcement' as const })),
        ...releaseFiles.map(f => ({ path: f, type: 'update' as const }))
      ];

      // 2. 并发获取内容并解析
      const items = await Promise.all(allFiles.map(async ({ path: filePath, type }) => {
        try {
          const url = this.getRawUrl(filePath);
          const response = await fetch(url, { headers: this.getHeaders() });
          if (!response.ok) return null;
          
          const content = await response.text();
          const filename = filePath.split('/').pop() || '';
          const { title, date } = this.parseMarkdownMetadata(content, filename);

          // 移除 Frontmatter
          const contentBody = content.replace(/^---[\s\S]*?---\n/, '').trim();

          return {
            id: filename.replace('.md', ''),
            title,
            content: contentBody,
            date,
            type,
            contentFile: filePath
          } as Announcement;
        } catch (err) {
          console.warn(`[GitOps] Failed to process announcement ${filePath}:`, err);
          return null;
        }
      }));

      return items.filter((item): item is Announcement => item !== null);
    } catch (error) {
      console.error('[GitOps] Error fetching announcements:', error);
      return [];
    }
  }

  /**
   * 获取插件列表 - 扫描 resources/plugins/ 目录下的所有 metadata.json
   */
  async getPluginRegistry(): Promise<PluginRegistry> {
    try {
      // 开发模式: 从本地 resources/plugins/ 目录读取
      if (!app.isPackaged) {
        return await this.getLocalPluginRegistry();
      }
      
      // 生产模式: 从 GitHub 远程读取
      // 1. 获取 resources/plugins/ 目录内容
      const items = await this.fetchApi(`contents/resources/plugins?ref=${this.config.branch}`) as Array<{ name: string; type: 'file' | 'dir' }>;
      
      // 2. 过滤出所有子目录(每个插件一个目录)
      const pluginDirs = items.filter(item => item.type === 'dir');
      
      // 3. 并行获取所有 metadata.json
      const metadataPromises = pluginDirs.map(async dir => {
        try {
          const metadataUrl = this.getRawUrl(`resources/plugins/${dir.name}/metadata.json`);
          const res = await fetch(metadataUrl, { headers: this.getHeaders() });
          
          if (!res.ok) {
            console.warn(`[GitOps] Failed to fetch metadata for ${dir.name}: ${res.statusText}`);
            return null;
          }
          
          const metadata = await res.json() as Omit<PluginRegistryEntry, 'downloadUrl'>;
          // 自动生成下载URL: resources/plugins/{plugin-id}/plugin.zip
          const downloadUrl = this.getRawUrl(`resources/plugins/${dir.name}/plugin.zip`);
          
          return { ...metadata, downloadUrl } as PluginRegistryEntry;
        } catch (error) {
          console.error(`[GitOps] Error fetching metadata for ${dir.name}:`, error);
          return null;
        }
      });

      const plugins = (await Promise.all(metadataPromises)).filter((p): p is PluginRegistryEntry => p !== null);
      
      console.log(`[GitOps] Loaded ${plugins.length} plugins from registry`);
      return { plugins };
      
    } catch (error) {
      console.error('[GitOps] Error fetching plugin registry:', error);
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
      console.log('[GitOps] Reading local plugins from:', resourcesDir);
      
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
          console.warn(`[GitOps] Failed to read metadata for ${dir.name}:`, error);
        }
      }
      
      console.log(`[GitOps] Loaded ${plugins.length} local plugins`);
      return { plugins };
      
    } catch (error) {
      console.error('[GitOps] Error reading local plugin registry:', error);
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
