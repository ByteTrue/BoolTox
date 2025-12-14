/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Electron Builder Before-Pack Hook
 * 动态过滤平台特定的二进制文件，减少安装包体积
 * 参考 Cherry Studio before-pack.js 设计
 */

const fs = require('fs');
const path = require('path');

/**
 * @param {import('electron-builder').BeforeBuildContext} context
 */
exports.default = async function (context) {
  const { platform, arch } = context;
  const platformName = platform.name; // 'mac', 'win', 'linux'

  console.log(`\n🔧 [Before Pack] 平台: ${platformName}, 架构: ${arch}`);

  // uv 二进制文件映射
  const uvBinaries = {
    'darwin-arm64': 'darwin-arm64',
    'darwin-x64': 'darwin-x64',
    'win-x64': 'win-x64',
    'linux-x64': 'linux-x64',
  };

  // 根据目标平台保留对应的二进制
  const keepBinaries = [];

  switch (platformName) {
    case 'mac':
      // macOS 需要保留两个架构（通用二进制）
      keepBinaries.push('darwin-arm64', 'darwin-x64');
      break;
    case 'win':
      keepBinaries.push('win-x64');
      break;
    case 'linux':
      keepBinaries.push('linux-x64');
      break;
  }

  // 构建排除列表（排除其他平台的二进制）
  const excludePatterns = Object.keys(uvBinaries)
    .filter((key) => !keepBinaries.includes(key))
    .map((key) => `!resources/uv/${uvBinaries[key]}/**`);

  if (excludePatterns.length > 0) {
    console.log(`📦 [Before Pack] 保留二进制: ${keepBinaries.join(', ')}`);
    console.log(`🗑️  [Before Pack] 排除二进制: ${excludePatterns.join(', ')}`);

    // 修改 electron-builder 的 files 过滤规则
    const currentFilters = context.packager.config.files || [];

    // 确保 files 是数组
    if (!Array.isArray(context.packager.config.files)) {
      context.packager.config.files = [
        {
          filter: excludePatterns,
        },
      ];
    } else if (currentFilters.length > 0 && currentFilters[0].filter) {
      // 添加到现有过滤规则
      currentFilters[0].filter.push(...excludePatterns);
    } else {
      // 创建新的过滤规则
      context.packager.config.files.push({
        filter: excludePatterns,
      });
    }

    console.log(`✅ [Before Pack] 已应用构建过滤规则`);
  }

  // 计算预期体积减少
  const uvDir = path.join(context.appDir, 'resources', 'uv');

  if (fs.existsSync(uvDir)) {
    const allBinaries = fs.readdirSync(uvDir);
    const excludedBinaries = allBinaries.filter((name) => !keepBinaries.includes(name));

    if (excludedBinaries.length > 0) {
      let excludedSize = 0;

      for (const binary of excludedBinaries) {
        const binaryPath = path.join(uvDir, binary);
        if (fs.existsSync(binaryPath)) {
          const stats = fs.statSync(binaryPath);
          if (stats.isDirectory()) {
            // 递归计算目录大小
            const getDirectorySize = (dirPath) => {
              let size = 0;
              const files = fs.readdirSync(dirPath);
              for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                  size += getDirectorySize(filePath);
                } else {
                  size += stat.size;
                }
              }
              return size;
            };
            excludedSize += getDirectorySize(binaryPath);
          } else {
            excludedSize += stats.size;
          }
        }
      }

      const excludedMB = (excludedSize / 1024 / 1024).toFixed(2);
      console.log(`💾 [Before Pack] 预计减少体积: ${excludedMB} MB`);
    }
  }

  console.log(`✅ [Before Pack] 构建优化完成\n`);
};
