/**
 * 自动生成模块文件的 SHA-256 校验和并更新 manifest.json
 * 
 * 使用方法:
 *   node scripts/generate-checksums.js
 * 
 * 功能:
 * 1. 读取 manifest.json
 * 2. 为每个模块计算 SHA-256 和文件大小
 * 3. 更新 manifest.json
 * 4. 输出统计信息
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 计算文件的 SHA-256 校验和（Base64 编码）
 * @param {string} filePath - 文件路径
 * @returns {string} SHA-256 校验和（格式: sha256-xxx）
 */
function getFileChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return `sha256-${hashSum.digest('base64')}`;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 主逻辑
try {
  console.warn('🔍 开始生成校验和...\n');

  // 读取 manifest.json
  const manifestPath = path.join(__dirname, '../manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ 错误: 找不到 manifest.json');
    console.error(`   预期路径: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (!manifest.modules || !Array.isArray(manifest.modules)) {
    console.error('❌ 错误: manifest.json 格式不正确（缺少 modules 数组）');
    process.exit(1);
  }

  console.warn(`📦 找到 ${manifest.modules.length} 个模块\n`);

  let successCount = 0;
  let errorCount = 0;
  let totalSize = 0;

  // 处理每个模块
  manifest.modules.forEach((module, index) => {
    console.warn(`[${index + 1}/${manifest.modules.length}] 处理: ${module.name} (${module.id})`);

    // 从 bundleUrl 提取文件名
    if (!module.bundleUrl) {
      console.warn('   ⚠️  跳过: 缺少 bundleUrl');
      errorCount++;
      return;
    }

    const filename = path.basename(module.bundleUrl);
    const filePath = path.join(__dirname, '../dist', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  文件不存在: ${filePath}`);
      errorCount++;
      return;
    }

    try {
      // 计算校验和和文件大小
      const stats = fs.statSync(filePath);
      const checksum = getFileChecksum(filePath);

      // 更新 manifest
      module.checksum = checksum;
      module.size = stats.size;

      totalSize += stats.size;
      successCount++;

      console.warn(`   ✅ 成功: ${formatSize(stats.size)}`);
      console.warn(`   🔐 Checksum: ${checksum.substring(0, 20)}...`);
    } catch (error) {
    console.error(`   ❌ 错误: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }

    console.warn('');
  });

  // 更新 manifest 的版本（可选）
  manifest.lastUpdated = new Date().toISOString();

  // 保存更新后的 manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 输出统计信息
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('📊 统计信息:');
  console.warn(`   ✅ 成功: ${successCount} 个模块`);
  console.warn(`   ❌ 失败: ${errorCount} 个模块`);
  console.warn(`   📦 总大小: ${formatSize(totalSize)}`);
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (successCount > 0) {
    console.warn('\n✨ Manifest 已更新!');
    console.warn(`   文件路径: ${manifestPath}`);
  }

  if (errorCount > 0) {
    console.warn('\n⚠️  部分模块处理失败，请检查上面的错误信息');
    process.exit(1);
  }

} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('\n❌ 发生错误:', message);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
