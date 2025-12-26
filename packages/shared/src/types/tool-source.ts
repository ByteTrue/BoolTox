/**
 * 工具源配置
 *
 * 一个工具源 = 一个或多个工具的来源
 * 支持两种类型：
 * 1. remote: 远程 Git 仓库（GitHub/GitLab）
 * 2. local: 本地目录（源码或二进制都是本地目录）
 *
 * Linus 式简化原则：
 * - 消除不必要的分类
 * - 统一管理所有工具来源
 */

/**
 * 工具源配置
 */
export interface ToolSourceConfig {
  /** 唯一标识 (UUID) */
  id: string;

  /** 显示名称 (如"官方工具库"/"我的工具"/"公司内部") */
  name: string;

  /** 是否启用 */
  enabled: boolean;

  /** 工具源类型 */
  type: 'remote' | 'local';

  // ==================== remote 类型字段 ====================
  /** Git 平台类型 */
  provider?: 'github' | 'gitlab';

  /** 仓库所有者 */
  owner?: string;

  /** 仓库名称 */
  repo?: string;

  /** 分支名称 */
  branch?: string;

  /** 自定义 Git 服务器地址 (可选，用于私有化 GitLab) */
  baseUrl?: string;

  /** 访问 Token (可选，用于私有仓库) */
  token?: string;

  // ==================== local 类型字段 ====================
  /** 本地目录路径（源码或二进制所在目录）*/
  localPath?: string;

  /** 优先级 (仅用于 UI 排序，数字越小越靠前) */
  priority: number;
}

/**
 * 工具源配置容器
 */
export interface ToolSourcesConfig {
  /** 配置版本 */
  version: string;

  /** 工具源列表 */
  sources: ToolSourceConfig[];

  /** 本地工具引用（从本地工具源添加的工具）*/
  localToolRefs: LocalToolRef[];
}

/**
 * 本地工具引用
 * 记录从本地工具源添加的工具
 */
export interface LocalToolRef {
  /** 工具 ID */
  id: string;

  /** 工具实际路径 */
  path: string;

  /** 来源工具源 ID */
  sourceId: string;
}
