import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import readline from 'node:readline';

import {
  loadRawConfig,
  normalizeConfig,
  saveConfig,
  publishRelease,
} from './release-manager.mjs';

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
    '填写 Markdown 文件路径，例如 docs/releases/v1.2.3.md',
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
  try {
    const result = await publishRelease({ skipBuild });
    console.log('\n✅ 发布成功');
    console.table([{ Version: result.version, Provider: result.uploadResult.provider, Tag: result.uploadResult.tagName }]);
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message ?? error);
  }
};

const mainMenu = async () => {
  while (true) {
    const choice = await askChoice('--- Booltox 发布助手 ---', [
      { value: 'configure', label: '配置发布环境', hint: '设置仓库、令牌等信息' },
      { value: 'publish', label: '构建并发布', hint: '执行打包并推送 Release' },
      { value: 'exit', label: '退出', hint: '返回命令行' },
    ], 'exit');

    if (choice === 'configure') {
      await configure();
    } else if (choice === 'publish') {
      await publish();
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
