#!/usr/bin/env node

/**
 * download-uv.mjs
 * 下载各平台 uv 二进制文件到 resources/uv/ 目录
 * 
 * uv 是 Astral 出品的高性能 Python 包管理器，支持：
 * - Python 版本管理 (uv python install)
 * - 虚拟环境创建 (uv venv)
 * - 依赖安装 (uv pip install)
 * 
 * 使用方法：
 *   node scripts/download-uv.mjs [platform]
 *   platform: win-x64 | darwin-x64 | darwin-arm64 | linux-x64 | all (默认)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { pipeline } from 'stream/promises';
import { createWriteStream, mkdirSync, existsSync, rmSync, createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// 使用项目已有的 adm-zip 依赖
const AdmZip = require('adm-zip');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uv 版本配置
const UV_VERSION = '0.5.14';
const BASE_URL = `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}`;

// 平台配置
const PLATFORMS = {
  'win-x64': {
    filename: `uv-x86_64-pc-windows-msvc.zip`,
    executable: 'uv.exe',
    archiveType: 'zip'
  },
  'darwin-x64': {
    filename: `uv-x86_64-apple-darwin.tar.gz`,
    executable: 'uv',
    archiveType: 'tar.gz'
  },
  'darwin-arm64': {
    filename: `uv-aarch64-apple-darwin.tar.gz`,
    executable: 'uv',
    archiveType: 'tar.gz'
  },
  'linux-x64': {
    filename: `uv-x86_64-unknown-linux-gnu.tar.gz`,
    executable: 'uv',
    archiveType: 'tar.gz'
  }
};

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'uv');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * 下载文件，支持 GitHub 重定向
 */
async function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const request = (currentUrl) => {
      https.get(currentUrl, {
        headers: {
          'User-Agent': 'BoolTox-Downloader'
        }
      }, (response) => {
        // 处理重定向
        if (response.statusCode === 302 || response.statusCode === 301) {
          request(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        const fileStream = createWriteStream(destPath);
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize) {
            onProgress(downloadedSize, totalSize);
          }
        });

        pipeline(response, fileStream)
          .then(resolve)
          .catch(reject);
      }).on('error', reject);
    };

    request(url);
  });
}

/**
 * 解压 ZIP 文件 (使用 adm-zip)
 */
async function extractZip(zipPath, destDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
}

/**
 * 解压 tar.gz 文件 (Unix)
 */
async function extractTarGz(tarPath, destDir) {
  // 使用 tar 命令解压
  execSync(`tar -xzf "${tarPath}" -C "${destDir}"`, { stdio: 'inherit' });
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 下载并解压指定平台的 uv
 */
async function downloadUvForPlatform(platform) {
  const config = PLATFORMS[platform];
  if (!config) {
    throw new Error(`不支持的平台: ${platform}`);
  }

  const destDir = path.join(OUTPUT_DIR, platform);
  const tempArchive = path.join(TEMP_DIR, config.filename);
  const url = `${BASE_URL}/${config.filename}`;

  console.log(`\n📦 下载 uv for ${platform}...`);
  console.log(`   URL: ${url}`);

  // 创建目录
  mkdirSync(destDir, { recursive: true });
  mkdirSync(TEMP_DIR, { recursive: true });

  // 下载
  await downloadFile(url, tempArchive, (downloaded, total) => {
    const percent = ((downloaded / total) * 100).toFixed(1);
    const downloadedStr = formatBytes(downloaded);
    const totalStr = formatBytes(total);
    process.stdout.write(`\r   进度: ${percent}% (${downloadedStr} / ${totalStr})   `);
  });
  console.log('\n   ✅ 下载完成');

  // 解压
  console.log(`   📂 解压中...`);
  const extractDir = path.join(TEMP_DIR, `extract-${platform}`);
  mkdirSync(extractDir, { recursive: true });

  if (config.archiveType === 'zip') {
    await extractZip(tempArchive, extractDir);
  } else {
    await extractTarGz(tempArchive, extractDir);
  }

  // 找到并移动 uv 可执行文件
  // uv 压缩包内通常有一个目录，如 uv-x86_64-pc-windows-msvc/
  const extractedItems = fs.readdirSync(extractDir);
  let uvExecutable = null;

  for (const item of extractedItems) {
    const itemPath = path.join(extractDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // 在子目录中查找 uv 可执行文件
      const subItems = fs.readdirSync(itemPath);
      for (const subItem of subItems) {
        if (subItem === config.executable || subItem === 'uv' || subItem === 'uv.exe') {
          uvExecutable = path.join(itemPath, subItem);
          break;
        }
      }
    } else if (item === config.executable || item === 'uv' || item === 'uv.exe') {
      uvExecutable = itemPath;
    }
    
    if (uvExecutable) break;
  }

  if (!uvExecutable) {
    throw new Error(`未找到 uv 可执行文件`);
  }

  // 复制到目标目录
  const finalPath = path.join(destDir, config.executable);
  fs.copyFileSync(uvExecutable, finalPath);
  
  // Unix 系统设置执行权限
  if (config.archiveType === 'tar.gz') {
    fs.chmodSync(finalPath, 0o755);
  }

  console.log(`   ✅ 已安装到: ${finalPath}`);

  // 清理临时文件
  rmSync(tempArchive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });

  return finalPath;
}

/**
 * 主函数
 */
async function main() {
  const targetPlatform = process.argv[2] || 'all';

  console.log('═══════════════════════════════════════════════════');
  console.log(`  BoolTox - uv 下载工具 v${UV_VERSION}`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  目标平台: ${targetPlatform}`);
  console.log(`  输出目录: ${OUTPUT_DIR}`);

  // 清理旧文件
  if (existsSync(OUTPUT_DIR) && targetPlatform === 'all') {
    console.log('\n🗑️  清理旧文件...');
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  const platforms = targetPlatform === 'all' 
    ? Object.keys(PLATFORMS) 
    : [targetPlatform];

  const results = [];

  for (const platform of platforms) {
    try {
      const uvPath = await downloadUvForPlatform(platform);
      results.push({ platform, success: true, path: uvPath });
    } catch (error) {
      console.error(`\n❌ ${platform} 下载失败:`, error.message);
      results.push({ platform, success: false, error: error.message });
    }
  }

  // 清理临时目录
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  // 打印结果摘要
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  下载结果摘要');
  console.log('═══════════════════════════════════════════════════');
  
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.platform}`);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n  成功: ${successCount}/${results.length}`);

  if (successCount < results.length) {
    process.exit(1);
  }

  console.log('\n🎉 完成！uv 二进制文件已准备就绪。');
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
