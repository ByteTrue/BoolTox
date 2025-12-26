#!/usr/bin/env node
/**
 * 品牌配置生成器
 * 从 package.json 推断品牌信息，生成 brand.ts 常量文件
 *
 * 配置来源优先级（从高到低）：
 * 1. 环境变量 (BRAND_OWNER, BRAND_REPO, BRAND_HOMEPAGE, BRAND_TOOLS_REPO)
 * 2. package.json.repository URL 解析结果 (owner/repo)
 * 3. package.json.homepage 字段
 * 4. package.json.booltox.toolsRepo 字段（工具仓库名称）
 * 5. 硬编码默认值 (ByteTrue/BoolTox/booltox-plugins)
 *
 * 注意：BRAND_HOMEPAGE 的默认值会根据解析出的 owner/repo 动态生成
 *       即：https://github.com/${OWNER}/${REPO}
 *
 * 安全检查：检测到 ByteTrue 仓库时警告（本地延迟 5 秒，CI 直接失败）
 *           可设置 SKIP_BRAND_CHECK=true 跳过检查
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '../package.json');
const outputPath = path.resolve(__dirname, '../src/shared/brand.ts');

// 配置值的最大长度限制
const MAX_CONFIG_LENGTH = 200;

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

    // 检测可能的编码问题
    if (pkgContent.includes('\uFFFD')) {
      console.error('\n❌ 错误: package.json 可能不是 UTF-8 编码');
      console.error('   请确保文件使用 UTF-8 编码保存\n');
      process.exit(1);
    }

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
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    console.error('\n❌ 错误: package.json 不是有效的对象');
    console.error(`   实际类型: ${Array.isArray(pkg) ? 'array' : typeof pkg}\n`);
    process.exit(1);
  }

  // 验证 repository 字段类型
  if (pkg.repository) {
    const repoType = typeof pkg.repository;
    if (repoType !== 'string' && repoType !== 'object') {
      console.warn(`\n⚠️  package.json 的 repository 字段类型错误: ${repoType}`);
      console.warn('   期望: string 或 { type, url }');
      console.warn('   将使用默认值\n');
    } else if (repoType === 'object' && pkg.repository) {
      if (!pkg.repository.url) {
        console.warn(`\n⚠️  package.json 的 repository 对象缺少 url 字段`);
        console.warn('   将使用默认值\n');
      } else if (typeof pkg.repository.url !== 'string') {
        console.warn(`\n⚠️  repository.url 类型错误: ${typeof pkg.repository.url}`);
        console.warn('   期望: string');
        console.warn('   将使用默认值\n');
      }
    }
  }

  // 验证 homepage 字段类型
  if (pkg.homepage && typeof pkg.homepage !== 'string') {
    console.warn(`\n⚠️  package.json 的 homepage 字段类型错误: ${typeof pkg.homepage}`);
    console.warn('   期望: string');
    console.warn('   将使用默认值\n');
  }

  // 验证 booltox 字段类型（可选字段）
  if (pkg.booltox) {
    if (typeof pkg.booltox !== 'object' || Array.isArray(pkg.booltox)) {
      console.warn(`\n⚠️  package.json 的 booltox 字段类型错误: ${Array.isArray(pkg.booltox) ? 'array' : typeof pkg.booltox}`);
      console.warn('   期望: object');
      console.warn('   将忽略此字段\n');
      pkg.booltox = undefined;
    } else if (pkg.booltox.toolsRepo && typeof pkg.booltox.toolsRepo !== 'string') {
      console.warn(`\n⚠️  booltox.toolsRepo 类型错误: ${typeof pkg.booltox.toolsRepo}`);
      console.warn('   期望: string');
      console.warn('   将忽略此字段\n');
      delete pkg.booltox.toolsRepo;
    }
  }

  return pkg;
}

/**
 * 解析 GitHub 仓库 URL
 *
 * 支持多种格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - owner/repo
 *
 * @param repository - package.json 的 repository 字段（string 或 object）
 * @returns {{ owner: string, repo: string }} | null
 */
function parseGitHubRepo(repository) {
  if (!repository) return null;

  const url = typeof repository === 'string' ? repository : repository.url;

  // 类型检查
  if (typeof url !== 'string') {
    console.warn(`\n⚠️  repository URL 类型错误: ${typeof url}`);
    console.warn('   期望: string');
    console.warn('   将使用默认值\n');
    return null;
  }

  // 空字符串检查
  if (url.trim() === '') {
    console.warn(`\n⚠️  repository URL 是空字符串`);
    console.warn('   将使用默认值\n');
    return null;
  }

  // 规范化 URL：移除 .git 后缀和尾部斜杠
  const cleanUrl = url.replace(/\.git$/, '').replace(/\/$/, '');

  // 支持多种 GitHub URL 格式
  const patterns = [
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\/|$)/, // https/git@
    /^([\w.-]+)\/([\w.-]+)$/,                       // owner/repo 简写
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2];

      // 验证提取的值格式正确
      if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
        console.error(`\n❌ 错误: 仓库信息包含非法字符`);
        console.error(`   Owner: ${owner}`);
        console.error(`   Repo: ${repo}`);
        console.error('   只允许字母、数字、横杠和点\n');
        process.exit(1);
      }

      // 验证不是连续的特殊字符或以特殊字符开头/结尾
      if (/^[.-]|[.-]$|[.-]{2,}/.test(owner) || /^[.-]|[.-]$|[.-]{2,}/.test(repo)) {
        console.error(`\n❌ 错误: 仓库信息格式不正确`);
        console.error(`   Owner: ${owner}`);
        console.error(`   Repo: ${repo}`);
        console.error('   不能以点或横杠开头/结尾，不能包含连续的点或横杠\n');
        process.exit(1);
      }

      return { owner, repo };
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
 * 按优先级（env > pkg > default）查找第一个有效值
 *
 * @param envKey - 环境变量名（如 'BRAND_OWNER'）
 * @param pkgValue - 从 package.json 解析的值（可能为 null/undefined）
 * @param defaultValue - 硬编码默认值
 * @returns {{ value: string, source: 'env'|'pkg'|'default' }}
 */
function resolveConfig(envKey, pkgValue, defaultValue) {
  const sources = [
    { value: process.env[envKey]?.trim(), source: 'env' },
    { value: pkgValue, source: 'pkg' },
    { value: defaultValue, source: 'default' },
  ];

  // 过滤掉 undefined/null/空字符串
  const validSources = sources.filter(s => s.value !== undefined && s.value !== null && s.value !== '');

  if (validSources.length === 0) {
    console.error(`\n❌ 错误: 无法解析配置 ${envKey}`);
    console.error('   所有配置源都未提供有效值\n');
    process.exit(1);
  }

  const result = validSources[0];

  // 验证长度
  if (result.value.length > MAX_CONFIG_LENGTH) {
    console.error(`\n❌ 错误: ${envKey} 配置过长 (${result.value.length} 字符)`);
    console.error(`   最大允许: ${MAX_CONFIG_LENGTH} 字符\n`);
    process.exit(1);
  }

  return result;
}

/**
 * 转义字符串用于 TypeScript 字符串字面量
 * 防止注入攻击和语法错误
 *
 * @param str - 要转义的字符串
 * @returns 转义后的字符串
 */
function escapeString(str) {
  // 验证不包含控制字符
  if (/[\x00-\x1F\x7F-\x9F]/.test(str)) {
    console.error(`\n❌ 错误: 配置值包含控制字符`);
    console.error(`   值: ${JSON.stringify(str)}`);
    console.error('   这可能导致生成的代码损坏\n');
    process.exit(1);
  }

  // 转义特殊字符
  return str
    .replace(/\\/g, '\\\\')   // 反斜杠
    .replace(/'/g, "\\'")     // 单引号
    .replace(/\n/g, '\\n')    // 换行符
    .replace(/\r/g, '\\r')    // 回车符
    .replace(/\t/g, '\\t');   // 制表符
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
      console.warn('按 Ctrl+C 可取消');
      console.warn('提示：可设置 SKIP_BRAND_CHECK=true 跳过此检查\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * 安全写入文件（使用临时文件 + rename 模式）
 *
 * 在 POSIX 系统上保证原子性，Windows 上最大限度减少写入失败概率
 *
 * 策略:
 * 1. 写入 .tmp 临时文件
 * 2. rename 覆盖目标文件（POSIX 保证原子性）
 * 3. 失败时清理临时文件
 */
function writeFileSafe(filePath, content) {
  const tempPath = `${filePath}.tmp.${Date.now()}.${process.pid}`;
  const dir = path.dirname(filePath);

  // 检查输出路径是否被目录占用
  if (fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.error(`\n❌ 错误: 输出路径是个目录`);
        console.error(`   路径: ${filePath}`);
        console.error('   请删除该目录后重试\n');
        process.exit(1);
      }
    } catch (error) {
      // 忽略 statSync 错误，让后续写入操作处理
    }
  }

  // 创建输出目录
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    // recursive: true 不会抛 EEXIST，所以所有错误都是致命的
    console.error('\n❌ 错误: 无法创建输出目录');
    console.error(`   目录: ${dir}`);
    console.error(`   原因: ${error.message}`);
    if (error.code === 'EACCES') {
      console.error('   提示: 检查目录权限');
    } else if (error.code === 'ENOSPC') {
      console.error('   提示: 磁盘空间不足');
    } else if (error.code === 'EROFS') {
      console.error('   提示: 文件系统只读');
    }
    console.error('');
    process.exit(1);
  }

  // 写入文件（原子性）
  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // 清理临时文件
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      // 清理失败不致命，但需要告警
      console.warn(`\n⚠️  警告: 清理临时文件失败`);
      console.warn(`   文件: ${tempPath}`);
      console.warn(`   原因: ${cleanupError.message}`);
      console.warn('   请手动删除该文件\n');
    }

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

  // 5. 生成 brand.ts 内容（所有值都经过转义）
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
 * 4. 修改 "booltox.toolsRepo" 字段指定工具仓库名称（可选）
 * 5. 运行 pnpm build 或 pnpm dev，此文件将自动更新
 *
 * 或使用环境变量临时覆盖：
 * BRAND_OWNER=your-name BRAND_REPO=your-repo pnpm build
 */

export const BRAND = {
  /** GitHub 用户名或组织名 */
  OWNER: '${escapeString(owner.value)}',

  /** 主仓库名 */
  REPO: '${escapeString(repo.value)}',

  /** 官网地址 */
  HOMEPAGE: '${escapeString(homepage.value)}',

  /** GitHub 仓库完整 URL */
  GITHUB_URL: 'https://github.com/${escapeString(owner.value)}/${escapeString(repo.value)}',

  /** 问题反馈 URL */
  ISSUES_URL: 'https://github.com/${escapeString(owner.value)}/${escapeString(repo.value)}/issues',

  /** 工具仓库 URL */
  TOOLS_REPO_URL: 'https://github.com/${escapeString(owner.value)}/${escapeString(toolsRepo.value)}',

  /** 工具仓库名称 */
  TOOLS_REPO_NAME: '${escapeString(toolsRepo.value)}',
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
  console.error('\n========================================');
  console.error('❌ 脚本执行失败');
  console.error('========================================\n');

  // 区分已知错误和未知错误
  if (error.code) {
    console.error(`错误代码: ${error.code}`);
  }

  console.error(`错误消息: ${error.message}`);
  console.error(`\n详细堆栈:\n${error.stack}\n`);

  console.error('这可能是脚本内部错误，请报告此问题：');
  console.error('https://github.com/ByteTrue/BoolTox/issues\n');

  process.exit(1);
});
