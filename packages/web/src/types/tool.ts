/**
 * 工具类型：在线工具 vs Client 工具
 */
export type ToolType = "online" | "client";

/**
 * 工具状态
 */
export type ToolStatus = "available" | "coming-soon";

/**
 * 工具接口定义
 */
export interface Tool {
  /** 唯一标识（URL 友好） */
  id: string;
  /** 工具名称 */
  name: string;
  /** 一句话描述 */
  description: string;
  /** Lucide 图标名称 */
  icon: string;
  /** 工具类型：区分在线/Client */
  type: ToolType;
  /** 分类（dev/media/file/text/design） */
  category: string;
  /** 标签 */
  tags: string[];
  /** 状态 */
  status: ToolStatus;

  // Client 工具专属字段
  /** 运行时（python/node/binary） */
  runtime?: string;
  /** 安装命令 */
  installCommand?: string;

  // 可选字段
  /** 版本号 */
  version?: string;
  /** 作者 */
  author?: string;
  /** 主页链接 */
  homepage?: string;
  /** Markdown 文档 */
  readme?: string;
}
