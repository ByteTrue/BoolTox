/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'node:fs';

import {
  loadRawConfig,
  normalizeConfig,
  saveConfig,
  publishRelease,
} from './release-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = createInterface({ input, output });
readline.emitKeypressEvents(input);

const handleCancel = () => {
  console.log('\n👋 已取消');
  rl.close();
  process.exit(0);
};

rl.on('SIGINT', handleCancel);

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

const askChoice = async (title, options, defaultValue) => {
  const normalized = options.map((option, index) => {
    if (typeof option === 'string') {
      return { value: option, label: option, hint: '', index };
    }
    return { index, ...option };
  });

  const fallback = async () => {
    const display = normalized.map((item) => item.value).join('/');
    while (true) {
      const answer = (await ask(`${title} [${display}]`, defaultValue ?? normalized[0].value))
        .trim()
        .toLowerCase();
      const selected = normalized.find((item) => item.value.toLowerCase() === answer);
      if (selected) {
        return selected.value;
      }
      console.log(`⚠️ 请输入 ${display} 之一`);
    }
  };

  if (!input.isTTY || !output.isTTY) {
    return fallback();
  }

  const wasRaw = Boolean(input.isRaw);
  if (!wasRaw) {
    input.setRawMode(true);
  }

  const defaultIndex = normalized.findIndex((item) => item.value === defaultValue);
  let current = defaultIndex >= 0 ? defaultIndex : 0;
  let renderedLines = 0;
  let searchBuffer = '';
  let searchTimer;

  const render = () => {
    if (renderedLines) {
      output.moveCursor(0, -renderedLines);
      output.clearScreenDown();
    }

    const lines = [''];
    lines.push(title);
    normalized.forEach((item, idx) => {
      const pointer = idx === current ? '>' : ' ';
      const hint = item.hint ? ` — ${item.hint}` : '';
      const ordinal = `${idx + 1}.`.padStart(4, ' ');
      lines.push(`${ordinal} ${pointer} ${item.label}${hint}`);
    });
    lines.push('');
    lines.push('  Up/Down 切换 | 输入序号或关键字 | Enter 确认 | Ctrl+C 取消');

    output.write(`${lines.join('\n')}\n`);
    renderedLines = lines.length + 1;
  };

  return new Promise((resolve) => {
    let onKeypress;

    const cleanup = () => {
      clearTimeout(searchTimer);
      if (onKeypress) {
        input.removeListener('keypress', onKeypress);
      }
      if (!wasRaw) {
        input.setRawMode(false);
      }
      if (renderedLines) {
        output.moveCursor(0, -renderedLines);
        output.clearScreenDown();
        renderedLines = 0;
      }
      console.log('');
    };

    const updateSearch = (char) => {
      searchBuffer += char.toLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchBuffer = '';
      }, 800);
      const match = normalized.find((item) =>
        item.value.toLowerCase().startsWith(searchBuffer) || item.label.toLowerCase().startsWith(searchBuffer),
      );
      if (match) {
        current = match.index;
        render();
      }
    };

    onKeypress = (str, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        handleCancel();
        return;
      }

      if (key.name === 'up') {
        current = (current - 1 + normalized.length) % normalized.length;
        render();
        return;
      }

      if (key.name === 'down') {
        current = (current + 1) % normalized.length;
        render();
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        const choice = normalized[current];
        cleanup();
        resolve(choice.value);
        return;
      }

      if (/^[1-9]$/.test(str)) {
        const idx = Number(str) - 1;
        if (idx >= 0 && idx < normalized.length) {
          current = idx;
          render();
        }
        return;
      }

      if (/[a-z0-9]/i.test(str)) {
        updateSearch(str);
      }
    };

    render();
    input.on('keypress', onKeypress);
  });
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


const ensureUrl = async (value, fallback, label = 'URL') => {
  while (true) {
    const candidate = value ?? fallback ?? '';
    try {
      if (candidate) {
        new URL(candidate);
        return candidate.replace(/\/$/, '');
      }
    } catch {
      console.log('⚠️ 请输入合法的 URL');
      value = await ask(label);
      continue;
    }
    value = await ask(label);
  }
};

/**
 * 扫描可用工具
 */
const scanPlugins = () => {
  const pluginsDir = path.join(__dirname, '../plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }
  
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  
  return entries
    .filter(entry => 
      entry.isDirectory() && 
      !entry.name.startsWith('.') && 
      entry.name !== 'scripts' &&
      entry.name !== 'node_modules'
    )
    .map(entry => {
      const metadataPath = path.join(pluginsDir, entry.name, 'metadata.json');
      let name = entry.name;
      let version = '';
      
      try {
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          name = metadata.name || entry.name;
          version = metadata.version || '';
        }
      } catch (err) {
        // 忽略解析错误,使用默认值
      }
      
      return {
        value: entry.name,
        label: name,
        hint: version ? `v${version} - ${entry.name}` : entry.name,
      };
    });
};

/**
 * 工具打包
 */
const packagePlugin = async () => {
  console.log('\n=== 工具打包工具 ===');
  
  const plugins = scanPlugins();
  
  if (plugins.length === 0) {
    console.log('⚠️ 未找到任何工具,请确保 plugins/ 目录下有工具项目');
    return;
  }
  
  const pluginId = await askChoice('请选择要打包的工具', plugins);
  
  console.log(`\n📦 正在打包工具: ${pluginId}`);
  
  try {
    const scriptPath = path.join(__dirname, 'package-plugin.mjs');
    execSync(`node "${scriptPath}" ${pluginId}`, { stdio: 'inherit' });
    console.log('\n✅ 工具打包完成!');
  } catch (err) {
    console.error('\n❌ 打包失败:', err.message);
  }
};

/**
 * 扫描可用版本
 */
const scanVersions = () => {
  const releaseDir = path.join(__dirname, '../release');
  
  if (!fs.existsSync(releaseDir)) {
    return [];
  }
  
  const entries = fs.readdirSync(releaseDir, { withFileTypes: true });
  
  return entries
    .filter(entry => 
      entry.isDirectory() && 
      !entry.name.startsWith('.') &&
      entry.name !== 'plugins' &&
      /^\d+\.\d+\.\d+/.test(entry.name) // 匹配版本号格式
    )
    .map(entry => {
      const versionDir = path.join(releaseDir, entry.name);
      const files = fs.readdirSync(versionDir);
      const hasManifest = files.includes('manifest.json');
      
      return {
        value: entry.name,
        label: entry.name,
        hint: hasManifest ? '✓ 已有清单' : '✗ 未生成清单',
      };
    })
    .sort((a, b) => {
      // 按版本号降序排序
      const parseVersion = (v) => v.split('.').map(Number);
      const [aMajor, aMinor, aPatch] = parseVersion(a.value);
      const [bMajor, bMinor, bPatch] = parseVersion(b.value);
      
      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });
};

/**
 * 生成发布清单
 */
const generateManifest = async () => {
  console.log('\n=== 生成发布清单 ===');
  
  const versions = scanVersions();
  
  let version = '';
  
  if (versions.length > 0) {
    const choices = [
      { value: '__auto__', label: '自动检测', hint: '使用 package.json 中的版本' },
      ...versions,
    ];
    
    const selected = await askChoice('请选择版本', choices, '__auto__');
    
    if (selected !== '__auto__') {
      version = selected;
    }
  } else {
    console.log('ℹ️ 未找到已有版本,将使用 package.json 中的版本');
  }
  
  console.log('\n📄 生成清单文件...');
  
  try {
    const scriptPath = path.join(__dirname, 'generate-release-manifest.mjs');
    const cmd = version ? `node "${scriptPath}" ${version}` : `node "${scriptPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('\n✅ 清单生成完成!');
  } catch (err) {
    console.error('\n❌ 生成失败:', err.message);
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

const printHint = (title, lines = []) => {
  console.log(`\n${title}`);
  lines.forEach((line) => console.log(`  - ${line}`));
};

const configure = async () => {
  const raw = await loadRawConfig();
  const cfg = normalizeConfig(raw);

  console.log('\n=== 发布环境配置 ===');
  const platform = await askChoice('请选择安装包托管平台', [
    { value: 'github', label: 'GitHub Releases', hint: '适用于 GitHub 仓库' },
    { value: 'gitlab', label: 'GitLab Releases', hint: '适用于 GitLab 项目' },
  ], cfg.releasePlatform ?? 'github');

  let RELEASE_GIT_BASE_URL = cfg.releaseGitBaseUrl ?? '';
  if (platform === 'gitlab') {
    printHint('GitLab 基础地址', [
      '例如 https://gitlab.com，如果使用自建 GitLab 请输入对应域名',
      '无需输入项目路径，仅需域名部分',
    ]);
    RELEASE_GIT_BASE_URL = await ensureUrl(
      await ask('GitLab 基础地址', RELEASE_GIT_BASE_URL || 'https://gitlab.com'),
      'https://gitlab.com',
      'GitLab 基础地址',
    );
  } else {
    RELEASE_GIT_BASE_URL = '';
  }

  printHint(
    platform === 'github' ? '仓库 owner/repo' : '项目 namespace/project',
    [
      platform === 'github'
        ? 'owner 是 GitHub 用户名或组织，repo 是仓库名'
        : 'namespace 可以是 GitLab 用户、组或子组，project 是项目名',
      '示例：booltox/booltox-client 或 group/subgroup/project',
      '支持粘贴 HTTPS/SSH 仓库地址，脚本会自动提取路径',
    ],
  );
  const rawRepository = await askRequired(
    platform === 'github' ? '仓库 (owner/repo)' : '项目 (namespace/project)',
    cfg.releaseRepository ?? '',
  );
  const RELEASE_REPOSITORY = normalizeRepository(platform, rawRepository);
  printHint('访问令牌 (Personal Access Token)', [
    '需要具备创建 Release 以及上传附件的权限',
    platform === 'github' ? 'GitHub 勾选 repo 范围即可' : 'GitLab 建议开启 api、read_repository、write_repository',
    '凭证仅保存在本地 .env.release.local',
  ]);
  const RELEASE_GIT_TOKEN = await askRequired('托管平台访问令牌', cfg.releaseGitToken ?? '');

  printHint('构建分支或 Tag', [
    '默认 main，如需回溯发布请输入对应 Tag',
    'GitLab 用户可留空使用默认分支',
  ]);
  const RELEASE_GIT_REF = await ask('构建分支/Tag (GitLab 可选)', cfg.releaseGitRef ?? 'main');

  printHint('Tag 前缀', [
    '生成的 Tag 会是 前缀 + 版本号，例如 v1.2.3',
  ]);
  const RELEASE_TAG_PREFIX = await ask('Tag 前缀', cfg.releaseTagPrefix ?? 'v');

  const RELEASE_CHANNEL = (
    await askChoice('默认发布渠道', [
      { value: 'stable', label: 'stable', hint: '正式用户可见' },
      { value: 'beta', label: 'beta', hint: '面向体验用户' },
      { value: 'alpha', label: 'alpha', hint: '内部测试' },
    ], (cfg.releaseChannel ?? 'STABLE').toLowerCase())
  ).toUpperCase();

  printHint('版本说明文件 (可选)', [
    '填写 Markdown 文件路径,例如 resources/announcements/v1.2.3.md',
    '支持相对路径(从项目根目录)或绝对路径',
    '该文件内容会自动上传到 GitHub/GitLab Release 作为更新说明',
    '留空则可在发布后手动撰写 Release Notes',
  ]);
  const RELEASE_NOTES_FILE = await ask('版本说明文件路径 (可留空)', cfg.releaseNotesFile ?? '');

  const entries = new Map();
  entries.set('RELEASE_PLATFORM', platform);
  entries.set('RELEASE_REPOSITORY', RELEASE_REPOSITORY);
  entries.set('RELEASE_GIT_TOKEN', RELEASE_GIT_TOKEN);
  entries.set('RELEASE_GIT_BASE_URL', RELEASE_GIT_BASE_URL);
  entries.set('RELEASE_GIT_REF', RELEASE_GIT_REF);
  entries.set('RELEASE_TAG_PREFIX', RELEASE_TAG_PREFIX);
  entries.set('RELEASE_CHANNEL', RELEASE_CHANNEL);
  entries.set('RELEASE_NOTES_FILE', RELEASE_NOTES_FILE);

  await saveConfig(entries);
  console.log('\n✅ 已更新 .env.release.local');
};

const publish = async () => {
  console.log('\n=== 构建并发布安装包 ===');
  const skipBuild = !(await askBoolean('是否重新执行构建', true)) ? true : false;
  
  printHint('本次发布的更新说明', [
    '你可以直接输入 Markdown 文件路径(如 resources/announcements/v1.2.3.md)',
    '或者留空使用配置文件中的默认路径',
    '也可以直接粘贴文本内容(支持多行)',
  ]);
  const notesInput = await ask('更新说明(文件路径或直接输入内容,留空使用配置)', '');
  
  try {
    const result = await publishRelease({ skipBuild, notesInput });
    console.log('\n✅ 发布成功');
    console.table([{ Version: result.version, Provider: result.uploadResult.provider, Tag: result.uploadResult.tagName }]);
    if (result.notes) {
      console.log('\n📝 更新说明预览:');
      console.log(result.notes.slice(0, 200) + (result.notes.length > 200 ? '...' : ''));
    }
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message ?? error);
  }
};

const updateIndexes = async () => {
  console.log('\n📋 更新资源索引...');
  
  const rootDir = path.resolve(__dirname, '../../../');
  const announcementsDir = path.join(rootDir, 'resources/announcements');
  const pluginsDir = path.join(rootDir, 'resources/plugins');
  
  try {
    // 更新公告索引
    const newsDir = path.join(announcementsDir, 'news');
    const releasesDir = path.join(announcementsDir, 'releases');
    
    const announcements = {
      news: [],
      releases: [],
      lastUpdated: new Date().toISOString()
    };
    
    if (fs.existsSync(newsDir)) {
      announcements.news = fs.readdirSync(newsDir)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
    }
    
    if (fs.existsSync(releasesDir)) {
      announcements.releases = fs.readdirSync(releasesDir)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
    }
    
    const announcementIndexPath = path.join(announcementsDir, 'index.json');
    fs.writeFileSync(announcementIndexPath, JSON.stringify(announcements, null, 2));
    console.log('✅ 公告索引已更新:', announcementIndexPath);
    console.log(`   - 新闻: ${announcements.news.length} 篇`);
    console.log(`   - 版本说明: ${announcements.releases.length} 篇`);
    
    // 更新工具索引
    const plugins = [];
    if (fs.existsSync(pluginsDir)) {
      const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.startsWith('com.booltox.')) continue;
        
        const pluginDir = path.join(pluginsDir, entry.name);
        const manifestPath = path.join(pluginDir, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
          console.warn(`  ⚠️ ${entry.name} 缺少 manifest.json,跳过`);
          continue;
        }
        
        // 检查是否有 metadata.json
        const metadataPath = path.join(pluginDir, 'metadata.json');
        const hasMetadata = fs.existsSync(metadataPath);
        
        // 检查 zip 文件 (优先使用 plugin.zip,其次是 {id}.zip)
        const pluginZipPath = path.join(pluginDir, 'plugin.zip');
        const idZipPath = path.join(pluginDir, `${entry.name}.zip`);
        let zipFile = null;
        
        if (fs.existsSync(pluginZipPath)) {
          zipFile = `${entry.name}/plugin.zip`;
        } else if (fs.existsSync(idZipPath)) {
          zipFile = `${entry.name}/${entry.name}.zip`;
        }
        
        plugins.push({
          id: entry.name,
          metadataFile: hasMetadata 
            ? `${entry.name}/metadata.json` 
            : `${entry.name}/manifest.json`,
          downloadFile: zipFile || `${entry.name}/manifest.json`
        });
      }
    }
    
    const pluginIndex = {
      plugins,
      lastUpdated: new Date().toISOString()
    };
    
    const pluginIndexPath = path.join(pluginsDir, 'index.json');
    fs.writeFileSync(pluginIndexPath, JSON.stringify(pluginIndex, null, 2));
    console.log('✅ 工具索引已更新:', pluginIndexPath);
    console.log(`   - 工具数量: ${plugins.length} 个`);
    
  } catch (error) {
    console.error('❌ 更新索引失败:', error.message);
  }
  
  // 询问是否清除 CDN 缓存
  const shouldPurge = await askChoice('\n是否清除 jsDelivr CDN 缓存?', [
    { value: 'yes', label: '是', hint: '清除后立即生效(推荐)' },
    { value: 'no', label: '否', hint: '跳过此步骤' },
  ], 'yes');
  
  if (shouldPurge === 'yes') {
    await purgeCdnCache();
  }
};

const purgeCdnCache = async () => {
  console.log('\n🔄 清除 jsDelivr CDN 缓存...');
  
  const owner = 'ByteTrue';
  const repo = 'BoolTox';
  const branch = 'ref';
  
  const filesToPurge = [
    'resources/announcements/index.json',
    'resources/plugins/index.json',
    'resources/plugins/com.booltox.starter/metadata.json'
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of filesToPurge) {
    const purgeUrl = `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/${file}`;
    
    try {
      const response = await fetch(purgeUrl);
      const data = await response.json();
      
      if (response.ok && data.id) {
        console.log(`  ✅ ${file}`);
        successCount++;
      } else {
        console.log(`  ❌ ${file} - ${data.message || response.statusText}`);
        failCount++;
      }
    } catch (error) {
      console.log(`  ❌ ${file} - ${error.message}`);
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n  完成: ${successCount} 成功, ${failCount} 失败`);
  
  if (successCount > 0) {
    console.log('  💡 提示: CDN 缓存清除后可能需要等待几分钟才能生效');
  }
};

const mainMenu = async () => {
  while (true) {
    const choice = await askChoice('--- BoolTox 开发者工具 ---', [
      { value: 'package', label: '打包工具', hint: '将工具打包成 ZIP 文件' },
      { value: 'configure', label: '配置发布环境', hint: '设置仓库、令牌等信息' },
      { value: 'publish', label: '构建并发布', hint: '执行打包并推送 Release' },
      { value: 'manifest', label: '生成发布清单', hint: '手动生成 manifest.json' },
      { value: 'update-indexes', label: '更新资源索引', hint: '更新公告和工具索引文件' },
      { value: 'exit', label: '退出', hint: '返回命令行' },
    ], 'exit');

    if (choice === 'package') {
      await packagePlugin();
    } else if (choice === 'configure') {
      await configure();
    } else if (choice === 'publish') {
      await publish();
    } else if (choice === 'manifest') {
      await generateManifest();
    } else if (choice === 'update-indexes') {
      await updateIndexes();
    } else {
      break;
    }
  }
};

const run = async () => {
  if (process.argv.includes('--setup')) {
    await configure();
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
