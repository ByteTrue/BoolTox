import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const envFiles = [
  path.join(projectRoot, '.env.release.local'),
  path.join(projectRoot, '.env.release'),
];

const DEFAULTS = {
  RELEASE_PLATFORM: 'github',
  RELEASE_TAG_PREFIX: 'v',
  RELEASE_CHANNEL: 'STABLE',
  RELEASE_ROLLOUT_PERCENT: '100',
  RELEASE_MANDATORY: 'false',
  RELEASE_GIT_BASE_URL: 'https://gitlab.com',
  RELEASE_GIT_REF: 'main',
};

const runCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} 失败，退出码 ${code}`));
      }
    });
  });

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const normalized = value.toString().trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

export const parseEnvContent = (text) => {
  const records = {};
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) {
      continue;
    }
    const key = match[1];
    let value = match[2] ?? '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    records[key] = value;
  }
  return records;
};

const loadEnvFromFiles = async () => {
  const result = {};
  for (const file of envFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      Object.assign(result, parseEnvContent(content));
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return result;
};

export const loadRawConfig = async () => {
  const fileEnv = await loadEnvFromFiles();
  return {
    ...fileEnv,
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => key === key.toUpperCase() && (key.startsWith('RELEASE_') || key.startsWith('ADMIN_')),
      ),
    ),
  };
};

export const applyDefaults = (rawConfig) => {
  const config = { ...DEFAULTS, ...rawConfig };
  return config;
};

export const normalizeConfig = (rawConfig) => {
  const cfg = applyDefaults(rawConfig);
  const platform = (cfg.RELEASE_PLATFORM || DEFAULTS.RELEASE_PLATFORM).toLowerCase();
  const rawBaseUrl = cfg.RELEASE_GIT_BASE_URL?.trim();
  return {
    adminApiBaseUrl: cfg.ADMIN_API_BASE_URL?.trim(),
    adminReleaseToken: cfg.ADMIN_RELEASE_TOKEN?.trim(),
    adminProjectDir: cfg.ADMIN_PROJECT_DIR?.trim() || '',
    releasePlatform: platform,
    releaseRepository: cfg.RELEASE_REPOSITORY?.trim(),
    releaseGitToken: cfg.RELEASE_GIT_TOKEN?.trim(),
    releaseGitBaseUrl: ((rawBaseUrl && rawBaseUrl.length > 0)
      ? rawBaseUrl
      : platform === 'gitlab'
        ? DEFAULTS.RELEASE_GIT_BASE_URL
        : '').replace(/\/$/, ''),
    releaseGitRef: cfg.RELEASE_GIT_REF || DEFAULTS.RELEASE_GIT_REF,
    releaseTagPrefix: cfg.RELEASE_TAG_PREFIX || DEFAULTS.RELEASE_TAG_PREFIX,
    releaseChannel: cfg.RELEASE_CHANNEL || DEFAULTS.RELEASE_CHANNEL,
    releaseTenantId: cfg.RELEASE_TENANT_ID ?? '',
    releaseMandatory: toBoolean(cfg.RELEASE_MANDATORY, toBoolean(DEFAULTS.RELEASE_MANDATORY)),
    releaseRolloutPercent: Number(cfg.RELEASE_ROLLOUT_PERCENT || DEFAULTS.RELEASE_ROLLOUT_PERCENT) || 100,
    releaseNotesFile: cfg.RELEASE_NOTES_FILE?.trim() || '',
    releaseNotes: cfg.RELEASE_NOTES?.trim() || '',
    releaseAnnounceTitle: cfg.RELEASE_ANNOUNCE_TITLE?.trim() || '',
    releaseAnnounceFile: cfg.RELEASE_ANNOUNCE_FILE?.trim() || '',
    releaseAnnounceType: (cfg.RELEASE_ANNOUNCE_TYPE || '').toUpperCase(),
    releaseAnnounceStatus: (cfg.RELEASE_ANNOUNCE_STATUS || '').toUpperCase(),
  };
};

export const saveConfig = async (entries) => {
  const lines = ['# Booltox release configuration'];
  for (const [key, value] of entries) {
    lines.push(`${key}=${value ?? ''}`);
  }
  await fs.writeFile(envFiles[0], `${lines.join('\n')}\n`, 'utf8');
};

export const getPackageVersion = async () => {
  const pkgRaw = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw);
  if (!pkg.version) {
    throw new Error('package.json 未设置 version');
  }
  return pkg.version;
};

export const ensureBuild = async ({ skipBuild } = {}) => {
  if (!skipBuild) {
    await runCommand('npm', ['run', 'build']);
    return;
  }
  const version = await getPackageVersion();
  const manifestPath = path.join(projectRoot, 'release', version, 'manifest.json');
  try {
    await fs.access(manifestPath);
  } catch {
    throw new Error('未找到 manifest.json，请先执行 npm run build');
  }
};

export const loadManifest = async (version) => {
  const manifestPath = path.join(projectRoot, 'release', version, 'manifest.json');
  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    throw new Error('manifest.json 未包含任何安装包信息');
  }
  const artifacts = manifest.artifacts.map((artifact) => {
    const absPath = path.join(projectRoot, artifact.relativePath);
    return {
      ...artifact,
      absPath,
    };
  });
  return { manifestPath, manifest, artifacts };
};

export const readFileIfExists = async (filePath) => {
  if (!filePath) return undefined;
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  try {
    return await fs.readFile(resolved, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
};

export const getReleaseNotes = async (config) => {
  if (config.releaseNotes) {
    return config.releaseNotes;
  }
  const content = await readFileIfExists(config.releaseNotesFile);
  return content;
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`请求失败: ${response.status} ${response.statusText} - ${body}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    const preview = body.length > 200 ? body.slice(0, 200) + '...' : body;
    throw new Error(`服务端返回非 JSON 响应 (Content-Type: ${contentType}): ${preview}`);
  }
  return response.json();
};

const githubHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
});

const githubRequest = async (token, url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...githubHeaders(token),
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub 请求失败: ${response.status} ${response.statusText} - ${body}`);
  }
  return response;
};

const parseJsonResponse = async (response, context = '') => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    const preview = body.length > 200 ? body.slice(0, 200) + '...' : body;
    throw new Error(`${context} 返回非 JSON 响应 (Content-Type: ${contentType}): ${preview}`);
  }
  return response.json();
};

const githubEnsureRelease = async ({ token, repository, tagName, name, body, prerelease }) => {
  try {
    const response = await githubRequest(token, `https://api.github.com/repos/${repository}/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: tagName,
        name,
        body,
        draft: false,
        prerelease,
      }),
    });
    return await parseJsonResponse(response, 'GitHub 创建 Release');
  } catch (error) {
    if (!/422/.test(error.message)) {
      throw error;
    }
    const existing = await githubRequest(token, `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tagName)}`);
    return await parseJsonResponse(existing, 'GitHub 获取已有 Release');
  }
};

const githubUploadAsset = async ({ token, repository, releaseId, fileName, absPath, contentType }) => {
  const stats = await fs.stat(absPath);
  const stream = createReadStream(absPath);
  const url = `https://uploads.github.com/repos/${repository}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;
  const requestOptions = {
    method: 'POST',
    headers: {
      ...githubHeaders(token),
      'Content-Type': contentType,
      'Content-Length': String(stats.size),
    },
    body: stream,
  };
  // Node.js fetch (undici) requires specifying duplex when sending a streamed body
  // to avoid: "RequestInit: duplex option is required when sending a body."
  requestOptions.duplex = 'half';
  const response = await fetch(url, requestOptions);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub 上传失败 ${fileName}: ${response.status} ${response.statusText} - ${body}`);
  }
  return parseJsonResponse(response, `GitHub 上传 ${fileName}`);
};

const githubListRelease = async ({ token, repository, releaseId }) => {
  const response = await githubRequest(token, `https://api.github.com/repos/${repository}/releases/${releaseId}`);
  return await parseJsonResponse(response, 'GitHub 查询 Release');
};

const gitlabHeaders = (token) => ({
  'PRIVATE-TOKEN': token,
});

const gitlabRequest = async (baseUrl, token, endpoint, { method = 'GET', headers = {}, body } = {}) => {
  const url = `${baseUrl}/api/v4${endpoint}`;
  const requestOptions = {
    method,
    headers: {
      ...gitlabHeaders(token),
      ...headers,
    },
    body,
  };
  // If sending a body (FormData/stream), undici requires duplex option in Node.js
  if (body !== undefined && body !== null) {
    requestOptions.duplex = 'half';
  }
  const response = await fetch(url, requestOptions);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab 请求失败: ${response.status} ${response.statusText} - ${text}`);
  }
  return response;
};

const gitlabUploadAsset = async ({ baseUrl, token, projectPath, fileName, absPath }) => {
  const formData = new FormData();
  formData.append('file', createReadStream(absPath), fileName);
  const response = await gitlabRequest(baseUrl, token, `/projects/${encodeURIComponent(projectPath)}/uploads`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseJsonResponse(response, `GitLab 上传 ${fileName}`);
  if (!data?.url) {
    throw new Error('GitLab 上传结果缺少 url');
  }
  return {
    link: data.url,
    fullUrl: `${baseUrl}${data.url}`,
  };
};

const gitlabEnsureRelease = async ({ baseUrl, token, projectPath, tagName, name, description, ref, assets }) => {
  try {
    const response = await gitlabRequest(baseUrl, token, `/projects/${encodeURIComponent(projectPath)}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tagName,
        name,
        description,
        ref,
        assets: {
          links: assets.map((asset) => ({ name: asset.name, url: asset.url })),
        },
      }),
    });
    return await parseJsonResponse(response, 'GitLab 创建 Release');
  } catch (error) {
    if (!/409/.test(error.message)) {
      throw error;
    }
    const response = await gitlabRequest(baseUrl, token, `/projects/${encodeURIComponent(projectPath)}/releases/${encodeURIComponent(tagName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        assets: {
          links: assets.map((asset) => ({ name: asset.name, url: asset.url })),
        },
      }),
    });
    return await parseJsonResponse(response, 'GitLab 更新 Release');
  }
};

export const uploadReleaseAssets = async ({
  config,
  version,
  notes,
  artifacts,
}) => {
  const tagName = `${config.releaseTagPrefix ?? 'v'}${version}`;
  const name = `Release ${version}`;
  const channel = config.releaseChannel ?? 'STABLE';
  const prerelease = channel !== 'STABLE';

  if (config.releasePlatform === 'github') {
    if (!config.releaseRepository || !config.releaseGitToken) {
      throw new Error('缺少 GitHub 仓库或令牌配置');
    }

    console.log(`📦 准备发布到 GitHub: ${config.releaseRepository}/${tagName}`);
    const release = await githubEnsureRelease({
      token: config.releaseGitToken,
      repository: config.releaseRepository,
      tagName,
      name,
      body: notes ?? '',
      prerelease,
    });

    console.log(`📤 开始上传 ${artifacts.length} 个安装包...`);
    for (let i = 0; i < artifacts.length; i++) {
      const artifact = artifacts[i];
      const contentType = artifact.contentType ?? 'application/octet-stream';
      console.log(`  [${i + 1}/${artifacts.length}] 上传 ${artifact.fileName}...`);
      await githubUploadAsset({
        token: config.releaseGitToken,
        repository: config.releaseRepository,
        releaseId: release.id,
        fileName: artifact.fileName,
        absPath: artifact.absPath,
        contentType,
      });
    }

    console.log('✅ GitHub 上传完成，刷新 Release 信息...');
    const refreshed = await githubListRelease({
      token: config.releaseGitToken,
      repository: config.releaseRepository,
      releaseId: release.id,
    });

    const downloadArtifacts = refreshed.assets.map((asset) => {
      const source = artifacts.find((item) => item.fileName === asset.name);
      return {
        fileName: asset.name,
        downloadUrl: asset.browser_download_url,
        sizeBytes: asset.size,
        platform: source?.platform ?? artifactPlatformFromName(asset.name),
        architecture: source?.arch ?? artifactArchFromName(asset.name),
        checksum: source?.sha256,
      };
    });

    return {
      provider: 'github',
      releaseId: release.id,
      tagName,
      assets: downloadArtifacts,
    };
  }

  if (config.releasePlatform === 'gitlab') {
    if (!config.releaseRepository || !config.releaseGitToken) {
      throw new Error('缺少 GitLab 项目或令牌配置');
    }

    console.log(`📦 准备发布到 GitLab: ${config.releaseRepository}/${tagName}`);
    console.log(`📤 开始上传 ${artifacts.length} 个安装包...`);
    const uploadedAssets = [];
    for (let i = 0; i < artifacts.length; i++) {
      const artifact = artifacts[i];
      console.log(`  [${i + 1}/${artifacts.length}] 上传 ${artifact.fileName}...`);
      const upload = await gitlabUploadAsset({
        baseUrl: config.releaseGitBaseUrl,
        token: config.releaseGitToken,
        projectPath: config.releaseRepository,
        fileName: artifact.fileName,
        absPath: artifact.absPath,
      });
      uploadedAssets.push({
        name: artifact.fileName,
        url: upload.fullUrl,
        pathUrl: upload.link,
        sizeBytes: artifact.size,
        platform: artifact.platform,
        architecture: artifact.arch,
        checksum: artifact.sha256,
      });
    }

    console.log('✅ GitLab 上传完成，创建 Release...');
    await gitlabEnsureRelease({
      baseUrl: config.releaseGitBaseUrl,
      token: config.releaseGitToken,
      projectPath: config.releaseRepository,
      tagName,
      name,
      description: notes ?? '',
      ref: config.releaseGitRef,
      assets: uploadedAssets.map((asset) => ({ name: asset.name, url: `${config.releaseGitBaseUrl}${asset.pathUrl}` })),
    });

    return {
      provider: 'gitlab',
      tagName,
      assets: uploadedAssets,
    };
  }

  throw new Error(`暂不支持的平台: ${config.releasePlatform}`);
};

const artifactPlatformFromName = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.includes('win')) return 'WINDOWS';
  if (lower.includes('mac') || lower.includes('darwin')) return 'MACOS';
  if (lower.includes('linux')) return 'LINUX';
  return 'UNKNOWN';
};

const artifactArchFromName = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.includes('arm64') || lower.includes('aarch64')) return 'ARM64';
  if (lower.includes('x64') || lower.includes('amd64')) return 'X64';
  return 'UNKNOWN';
};

export const syncReleases = async (config) => {
  if (!config.adminApiBaseUrl || !config.adminReleaseToken) {
    throw new Error('缺少后台地址或令牌配置');
  }

  console.log('🔄 同步 Release 数据到后台...');
  const response = await fetchJson(`${config.adminApiBaseUrl.replace(/\/$/, '')}/api/service/releases/sync`, {
    method: 'POST',
    headers: {
      'x-release-token': config.adminReleaseToken,
    },
  });
  return response;
};

export const publishRelease = async ({ skipBuild = false } = {}) => {
  const raw = await loadRawConfig();
  const config = normalizeConfig(raw);

  if (!config.releaseRepository || !config.releaseGitToken) {
    throw new Error('请先配置仓库与令牌');
  }
  if (!config.adminApiBaseUrl || !config.adminReleaseToken) {
    throw new Error('请先配置后台地址与令牌');
  }

  console.log('\n🚀 开始发布流程...');
  if (!skipBuild) {
    console.log('🔨 正在构建安装包...');
  }
  await ensureBuild({ skipBuild });
  const version = await getPackageVersion();
  console.log(`📋 版本: ${version}`);

  const { artifacts } = await loadManifest(version);
  console.log(`📦 已准备 ${artifacts.length} 个安装包`);

  const notes = await getReleaseNotes(config);

  const enrichedArtifacts = artifacts.map((artifact) => ({
    ...artifact,
    contentType: detectContentType(artifact.fileName),
  }));

  const uploadResult = await uploadReleaseAssets({
    config,
    version,
    notes,
    artifacts: enrichedArtifacts,
  });

  await syncReleases(config);
  console.log('✅ 后台同步完成');

  return {
    version,
    uploadResult,
  };
};

const detectContentType = (fileName) => {
  if (fileName.endsWith('.exe')) return 'application/x-msdownload';
  if (fileName.endsWith('.msi')) return 'application/x-msdownload';
  if (fileName.endsWith('.dmg')) return 'application/x-apple-diskimage';
  if (fileName.endsWith('.zip')) return 'application/zip';
  if (fileName.endsWith('.AppImage')) return 'application/octet-stream';
  return 'application/octet-stream';
};
