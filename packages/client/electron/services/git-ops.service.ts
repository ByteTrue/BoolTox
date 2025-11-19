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
  content: string;
  date: string;
  type: 'info' | 'warning' | 'alert';
}

export interface PluginInfo {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  downloadUrl: string;
  hash?: string;
}

export interface PluginRegistry {
  plugins: PluginInfo[];
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
   * 获取公告列表
   */
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const url = this.getRawUrl('resources/announcements/news.json');
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) {
        console.warn(`[GitOps] Failed to fetch announcements: ${response.statusText}`);
        return [];
      }

      return await response.json() as Announcement[];
    } catch (error) {
      console.error('[GitOps] Error fetching announcements:', error);
      return [];
    }
  }

  /**
   * 获取插件列表
   */
  async getPluginRegistry(): Promise<PluginRegistry> {
    try {
      const url = this.getRawUrl('resources/plugins/registry.json');
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
      }

      return await response.json() as PluginRegistry;
    } catch (error) {
      console.error('[GitOps] Error fetching plugin registry:', error);
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
