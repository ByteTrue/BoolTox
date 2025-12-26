/**
 * 品牌配置 - 自动生成，请勿手动编辑
 *
 * 此文件由 scripts/generate-brand-config.mjs 从 package.json 自动生成
 *
 * Fork 后如何修改品牌信息：
 * 1. 编辑 packages/client/package.json
 * 2. 修改 "repository" 字段为你的仓库
 * 3. 修改 "homepage" 字段为你的网站（可选）
 * 4. 运行 pnpm build，此文件将自动更新
 *
 * 或使用环境变量临时覆盖：
 * BRAND_OWNER=your-name BRAND_REPO=your-repo pnpm build
 */

export const BRAND = {
  /** GitHub 用户名或组织名 */
  OWNER: 'ByteTrue',

  /** 主仓库名 */
  REPO: 'BoolTox',

  /** 官网地址 */
  HOMEPAGE: 'https://github.com/ByteTrue/BoolTox',

  /** GitHub 仓库完整 URL */
  GITHUB_URL: 'https://github.com/ByteTrue/BoolTox',

  /** 问题反馈 URL */
  ISSUES_URL: 'https://github.com/ByteTrue/BoolTox/issues',

  /** 工具仓库 URL */
  TOOLS_REPO_URL: 'https://github.com/ByteTrue/booltox-plugins',

  /** 工具仓库名称 */
  TOOLS_REPO_NAME: 'booltox-plugins',
} as const;

/** 品牌配置类型 */
export type BrandConfig = typeof BRAND;
