#!/usr/bin/env node
/**
 * 品牌配置生成器
 * 从 package.json 推断所有品牌信息，生成 brand.ts 常量文件
 *
 * 优先级: 环境变量 > package.json > 默认值
 * 安全检查: 检测到 ByteTrue 仓库时警告，防止误发布
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '../package.json');
const outputPath = path.resolve(__dirname, '../src/shared/brand.ts');

// 读取 package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

/**
 * 解析 GitHub 仓库 URL
 */
function parseGitHubRepo(repository) {
  if (!repository) return null;

  const url = typeof repository === 'string' ? repository : repository.url;
  if (!url) return null;

  // 匹配 https://github.com/owner/repo 或 git@github.com:owner/repo
  const match = url.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

const repoInfo = parseGitHubRepo(pkg.repository);

// 提取配置（优先级：环境变量 > package.json > 推断 > 默认值）
const owner = process.env.BRAND_OWNER || repoInfo?.owner || 'ByteTrue';
const repo = process.env.BRAND_REPO || repoInfo?.repo || 'BoolTox';
const homepage = process.env.BRAND_HOMEPAGE || pkg.homepage || `https://github.com/${owner}/${repo}`;
const toolsRepoName = process.env.BRAND_TOOLS_REPO || 'booltox-plugins';

// 安全检查：检测到原仓库时警告
if (owner === 'ByteTrue' && repo === 'BoolTox' && !process.env.FORCE_BUILD) {
  console.warn('');
  console.warn('⚠️  检测到 ByteTrue/BoolTox 仓库配置');
  console.warn('');
  console.warn('   如果你是 Fork 用户，请修改以下配置：');
  console.warn('   1. 编辑 packages/client/package.json');
  console.warn('   2. 修改 "repository" 字段为你的仓库地址');
  console.warn('');
  console.warn('   或者设置环境变量：');
  console.warn('   BRAND_OWNER=你的用户名 BRAND_REPO=你的仓库名 pnpm build');
  console.warn('');
  console.warn('   构建将在 5 秒后继续...');
  console.warn('');

  // 延迟 5 秒，给用户反应时间
  await new Promise(resolve => setTimeout(resolve, 5000));
}

// 生成 brand.ts 文件内容
const brandTsContent = `/**
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
  OWNER: '${owner}',

  /** 主仓库名 */
  REPO: '${repo}',

  /** 官网地址 */
  HOMEPAGE: '${homepage}',

  /** GitHub 仓库完整 URL */
  GITHUB_URL: 'https://github.com/${owner}/${repo}',

  /** 问题反馈 URL */
  ISSUES_URL: 'https://github.com/${owner}/${repo}/issues',

  /** 工具仓库 URL */
  TOOLS_REPO_URL: 'https://github.com/${owner}/${toolsRepoName}',

  /** 工具仓库名称 */
  TOOLS_REPO_NAME: '${toolsRepoName}',
} as const;

/** 品牌配置类型 */
export type BrandConfig = typeof BRAND;
`;

// 确保目录存在
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 写入文件
fs.writeFileSync(outputPath, brandTsContent, 'utf-8');

console.log('✅ 品牌配置已生成');
console.log(`   Owner: ${owner}`);
console.log(`   Repo: ${repo}`);
console.log(`   Homepage: ${homepage}`);
console.log(`   输出: ${path.relative(process.cwd(), outputPath)}`);
