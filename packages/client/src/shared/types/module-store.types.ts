/**
 * 模块持久化存储类型定义
 * @description 用于 Electron Store 配置文件的类型定义
 */

/**
 * 已安装模块的存储信息
 */
export interface StoredModuleInfo {
  /** 模块唯一标识符 */
  id: string;
  
  /** 模块状态: enabled=启用并运行, disabled=禁用但保留文件 */
  status: 'enabled' | 'disabled';
  
  /** 安装时间戳 (ISO 8601) */
  installedAt: string;
  
  /** 最后使用时间戳 (ISO 8601) */
  lastUsedAt: string;
  
  /** 模块版本号 */
  version?: string;
  
  /** 模块来源: local=本地内置, remote=远程下载 */
  source: 'local' | 'remote';
  
  /** 远程模块的缓存文件路径 (仅 remote 类型) */
  cachedPath?: string;
  
  /** 是否固定到快速访问 */
  pinnedToQuickAccess?: boolean;
  
  /** 快速访问排序权重 (数字越小越靠前) */
  quickAccessOrder?: number;
  
  /** 固定到快速访问的时间戳 (ISO 8601) */
  pinnedAt?: string;
}

/**
 * 模块配置文件结构
 */
export interface ModulesConfig {
  /** 配置文件版本 (用于未来迁移) */
  version: string;
  
  /** 已安装的模块列表 */
  installedModules: StoredModuleInfo[];
}

/**
 * 默认配置
 */
export const DEFAULT_MODULES_CONFIG: ModulesConfig = {
  version: '1.0.0',
  installedModules: [],
};
