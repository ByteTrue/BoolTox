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
}
