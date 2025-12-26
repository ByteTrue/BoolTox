#!/usr/bin/env node
/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 *
 * 文件管理器 - 交互式 TUI 示例
 * 演示如何将交互式 CLI 工具集成到 BoolTox（零改造）
 */

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

let currentDir = process.cwd();

function printHeader() {
  console.clear();
  console.log(chalk.cyan.bold('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('  📁 文件管理器 - BoolTox CLI 工具'));
  console.log(chalk.cyan.bold('='.repeat(60)));
  console.log();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

async function showMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.yellow(`当前目录: ${currentDir}`),
      choices: [
        { name: '📂 列出文件', value: 'list' },
        { name: '🔍 搜索文件', value: 'search' },
        { name: '📄 查看文件信息', value: 'info' },
        { name: '📁 创建目录', value: 'mkdir' },
        { name: '🔙 返回上级目录', value: 'cd-up' },
        { name: '📍 切换目录', value: 'cd' },
        new inquirer.Separator(),
        { name: '❌ 退出', value: 'exit' },
      ],
    },
  ]);

  return action;
}

async function actionList() {
  try {
    const files = await fs.readdir(currentDir, { withFileTypes: true });

    console.log(chalk.cyan.bold(`\n📂 ${currentDir}\n`));

    if (files.length === 0) {
      console.log(chalk.yellow('  (空目录)'));
      return;
    }

    for (const file of files) {
      const icon = file.isDirectory() ? '📁' : '📄';
      const name = file.isDirectory()
        ? chalk.blue.bold(file.name)
        : chalk.white(file.name);

      const fullPath = path.join(currentDir, file.name);
      const stats = await fs.stat(fullPath);
      const size = formatBytes(stats.size).padStart(10);

      console.log(`  ${icon} ${name.padEnd(40)} ${size}`);
    }
    console.log();
  } catch (error) {
    console.error(chalk.red(`❌ 错误: ${error.message}`));
  }
}

async function actionSearch() {
  const { pattern } = await inquirer.prompt([
    {
      type: 'input',
      name: 'pattern',
      message: '输入搜索模式（支持 * 通配符）:',
      default: '*.json',
    },
  ]);

  try {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
    const results = [];

    async function search(dir) {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (regex.test(file.name)) {
          results.push(path.join(dir, file.name));
        }
        if (file.isDirectory() && !file.name.startsWith('.')) {
          await search(path.join(dir, file.name));
        }
      }
    }

    await search(currentDir);

    if (results.length === 0) {
      console.log(chalk.yellow('\n😕 未找到匹配的文件'));
    } else {
      console.log(chalk.green.bold(`\n✅ 找到 ${results.length} 个文件:\n`));
      results.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    }
    console.log();
  } catch (error) {
    console.error(chalk.red(`❌ 错误: ${error.message}`));
  }
}

async function actionInfo() {
  const files = await fs.readdir(currentDir);
  const { fileName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fileName',
      message: '选择文件:',
      choices: files,
      pageSize: 15,
    },
  ]);

  try {
    const filePath = path.join(currentDir, fileName);
    const stats = await fs.stat(filePath);

    console.log(chalk.cyan.bold('\n📋 文件信息:\n'));
    console.log(`  路径: ${filePath}`);
    console.log(`  类型: ${stats.isDirectory() ? '📁 目录' : '📄 文件'}`);
    console.log(`  大小: ${formatBytes(stats.size)}`);
    console.log(`  创建时间: ${stats.birthtime.toLocaleString()}`);
    console.log(`  修改时间: ${stats.mtime.toLocaleString()}`);
    console.log();
  } catch (error) {
    console.error(chalk.red(`❌ 错误: ${error.message}`));
  }
}

async function actionMkdir() {
  const { dirName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'dirName',
      message: '输入目录名:',
    },
  ]);

  if (!dirName) {
    console.log(chalk.yellow('❌ 目录名不能为空'));
    return;
  }

  try {
    const newDir = path.join(currentDir, dirName);
    await fs.mkdir(newDir);
    console.log(chalk.green(`✅ 目录已创建: ${dirName}`));
  } catch (error) {
    console.error(chalk.red(`❌ 错误: ${error.message}`));
  }
}

async function actionCdUp() {
  currentDir = path.dirname(currentDir);
  console.log(chalk.green(`📍 切换到: ${currentDir}`));
}

async function actionCd() {
  const dirs = (await fs.readdir(currentDir, { withFileTypes: true }))
    .filter(f => f.isDirectory())
    .map(f => f.name);

  if (dirs.length === 0) {
    console.log(chalk.yellow('📭 当前目录下没有子目录'));
    return;
  }

  const { dirName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dirName',
      message: '选择目录:',
      choices: dirs,
      pageSize: 15,
    },
  ]);

  currentDir = path.join(currentDir, dirName);
  console.log(chalk.green(`📍 切换到: ${currentDir}`));
}

async function main() {
  printHeader();

  while (true) {
    try {
      const action = await showMenu();

      switch (action) {
        case 'list':
          await actionList();
          break;
        case 'search':
          await actionSearch();
          break;
        case 'info':
          await actionInfo();
          break;
        case 'mkdir':
          await actionMkdir();
          break;
        case 'cd-up':
          await actionCdUp();
          break;
        case 'cd':
          await actionCd();
          break;
        case 'exit':
          console.log(chalk.green('\n👋 再见！\n'));
          process.exit(0);
      }

      // 等待用户按键继续
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: chalk.gray('按 Enter 继续...'),
        },
      ]);
    } catch (error) {
      if (error.isTtyError) {
        console.error(chalk.red('无法在当前环境渲染提示'));
        process.exit(1);
      } else {
        console.error(chalk.red(`错误: ${error.message}`));
      }
    }
  }
}

main();
