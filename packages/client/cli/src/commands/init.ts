/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * booltox init 命令
 *
 * 交互式生成 booltox.json 模板
 * 不做智能推断，让开发者自己填空
 */

import fs from 'fs/promises';
import path from 'path';
import enquirer from 'enquirer';
import chalk from 'chalk';
import { getTemplate } from '../templates/index.js';

const { prompt } = enquirer;

export async function initCommand(options: { dir: string; force?: boolean }) {
  const { dir, force } = options;

  console.warn(chalk.blue('🚀 BoolTox 工具初始化\n'));

  // 检查 booltox.json 是否已存在
  const booltoxPath = path.join(dir, 'booltox.json');
  const exists = await fs.access(booltoxPath).then(() => true).catch(() => false);

  if (exists && !force) {
    console.warn(chalk.yellow('⚠️  booltox.json 已存在，使用 --force 覆盖'));
    return;
  }

  // 交互式收集信息
  console.group(chalk.gray('请填写工具基本信息:\n'));
  console.groupEnd();

  const answers = await prompt<{
    id: string;
    name: string;
    description: string;
    runtimeType: 'http-service' | 'standalone' | 'cli' | 'binary';
  }>([
    {
      type: 'input',
      name: 'id',
      message: '工具 ID（如 com.company.tool-name）:',
      initial: `com.mycompany.${path.basename(dir)}`,
      validate: (val: string) => /^[a-z0-9.-]+$/.test(val) || '只能包含小写字母、数字、点和横线',
    },
    {
      type: 'input',
      name: 'name',
      message: '工具名称:',
      initial: path.basename(dir),
    },
    {
      type: 'input',
      name: 'description',
      message: '简短描述:',
    },
    {
      type: 'select',
      name: 'runtimeType',
      message: '工具类型:',
      choices: [
        { name: 'http-service', message: 'HTTP 服务（后端 + 浏览器前端）' },
        { name: 'standalone', message: '独立应用（自带 GUI 窗口）' },
        { name: 'cli', message: '命令行工具（终端交互）' },
        { name: 'binary', message: '二进制工具（可执行文件）' },
      ],
    },
  ]);

  // 根据类型补充问题
  let language: 'python' | 'node' | undefined;
  let port: number | undefined;

  if (answers.runtimeType !== 'binary') {
    const langAnswers = await prompt<{ language: 'python' | 'node' }>([
      {
        type: 'select',
        name: 'language',
        message: '编程语言:',
        choices: [
          { name: 'python', message: 'Python' },
          { name: 'node', message: 'Node.js' },
        ],
      },
    ]);
    language = langAnswers.language;
  }

  if (answers.runtimeType === 'http-service') {
    const portAnswers = await prompt<{ port: number }>([
      {
        type: 'numeral',
        name: 'port',
        message: '服务端口:',
        initial: 8000,
      },
    ]);
    port = portAnswers.port;
  }

  // 生成模板
  const manifest = getTemplate({
    ...answers,
    language,
    port,
  });

  // 写入文件
  await fs.writeFile(booltoxPath, JSON.stringify(manifest, null, 2) + '\n');

  console.group(chalk.green('\n✓ booltox.json 已生成'));
  console.group(chalk.gray(`  路径: ${booltoxPath}\n`));
  console.groupEnd();
  console.groupEnd();

  console.group(chalk.blue('📋 下一步:'));
  console.group(chalk.gray('  1. 编辑 booltox.json，填写正确的入口文件和作者信息'));
  console.group(chalk.gray('  2. 测试工具运行是否正常'));
  console.group(chalk.gray('  3. git commit && git push'));
  console.group(chalk.gray('  4. 在 BoolTox Client 中添加工具源\n'));
  console.groupEnd();
  console.groupEnd();
  console.groupEnd();
  console.groupEnd();

  console.group(chalk.dim('提示: 模板中的某些字段（如 author、入口文件）需要您手动修改'));
  console.groupEnd();
}
