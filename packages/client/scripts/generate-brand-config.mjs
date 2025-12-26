#!/usr/bin/env node
/**
 * 品牌配置生成器
 * 从 package.json 推断品牌信息，生成 brand.ts 常量文件
 *
 * 配置来源优先级（从高到低）：
 * 1. 环境变量 (BRAND_OWNER, BRAND_REPO, BRAND_HOMEPAGE, BRAND_TOOLS_REPO)
 * 2. package.json.repository URL 解析结果 (owner/repo)
 * 3. package.json.homepage 字段
 * 4. 硬编码默认值 (ByteTrue/BoolTox/booltox-plugins)
 *
 * 安全检查: 检测到 ByteTrue 仓库时警告（本地延迟 5 秒，CI 直接失败）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '../package.json');
const outputPath = path.resolve(__dirname, '../src/shared/brand.ts');

// 检测 CI 环境
const isCI = process.env.CI === 'true' ||
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.GITLAB_CI === 'true' ||
             process.env.CIRCLECI === 'true';

/**
 * 读取并验证 package.json
 */
function loadPackageJson() {
  let pkg;
  try {
    const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
    pkg = JSON.parse(pkgContent);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ 品牌配置生成失败');
    console.error('========================================\n');

    if (error.code === 'ENOENT') {
      console.error(`找不到 package.json 文件`);
      console.error(`预期路径: ${pkgPath}`);
      console.error(`当前工作目录: ${process.cwd()}\n`);
    } else if (error.code === 'EACCES') {
      console.error(`没有权限读取 package.json`);
      console.error(`文件路径: ${pkgPath}\n`);
    } else if (error instanceof SyntaxError) {
      console.error(`package.json 格式错误`);
      console.error(`${error.message}`);
      console.error(`请检查 JSON 语法是否正确（无尾逗号、无注释）\n`);
    } else {
      console.error(`读取 package.json 失败: ${error.message}\n`);
    }

    console.error('解决方案：');
    console.error('1. 检查文件是否存在');
    console.error('2. 检查文件权限');
    console.error('3. 验证 JSON 格式');
    console.error('4. 或使用环境变量覆盖：');
    console.error('   BRAND_OWNER=your-name BRAND_REPO=your-repo pnpm build\n');

    process.exit(1);
  }

  // 验证必需字段
  if (!pkg || typeof pkg !== 'object') {
    console.error('\n❌ 错误: package.json 不是有效的对象\n');
    process.exit(1);
  }

  // 验证 repository 字段类型
  if (pkg.repository) {
    const repoType = typeof pkg.repository;
    if (repoType !== 'string' && repoType !== 'object') {
      console.warn(`\n⚠️  package.json 的 repository 字段类型错误: ${repoType}`);
      console.warn('   期望: string 或 { type, url }');
      console.warn('   将使用默认值\n');
    }
  }

  // 验证 homepage 字段类型
  if (pkg.homepage && typeof pkg.homepage !== 'string') {
    console.warn(`\n⚠️  package.json 的 homepage 字段类型错误: ${typeof pkg.homepage}`);
    console.warn('   期望: string');
    console.warn('   将使用默认值\n');
  }

  return pkg;
}

/**
 * 解析 GitHub 仓库 URL
 * 支持多种格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - owner/repo
 */
function parseGitHubRepo(repository) {
  if (!repository) return null;

  const url = typeof repository === 'string' ? repository : repository.url;
  if (!url) return null;

  // 移除常见后缀
  const cleanUrl = url.replace(/\.git$/, '');

  // 支持多种 GitHub URL 格式
  const patterns = [
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\/|$)/, // https/git@
    /^([\w.-]+)\/([\w.-]+)$/,                       // owner/repo 简写
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  // 无法解析时明确告警
  console.warn('\n========================================');
  console.warn(`⚠️  无法解析 repository URL: ${url}`);
  console.warn('========================================');
  console.warn('\n支持的格式:');
  console.warn('  - https://github.com/owner/repo');
  console.warn('  - git@github.com:owner/repo');
  console.warn('  - owner/repo');
  console.warn('\n将使用默认值 ByteTrue/BoolTox');
  console.warn('如需自定义，请设置环境变量:');
  console.warn('  BRAND_OWNER=your-name BRAND_REPO=your-repo\n');

  return null;
}

/**
 * 统一的配置解析函数
 */
function resolveConfig(envKey, pkgValue, defaultValue) {
  const sources = [
    { value: process.env[envKey]?.trim(), source: 'env' },
    { value: pkgValue, source: 'pkg' },
    { value: defaultValue, source: 'default' },
  ];

  const result = sources.find(s => s.value);
  return { value: result.value, source: result.source };
}

/**
 * 安全检查：检测到原仓库时警告
 */
async function checkOriginRepo(owner, repo) {
  const skipCheck = process.env.SKIP_BRAND_CHECK === 'true';

  if (owner === 'ByteTrue' && repo === 'BoolTox' && !skipCheck) {
    console.warn('\n========================================');
    console.warn('⚠️  检测到 ByteTrue/BoolTox 仓库配置');
    console.warn('========================================\n');
    console.warn('如果你是 Fork 用户，请修改以下配置：');
    console.warn('  1. 编辑 packages/client/package.json');
    console.warn('  2. 修改 "repository" 字段为你的仓库地址\n');
    console.warn('或者设置环境变量：');
    console.warn('  BRAND_OWNER=你的用户名 BRAND_REPO=你的仓库名 pnpm build\n');

    if (isCI) {
      console.error('❌ 错误: 在 CI 环境中检测到默认仓库配置');
      console.error('   请在 CI 中设置 SKIP_BRAND_CHECK=true 或正确配置仓库信息\n');
      process.exit(1);
    } else {
      console.warn('构建将在 5 秒后继续...');
      console.warn('按 Ctrl+C 可取消\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * 原子性写入文件
 */
function writeFileSafe(filePath, content) {
  const tempPath = filePath + '.tmp';
  const dir = path.dirname(filePath);

  // 创建输出目录
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('\n❌ 错误: 无法创建输出目录');
      console.error(`   目录: ${dir}`);
      console.error(`   原因: ${error.message}`);
      if (error.code === 'EACCES') {
        console.error('   提示: 检查目录权限');
      } else if (error.code === 'ENOSPC') {
        console.error('   提示: 磁盘空间不足');
      }
      console.error('');
      process.exit(1);
    }
  }

  // 写入文件（原子性）
  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // 清理临时文件
    try {
      fs.unlinkSync(tempPath);
    } catch {}

    console.error('\n❌ 错误: 无法写入品牌配置文件');
    console.error(`   文件: ${filePath}`);
    console.error(`   原因: ${error.message}`);
    if (error.code === 'EACCES') {
      console.error('   提示: 检查文件权限');
    } else if (error.code === 'ENOSPC') {
      console.error('   提示: 磁盘空间不足');
    } else if (error.code === 'EISDIR') {
      console.error('   提示: 目标路径是个目录，请删除后重试');
    }
    console.error('');
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  // 1. 读取 package.json
  const pkg = loadPackageJson();

  // 2. 解析仓库信息
  const repoInfo = parseGitHubRepo(pkg.repository);

  // 3. 提取配置
  const owner = resolveConfig('BRAND_OWNER', repoInfo?.owner, 'ByteTrue');
  const repo = resolveConfig('BRAND_REPO', repoInfo?.repo, 'BoolTox');
  const homepage = resolveConfig('BRAND_HOMEPAGE', pkg.homepage, `https://github.com/${owner.value}/${repo.value}`);
  const toolsRepo = resolveConfig('BRAND_TOOLS_REPO', pkg.booltox?.toolsRepo, 'booltox-plugins');

  // 4. 安全检查
  await checkOriginRepo(owner.value, repo.value);

  // 5. 生成 brand.ts 内容
  const brandTsContent = `/**
 * 品牌配置 - 自动生成，请勿手动编辑
 *
 * 此文件由 scripts/generate-brand-config.mjs 从 package.json 自动生成
 *
 * 生成时机:
 * - 运行 pnpm build 时通过 prebuild 钩子自动生成
 * - 运行 pnpm dev 时通过 predev 钩子自动生成
 * - 手动运行 node scripts/generate-brand-config.mjs 也会生成
 *
 * Fork 后如何修改品牌信息：
 * 1. 编辑 packages/client/package.json
 * 2. 修改 "repository" 字段为你的仓库
 * 3. 修改 "homepage" 字段为你的网站（可选）
 * 4. 运行 pnpm build 或 pnpm dev，此文件将自动更新
 *
 * 或使用环境变量临时覆盖：
 * BRAND_OWNER=your-name BRAND_REPO=your-repo pnpm build
 */

export const BRAND = {
  /** GitHub 用户名或组织名 */
  OWNER: '${owner.value}',

  /** 主仓库名 */
  REPO: '${repo.value}',

  /** 官网地址 */
  HOMEPAGE: '${homepage.value}',

  /** GitHub 仓库完整 URL */
  GITHUB_URL: 'https://github.com/${owner.value}/${repo.value}',

  /** 问题反馈 URL */
  ISSUES_URL: 'https://github.com/${owner.value}/${repo.value}/issues',

  /** 工具仓库 URL */
  TOOLS_REPO_URL: 'https://github.com/${owner.value}/${toolsRepo.value}',

  /** 工具仓库名称 */
  TOOLS_REPO_NAME: '${toolsRepo.value}',
} as const;

/** 品牌配置类型 */
export type BrandConfig = typeof BRAND;
`;

  // 6. 写入文件
  writeFileSafe(outputPath, brandTsContent);

  // 7. 输出成功信息
  console.log('\n========================================');
  console.log('✅ 品牌配置已生成');
  console.log('========================================\n');
  console.log('配置信息:');
  console.log(`  Owner:    ${owner.value.padEnd(20)} (${owner.source})`);
  console.log(`  Repo:     ${repo.value.padEnd(20)} (${repo.source})`);
  console.log(`  Homepage: ${homepage.value.padEnd(20)} (${homepage.source})`);
  console.log(`  Tools:    ${toolsRepo.value.padEnd(20)} (${toolsRepo.source})`);
  console.log(`\n输出文件: ${path.relative(process.cwd(), outputPath)}\n`);
}

// 执行主函数
main().catch(error => {
  console.error('\n❌ 未预期的错误:', error.message);
  console.error(error.stack);
  process.exit(1);
});
