/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadRawConfig,
  normalizeConfig,
  saveConfig,
  publishRelease,
} from './release-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const normalizeRepository = (value) => {
  if (!value) return value;
  const trimmed = value.trim();
  try {
    if (trimmed.includes('://')) {
      const url = new URL(trimmed);
      return url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    }
  } catch {
    // ignore
  }
  return trimmed.replace(/^\//, '').replace(/\.git$/, '');
};

const askChoice = async (title, choices, defaultValue) => {
  console.log(`\n${title}`);
  choices.forEach((choice, idx) => {
    const hint = choice.hint ? ` — ${choice.hint}` : '';
    console.log(`  ${idx + 1}. ${choice.label}${hint}`);
  });

  while (true) {
    const answer = (await ask('请选择', defaultValue)).trim();
    const byIndex = Number.parseInt(answer, 10);
    if (!Number.isNaN(byIndex) && byIndex >= 1 && byIndex <= choices.length) {
      return choices[byIndex - 1].value;
    }
    const byValue = choices.find((choice) => choice.value === answer);
    if (byValue) {
      return byValue.value;
    }
    console.log('⚠️ 输入序号或 value');
  }
};

const askBoolean = async (question, defaultValue = true) => {
  const value = await askChoice(
    question,
    [
      { value: 'yes', label: '是' },
      { value: 'no', label: '否' },
    ],
    defaultValue ? 'yes' : 'no',
  );
  return value === 'yes';
};

const configure = async () => {
  const raw = await loadRawConfig();
  const cfg = normalizeConfig(raw);

  console.log('\n=== 发布环境配置 ===');

  const platform = await askChoice(
    '请选择发布平台',
    [
      { value: 'github', label: 'GitHub Releases' },
      { value: 'gitlab', label: 'GitLab Releases' },
    ],
    cfg.releasePlatform ?? 'github',
  );

  const baseUrl = platform === 'gitlab'
    ? (await ask('GitLab 基础地址', cfg.releaseGitBaseUrl || 'https://gitlab.com')).replace(/\/$/, '')
    : '';

  const repository = normalizeRepository(
    await askRequired(
      platform === 'github' ? '仓库 (owner/repo)' : '项目 (namespace/project)',
      cfg.releaseRepository ?? '',
    ),
  );

  const token = await askRequired('访问令牌 (PAT)', cfg.releaseGitToken ?? '');
  const ref = await ask('构建分支/Tag', cfg.releaseGitRef ?? 'main');
  const tagPrefix = await ask('Tag 前缀', cfg.releaseTagPrefix ?? 'v');
  const channel = (
    await askChoice(
      '默认发布渠道',
      [
        { value: 'STABLE', label: 'STABLE' },
        { value: 'BETA', label: 'BETA' },
        { value: 'ALPHA', label: 'ALPHA' },
      ],
      cfg.releaseChannel ?? 'STABLE',
    )
  ).toUpperCase();

  const notesFile = await ask('版本说明文件路径(可留空)', cfg.releaseNotesFile ?? '');

  const entries = new Map();
  entries.set('RELEASE_PLATFORM', platform);
  entries.set('RELEASE_REPOSITORY', repository);
  entries.set('RELEASE_GIT_TOKEN', token);
  entries.set('RELEASE_GIT_BASE_URL', baseUrl);
  entries.set('RELEASE_GIT_REF', ref);
  entries.set('RELEASE_TAG_PREFIX', tagPrefix);
  entries.set('RELEASE_CHANNEL', channel);
  entries.set('RELEASE_NOTES_FILE', notesFile);

  await saveConfig(entries);
  console.log('\n✅ 已更新 .env.release.local');
};

const generateManifest = async () => {
  console.log('\n=== 生成发布清单 ===');
  const scriptPath = path.join(__dirname, 'generate-release-manifest.mjs');
  execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
};

const publish = async () => {
  console.log('\n=== 构建并发布安装包 ===');
  const rebuild = await askBoolean('是否重新执行构建', true);
  const notesInput = await ask('更新说明(文件路径或直接输入内容,留空使用配置)', '');

  try {
    const result = await publishRelease({ skipBuild: !rebuild, notesInput });
    console.log('\n✅ 发布成功');
    console.table([{ Version: result.version, Provider: result.uploadResult.provider, Tag: result.uploadResult.tagName }]);
  } catch (error) {
    console.error('\n❌ 发布失败:', error?.message ?? error);
  }
};

const mainMenu = async () => {
  while (true) {
    const choice = await askChoice(
      '--- BoolTox 发布工具 ---',
      [
        { value: 'configure', label: '配置发布环境' },
        { value: 'publish', label: '构建并发布' },
        { value: 'manifest', label: '生成发布清单' },
        { value: 'exit', label: '退出' },
      ],
      'exit',
    );

    if (choice === 'configure') {
      await configure();
      continue;
    }

    if (choice === 'publish') {
      await publish();
      continue;
    }

    if (choice === 'manifest') {
      await generateManifest();
      continue;
    }

    break;
  }
};

const run = async () => {
  if (process.argv.includes('--setup')) {
    await configure();
    return;
  }
  await mainMenu();
};

run().catch((error) => {
  console.error('❌ 运行失败:', error?.message ?? error);
  process.exitCode = 1;
}).finally(() => {
  rl.close();
});
