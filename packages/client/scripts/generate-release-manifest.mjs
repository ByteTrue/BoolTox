/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');

async function ensureReleaseDir(version) {
  const releaseDir = path.join(projectRoot, 'release', version);
  try {
    const stats = await fs.stat(releaseDir);
    if (!stats.isDirectory()) {
      throw new Error(`${releaseDir} 不是有效目录`);
    }
    return releaseDir;
  } catch (error) {
    throw new Error(`找不到 release 目录：${releaseDir}，请先运行 pnpm build。`);
  }
}

function inferPlatform(filename) {
  if (filename.includes('-windows-')) return 'WINDOWS';
  if (filename.includes('-macos-')) return 'MACOS';
  if (filename.includes('-linux-')) return 'LINUX';
  return 'UNKNOWN';
}

function inferArch(filename) {
  if (filename.includes('-arm64')) return 'ARM64';
  if (filename.includes('-ia32')) return 'IA32';
  if (filename.includes('-armv7')) return 'ARMV7';
  return filename.includes('-x64') ? 'X64' : 'UNKNOWN';
}

function inferDistribution(filename, ext) {
  const lowerExt = ext.toLowerCase();
  switch (lowerExt) {
    case '.exe':
      return 'nsis';
    case '.dmg':
      return 'dmg';
    case '.appimage':
      return 'appimage';
    case '.zip':
      return 'zip';
    case '.blockmap':
      return 'blockmap';
    case '.yml':
    case '.yaml':
      return filename.toLowerCase().startsWith('latest') ? 'update-metadata' : 'config';
    default:
      return lowerExt.replace(/^\./, '') || 'unknown';
  }
}

async function hashFile(filePath) {
  const hash = createHash('sha256');
  const fileHandle = await fs.open(filePath, 'r');
  try {
    const stream = fileHandle.createReadStream();
    for await (const chunk of stream) {
      hash.update(chunk);
    }
  } finally {
    await fileHandle.close();
  }
  return hash.digest('hex');
}

const isLatestMetadata = (name) => {
  const lower = name.toLowerCase();
  return lower.startsWith('latest') && (lower.endsWith('.yml') || lower.endsWith('.yaml'));
};

async function collectArtifacts(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const artifacts = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith('-unpacked')) {
        continue;
      }
      const nested = await collectArtifacts(entryPath);
      artifacts.push(...nested);
      continue;
    }

    const ext = path.extname(entry.name);
    const lowerExt = ext.toLowerCase();
    const includeInstaller = ['.exe', '.dmg', '.appimage', '.zip'].includes(lowerExt);
    const includeBlockmap = lowerExt === '.blockmap';
    const includeMetadata = isLatestMetadata(entry.name);

    if (!includeInstaller && !includeBlockmap && !includeMetadata) {
      continue;
    }

    const stats = await fs.stat(entryPath);
    const sha256 = await hashFile(entryPath);
    const platform = inferPlatform(entry.name);
    const arch = inferArch(entry.name);
    const distribution = inferDistribution(entry.name, ext);

    artifacts.push({
      fileName: entry.name,
      relativePath: path.relative(projectRoot, entryPath).replace(/\\/g, '/'),
      absPath: entryPath,
      size: stats.size,
      sha256,
      platform,
      arch,
      distribution,
    });
  }

  return artifacts;
}

async function writeManifest(version, artifacts) {
  // Derive product name: prefer package.json "productName", then "name", fallback to 'Booltox'
  let productName = 'Booltox';
  try {
    const pkgRaw = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(pkgRaw);
    productName = (pkg.productName?.toString().trim()) || (pkg.displayName?.toString().trim()) || (pkg.name?.toString().trim()) || 'Booltox';
    // Normalize to Title Case-ish for nicer artifact names when coming from npm name
    if (productName && productName === productName.toLowerCase()) {
      productName = productName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }
  } catch {
    // ignore and keep fallback
  }

  const manifest = {
    productName,
    version,
    generatedAt: new Date().toISOString(),
    artifacts: artifacts.map(({ absPath, ...rest }) => rest),
  };

  const releaseDir = path.join(projectRoot, 'release', version);
  const manifestPath = path.join(releaseDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`✅ 已生成发布清单：${path.relative(projectRoot, manifestPath)}`);
}

async function main() {
  const pkgRaw = await fs.readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const version = pkg.version;

  if (!version) {
    throw new Error('package.json 未设置 version');
  }

  const releaseDir = await ensureReleaseDir(version);
  const artifacts = await collectArtifacts(releaseDir);

  if (artifacts.length === 0) {
    console.warn('⚠️ 未在 release 目录中检测到安装包产物，跳过 manifest 生成。');
    return;
  }

  await writeManifest(version, artifacts);
}

main().catch((error) => {
  console.error('生成发布清单失败:', error);
  process.exitCode = 1;
});
