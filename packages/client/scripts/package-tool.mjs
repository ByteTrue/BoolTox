#!/usr/bin/env node

/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 工具打包脚本
 * 用途: 将工具打包成可分发的ZIP文件,计算哈希值
 * 
 * 使用方法:
 *   node package-plugin.mjs <plugin-id>
 *   例如: node package-plugin.mjs com.booltox.starter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGINS_DIR = path.resolve(__dirname, '../plugins');
const RESOURCES_PLUGINS_DIR = path.resolve(__dirname, '../../../resources/plugins');

/**
 * 读取并解析manifest.json
 */
function readManifest(pluginDir) {
  const manifestPath = path.join(pluginDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`未找到 manifest.json: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

/**
 * 计算文件的SHA-256哈希
 */
function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 创建ZIP包
 */
function createZip(pluginDir, outputPath, manifest) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ ZIP包已创建: ${outputPath}`);
      console.log(`   大小: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      resolve(archive.pointer());
    });

    archive.on('error', reject);
    archive.pipe(output);

    // 添加必需文件
    const manifestPath = path.join(pluginDir, 'manifest.json');
    archive.file(manifestPath, { name: 'manifest.json' });

    // 添加图标(如果存在)
    if (manifest.icon) {
      const iconPath = path.join(pluginDir, manifest.icon);
      if (fs.existsSync(iconPath)) {
        archive.file(iconPath, { name: manifest.icon });
      }
    }

    // 添加 dist 目录（扁平化到根目录）
    const distDir = path.join(pluginDir, 'dist');
    if (fs.existsSync(distDir)) {
      // false 表示不保留 dist 目录结构，直接将内容放到 zip 根目录
      archive.directory(distDir, false);
    } else {
      console.warn('⚠️  警告: 未找到 dist 目录,请先运行 pnpm build');
    }

    // 添加 backend 目录（若存在）
    const backendDir = path.join(pluginDir, 'backend');
    if (fs.existsSync(backendDir)) {
      archive.directory(backendDir, 'backend');
    }

    // 附加 README、requirements 等单文件
    ['README.md', 'requirements.txt'].forEach((file) => {
      const filePath = path.join(pluginDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.finalize();
  });
}

/**
 * 主函数
 */
async function main() {
  const pluginId = process.argv[2];
  
  if (!pluginId) {
    console.error('❌ 错误: 请提供工具ID');
    console.log('用法: node package-plugin.mjs <plugin-id>');
    console.log('示例: node package-plugin.mjs com.booltox.starter');
    process.exit(1);
  }

  const pluginDir = path.join(PLUGINS_DIR, pluginId);
  
  if (!fs.existsSync(pluginDir)) {
    console.error(`❌ 错误: 工具目录不存在: ${pluginDir}`);
    process.exit(1);
  }

  console.log(`📦 开始打包工具: ${pluginId}\n`);

  // 读取manifest
  const manifest = readManifest(pluginDir);
  console.log(`工具名称: ${manifest.name}`);
  console.log(`版本: ${manifest.version}`);
  console.log(`作者: ${manifest.author || '未知'}\n`);

  // 创建工具专属目录: resources/plugins/{plugin-id}/
  const pluginOutputDir = path.join(RESOURCES_PLUGINS_DIR, pluginId);
  if (!fs.existsSync(pluginOutputDir)) {
    fs.mkdirSync(pluginOutputDir, { recursive: true });
  }

  // 创建ZIP包 (固定名称: plugin.zip)
  const outputPath = path.join(pluginOutputDir, 'plugin.zip');
  
  const fileSize = await createZip(pluginDir, outputPath, manifest);

  // 计算哈希
  const hash = await calculateHash(outputPath);
  console.log(`   SHA-256: ${hash}\n`);

  // 生成metadata.json (包含manifest信息+下载信息)
  // 注意: downloadUrl会由GitOpsService根据配置自动生成,不需要在这里指定
  const metadata = {
    id: pluginId,
    version: manifest.version,
    name: manifest.name,
    description: manifest.description || '',
    author: manifest.author || '',
    icon: manifest.icon,
    category: manifest.category || 'utility',
    keywords: manifest.keywords || [],
    hash,
    size: fileSize,
  };

  // 写入metadata.json
  const metadataPath = path.join(pluginOutputDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`✅ 工具打包完成!`);
  console.log(`   输出目录: ${pluginOutputDir}`);
  console.log(`   - plugin.zip (${(fileSize / 1024).toFixed(2)} KB)`);
  console.log(`   - metadata.json\n`);

  // 输出metadata内容供参考
  console.log('📝 Metadata 内容:');
  console.log(JSON.stringify(metadata, null, 2));
  console.log('\n✨ 打包完成!');
}

main().catch((error) => {
  console.error('❌ 打包失败:', error);
  process.exit(1);
});
