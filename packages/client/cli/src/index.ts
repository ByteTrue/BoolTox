#!/usr/bin/env node

/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * BoolTox CLI - 工具开发助手
 * 提供 booltox init 命令生成 booltox.json
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('booltox')
  .description('BoolTox CLI - 工具开发助手')
  .version('1.0.0');

program
  .command('init')
  .description('生成 booltox.json 模板')
  .option('-d, --dir <path>', '项目目录', process.cwd())
  .option('--force', '强制覆盖已有的 booltox.json')
  .action(initCommand);

program.parse();
