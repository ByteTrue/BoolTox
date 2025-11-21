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

          return {
            id: filename.replace('.md', ''),
            title,
            content,
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
