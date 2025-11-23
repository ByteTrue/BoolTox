#!/usr/bin/env node
/**
 * 自动更新索引文件工具
 * 扫描 resources/ 目录,生成索引文件
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../');

/**
 * 扫描公告目录生成索引
 */
function updateAnnouncementsIndex() {
  console.log('📢 扫描公告目录...');
  
  const announcementsDir = path.join(rootDir, 'resources/announcements');
  const newsDir = path.join(announcementsDir, 'news');
  const releasesDir = path.join(announcementsDir, 'releases');
  
  const announcements = [];
  
  // 扫描 news 目录
  try {
    if (fs.existsSync(newsDir)) {
      const newsFiles = fs.readdirSync(newsDir);
      for (const file of newsFiles) {
        if (file.endsWith('.md')) {
          announcements.push({
            id: file.replace('.md', ''),
            file: `news/${file}`,
            type: 'announcement'
          });
        }
      }
    }
  } catch (error) {
    console.warn('  ⚠️ news 目录扫描失败:', error.message);
  }
  
  // 扫描 releases 目录
  try {
    if (fs.existsSync(releasesDir)) {
      const releaseFiles = fs.readdirSync(releasesDir);
      for (const file of releaseFiles) {
        if (file.endsWith('.md')) {
          announcements.push({
            id: file.replace('.md', ''),
            file: `releases/${file}`,
            type: 'update'
          });
        }
      }
    }
  } catch (error) {
    console.warn('  ⚠️ releases 目录扫描失败:', error.message);
  }
  
  // 生成索引文件
  const index = {
    announcements,
    lastUpdated: new Date().toISOString()
  };
  
  const indexPath = path.join(announcementsDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  
  console.log(`  ✅ 公告索引已更新: ${announcements.length} 个公告`);
  console.log(`     文件: ${indexPath}`);
}

/**
 * 扫描插件目录生成索引
 */
function updatePluginsIndex() {
  console.log('🔌 扫描插件目录...');
  
  const pluginsDir = path.join(rootDir, 'resources/plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    console.warn('  ⚠️ 插件目录不存在,跳过');
    return;
  }
  
  const plugins = [];
  
  try {
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
      
      // 检查是否有 metadata.json,如果没有则使用 manifest.json
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
        downloadFile: zipFile || `${entry.name}/manifest.json` // fallback
      });
    }
  } catch (error) {
    console.error('  ❌ 扫描插件目录失败:', error.message);
    return;
  }
  
  // 生成索引文件
  const index = {
    plugins,
    lastUpdated: new Date().toISOString()
  };
  
  const indexPath = path.join(pluginsDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  
  console.log(`  ✅ 插件索引已更新: ${plugins.length} 个插件`);
  console.log(`     文件: ${indexPath}`);
  
  // 打印详情
  plugins.forEach(p => {
    console.log(`     - ${p.id}`);
    console.log(`       metadata: ${p.metadataFile}`);
    console.log(`       download: ${p.downloadFile}`);
  });
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始更新资源索引...\n');
  
  updateAnnouncementsIndex();
  console.log('');
  updatePluginsIndex();
  
  console.log('\n✨ 索引更新完成!');
}

main();
