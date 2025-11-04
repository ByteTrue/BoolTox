import path from 'node:path';
import { promises as fs } from 'node:fs';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

import {
  loadRawConfig,
  normalizeConfig,
  saveConfig,
  publishRelease,
  syncReleases,
} from './release-manager.mjs';

const clientRoot = process.cwd();

const rl = createInterface({ input, output });

const ask = async (question, defaultValue = '') => {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
};

const askRequired = async (question, defaultValue = '') => {
  while (true) {
    const value = await ask(question, defaultValue);
    if (value) return value;
    console.log('⚠️ 该项不能为空');
  }
};

const askSelect = async (question, options, defaultValue) => {
  const display = options.join('/');
  while (true) {
    const value = (await ask(`${question} [${display}]`, defaultValue)).toLowerCase();
    if (options.includes(value)) {
      return value;
    }
    console.log(`⚠️ 请输入 ${display} 之一`);
  }
};

const askBoolean = async (question, defaultValue = false) => {
  const def = defaultValue ? 'y' : 'n';
  while (true) {
    const value = (await ask(`${question} [y/N]`, def)).toLowerCase();
    if (!value) return defaultValue;
    if (['y', 'yes'].includes(value)) return true;
    if (['n', 'no'].includes(value)) return false;
    console.log('⚠️ 请输入 y 或 n');
  }
};

const resolveInputPath = (inputPath) => {
  if (!inputPath) {
    return clientRoot;
  }
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  return path.resolve(clientRoot, inputPath);
};

const normalizeEnvPath = (absPath) => {
  const relative = path.relative(clientRoot, absPath) || '.';
  return relative.split(path.sep).join('/');
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const ensureFileFromTemplate = async (targetPath, templates) => {
  if (await fileExists(targetPath)) {
    return false;
  }
  for (const template of templates) {
    if (await fileExists(template)) {
      await fs.copyFile(template, targetPath);
      return true;
    }
  }
  await fs.writeFile(targetPath, '# Booltox Admin environment\n', 'utf8');
  return true;
};

const upsertEnvKeys = async (filePath, updates) => {
  const updateEntries = updates instanceof Map ? updates : new Map(Object.entries(updates));
  let content = '';
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  const lines = content ? content.split(/\r?\n/) : [];
  const handled = new Set();
  const result = lines.map((line) => {
    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=.*/);
    if (match) {
      const key = match[1];
      if (updateEntries.has(key)) {
        handled.add(key);
        return `${key}=${updateEntries.get(key) ?? ''}`;
      }
    }
    return line;
  });

  for (const [key, value] of updateEntries) {
    if (!handled.has(key)) {
      result.push(`${key}=${value ?? ''}`);
    }
  }

  const output = result.join('\n').replace(/\s*$/, '');
  await fs.writeFile(filePath, `${output}\n`, 'utf8');
};

const ensureAdminEnv = async ({
  adminProjectDir,
  platform,
  repository,
  token,
  baseUrl,
  releaseToken,
}) => {
  const envPath = path.join(adminProjectDir, '.env.local');
  const created = await ensureFileFromTemplate(envPath, [
    path.join(adminProjectDir, '.env.local.example'),
    path.join(adminProjectDir, '.env.example'),
    path.join(adminProjectDir, 'ops', '.env.compose'),
  ]);
  if (created) {
    console.log(`📝 已创建后台环境文件: ${normalizeEnvPath(envPath)}`);
  }

  const updates = new Map();
  updates.set('GIT_RELEASE_PROVIDER', platform);
  updates.set('GIT_RELEASE_REPOSITORY', repository);
  updates.set('GIT_RELEASE_TOKEN', token);
  updates.set('GIT_RELEASE_BASE_URL', platform === 'gitlab' ? baseUrl ?? '' : '');
  updates.set('RELEASE_SERVICE_TOKEN', releaseToken);

  await upsertEnvKeys(envPath, updates);
  console.log(`✅ 已更新后台环境变量文件: ${normalizeEnvPath(envPath)}`);
};

const askPath = async (question, defaultValue) => {
  while (true) {
    const value = await ask(question, defaultValue);
    const resolved = resolveInputPath(value);
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        console.log('⚠️ 目标路径不是目录');
        continue;
      }
      return { input: value, resolved };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        console.log('⚠️ 路径不存在');
        continue;
      }
      throw error;
    }
  }
};

const ensureUrl = async (value, fallback) => {
  while (true) {
    const candidate = value ?? fallback ?? '';
    try {
      if (candidate) {
        new URL(candidate);
        return candidate.replace(/\/$/, '');
      }
    } catch {
      console.log('⚠️ 请输入合法的 URL');
      value = await ask('URL');
      continue;
    }
    value = await ask('URL');
  }
};

const normalizeRepository = (platform, value) => {
  if (!value) {
    return value;
  }
  const trimmed = value.trim();
  try {
    if (trimmed.includes('://')) {
      const url = new URL(trimmed);
      const segments = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
      return segments;
    }
  } catch {
    // ignore parse error, fall through
  }
  return trimmed.replace(/^\//, '').replace(/\.git$/, '');
};

const configure = async () => {
  const raw = await loadRawConfig();
  const cfg = normalizeConfig(raw);

  console.log('\n=== 发布环境配置 ===');

  const defaultAdminRelative = cfg.adminProjectDir && cfg.adminProjectDir.length > 0 ? cfg.adminProjectDir : '../booltox-admin';
  const { resolved: adminProjectDir } = await askPath('后台项目目录', defaultAdminRelative);
  const ADMIN_PROJECT_DIR = normalizeEnvPath(adminProjectDir);

  const ADMIN_API_BASE_URL = await ensureUrl(
    await ask('后台 API 地址', cfg.adminApiBaseUrl ?? 'http://localhost:3000'),
    'http://localhost:3000',
  );
  const ADMIN_RELEASE_TOKEN = await askRequired('后台发布令牌', cfg.adminReleaseToken ?? '');

  const platform = await askSelect('安装包托管平台', ['github', 'gitlab'], cfg.releasePlatform ?? 'github');

  let RELEASE_GIT_BASE_URL = cfg.releaseGitBaseUrl ?? '';
  if (platform === 'gitlab') {
    RELEASE_GIT_BASE_URL = await ensureUrl(
      await ask('GitLab 基础地址', RELEASE_GIT_BASE_URL || 'https://gitlab.com'),
      'https://gitlab.com',
    );
  } else {
    RELEASE_GIT_BASE_URL = '';
  }

  const rawRepository = await askRequired(
    platform === 'github' ? '仓库 (owner/repo)' : '项目 (namespace/project)',
    cfg.releaseRepository ?? '',
  );
  const RELEASE_REPOSITORY = normalizeRepository(platform, rawRepository);
  const RELEASE_GIT_TOKEN = await askRequired('托管平台访问令牌', cfg.releaseGitToken ?? '');
  const RELEASE_GIT_REF = await ask('构建分支/Tag (GitLab 可选)', cfg.releaseGitRef ?? 'main');
  const RELEASE_TAG_PREFIX = await ask('Tag 前缀', cfg.releaseTagPrefix ?? 'v');

  const RELEASE_CHANNEL = (await askSelect(
    '默认发布渠道',
    ['stable', 'beta', 'alpha'],
    (cfg.releaseChannel ?? 'STABLE').toLowerCase(),
  )).toUpperCase();
  const RELEASE_TENANT_ID = await ask('默认租户 ID (可留空)', cfg.releaseTenantId ?? '');
  const RELEASE_MANDATORY = (await askBoolean('默认是否强制更新', cfg.releaseMandatory ?? false)) ? 'true' : 'false';
  const RELEASE_ROLLOUT_PERCENT = await ask('默认灰度百分比 (1-100)', String(cfg.releaseRolloutPercent ?? 100));

  const RELEASE_NOTES_FILE = await ask('版本说明文件路径 (可留空)', cfg.releaseNotesFile ?? '');
  const RELEASE_ANNOUNCE_TITLE = await ask('默认公告标题 (可留空)', cfg.releaseAnnounceTitle ?? '');
  const RELEASE_ANNOUNCE_FILE = await ask('公告内容文件路径 (可留空)', cfg.releaseAnnounceFile ?? '');

  const entries = new Map();
  entries.set('ADMIN_PROJECT_DIR', ADMIN_PROJECT_DIR);
  entries.set('ADMIN_API_BASE_URL', ADMIN_API_BASE_URL);
  entries.set('ADMIN_RELEASE_TOKEN', ADMIN_RELEASE_TOKEN);
  entries.set('RELEASE_PLATFORM', platform);
  entries.set('RELEASE_REPOSITORY', RELEASE_REPOSITORY);
  entries.set('RELEASE_GIT_TOKEN', RELEASE_GIT_TOKEN);
  entries.set('RELEASE_GIT_BASE_URL', RELEASE_GIT_BASE_URL);
  entries.set('RELEASE_GIT_REF', RELEASE_GIT_REF);
  entries.set('RELEASE_TAG_PREFIX', RELEASE_TAG_PREFIX);
  entries.set('RELEASE_CHANNEL', RELEASE_CHANNEL);
  entries.set('RELEASE_TENANT_ID', RELEASE_TENANT_ID);
  entries.set('RELEASE_MANDATORY', RELEASE_MANDATORY);
  entries.set('RELEASE_ROLLOUT_PERCENT', RELEASE_ROLLOUT_PERCENT);
  entries.set('RELEASE_NOTES_FILE', RELEASE_NOTES_FILE);
  entries.set('RELEASE_ANNOUNCE_TITLE', RELEASE_ANNOUNCE_TITLE);
  entries.set('RELEASE_ANNOUNCE_FILE', RELEASE_ANNOUNCE_FILE);

  await saveConfig(entries);
  console.log('\n✅ 已更新 .env.release.local');

  await ensureAdminEnv({
    adminProjectDir,
    platform,
    repository: RELEASE_REPOSITORY,
    token: RELEASE_GIT_TOKEN,
    baseUrl: RELEASE_GIT_BASE_URL,
    releaseToken: ADMIN_RELEASE_TOKEN,
  });
};

const publish = async () => {
  console.log('\n=== 构建并发布安装包 ===');
  const skipBuild = !(await askBoolean('是否重新执行构建', true)) ? true : false;
  try {
    const result = await publishRelease({ skipBuild });
    console.log('\n✅ 发布成功');
    console.table([{ Version: result.version, Provider: result.uploadResult.provider, Tag: result.uploadResult.tagName }]);
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message ?? error);
  }
};

const syncOnly = async () => {
  console.log('\n=== 仅同步 Git Release ===');
  try {
    const raw = await loadRawConfig();
    const cfg = normalizeConfig(raw);
    await syncReleases(cfg);
    console.log('✅ 已触发后台同步');
  } catch (error) {
    console.error('❌ 同步失败:', error.message ?? error);
  }
};

const mainMenu = async () => {
  while (true) {
    console.log('\n--- Booltox 发布助手 ---');
    console.log('1. 配置发布环境');
    console.log('2. 构建并发布');
    console.log('3. 仅同步 Git Release');
    console.log('4. 退出');
    const choice = await ask('请选择', '4');
    if (choice === '1') {
      await configure();
    } else if (choice === '2') {
      await publish();
    } else if (choice === '3') {
      await syncOnly();
    } else if (choice === '4') {
      break;
    } else {
      console.log('⚠️ 无效选项');
    }
  }
};

const run = async () => {
  if (process.argv.includes('--setup')) {
    await configure();
    rl.close();
    return;
  }

  if (process.argv.includes('--sync')) {
    await syncOnly();
    rl.close();
    return;
  }

  await mainMenu();
  rl.close();
};

run().catch((error) => {
  console.error('❌ 运行失败:', error.message ?? error);
  rl.close();
  process.exitCode = 1;
});
