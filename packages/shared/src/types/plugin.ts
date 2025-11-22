export interface PluginManifest {
  /** Unique identifier (e.g., "com.booltox.todo") */
  id: string;
  /** Semantic version string */
  version: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Entry HTML file path relative to plugin root (e.g., "index.html") */
  main: string;
  /** Icon file path relative to plugin root */
  icon?: string;
  /** Requested permissions */
  permissions?: string[];
  /** Default window configuration */
  window?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
  };
  author?: string;
  homepage?: string;
  keywords?: string[];
  category?: string;
}

export interface PluginRuntime {
  id: string;
  manifest: PluginManifest;
  /** Absolute path to the plugin directory on disk */
  path: string;
  status: 'stopped' | 'running' | 'loading' | 'error';
  /** WebContents ID of the BrowserView (if running) */
  viewId?: number;
  /** BrowserWindow ID (when running in dedicated window mode) */
  windowId?: number;
  error?: string;
  /** Whether this plugin is loaded from dev directory (not installed by user) */
  isDev?: boolean;
}

/**
 * 插件注册表条目 - 用于在线插件商店
 * 注意: downloadUrl 不保存在 metadata.json 中,由 GitOpsService 根据配置自动生成
 */
export interface PluginRegistryEntry {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  icon?: string;
  category?: string;
  keywords?: string[];
  /** SHA-256校验和 */
  hash?: string;
  /** 文件大小(字节) */
  size?: number;
  /** 截图 */
  screenshots?: string[];
  /** 更新日志 */
  changelog?: string;
  /** ZIP包下载地址 (运行时生成,不保存在metadata.json) */
  downloadUrl?: string;
}

/**
 * 插件安装进度
 */
export interface PluginInstallProgress {
  stage: 'downloading' | 'extracting' | 'verifying' | 'installing' | 'complete' | 'error';
  percent: number;
  message?: string;
  error?: string;
}
