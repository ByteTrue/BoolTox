#!/usr/bin/env node

/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import ora from 'ora';
import chalk from 'chalk';
import archiver from 'archiver';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesRoot = path.resolve(__dirname, '../../../packages/client/examples');
const TOOL_CONFIG_FILES = ['booltox.json', 'manifest.json'];

const logInfo = (msg) => console.log(chalk.cyan(`[booltox] ${msg}`));
const logWarn = (msg) => console.warn(chalk.yellow(`[booltox] ${msg}`));
const logError = (msg) => console.error(chalk.red(`[booltox] ${msg}`));

const PYTHON_CMD = process.env.BOOLTOX_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

async function copyTemplate(template, dest) {
  const src = path.join(templatesRoot, template);
  if (!(await fs.pathExists(src))) {
    throw new Error(`模板不存在: ${template}`);
  }
  if (await fs.pathExists(dest)) {
    throw new Error(`目标目录已存在: ${dest}`);
  }
  await fs.copy(src, dest, { overwrite: false, errorOnExist: true });
}

async function runCreate(template, name) {
  const spinner = ora(`创建工具 ${name} ...`).start();
  try {
    await copyTemplate(template, path.resolve(process.cwd(), name));
    spinner.succeed(`创建完成: ${name}`);
    logInfo(`模板: ${template}`);
    logInfo(`下一步: cd ${name} && 查看 README`);
  } catch (error) {
    spinner.fail('创建失败');
    logError(error.message);
    process.exitCode = 1;
  }
}

function listTemplatesSync() {
  if (!fs.existsSync(templatesRoot)) {
    return [];
  }

  const entries = fs.readdirSync(templatesRoot, { withFileTypes: true });
  const templates = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .filter((name) =>
      TOOL_CONFIG_FILES.some((file) => fs.existsSync(path.join(templatesRoot, name, file))),
    )
    .sort();

  return templates;
}

function loadToolConfig(toolPath) {
  for (const fileName of TOOL_CONFIG_FILES) {
    const configPath = path.join(toolPath, fileName);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return { configPath, manifest: JSON.parse(content) };
    }
  }
  throw new Error(`未找到 ${TOOL_CONFIG_FILES.join(' 或 ')}: ${toolPath}`);
}

function resolveToolId(manifest, toolPath) {
  return manifest?.id || path.basename(toolPath);
}

function currentPlatformKey() {
  let arch = process.arch;
  if (arch === 'arm') {
    arch = 'armv7';
  }
  return `${process.platform}-${arch}`;
}

function resolvePlatformSpecificEntry(entry) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (!entry || typeof entry !== 'object') {
    throw new Error('backend.entry 不是有效路径');
  }

  const key = currentPlatformKey();
  if (entry[key]) {
    return entry[key];
  }

  const fallback = Object.values(entry).find(Boolean);
  if (!fallback) {
    throw new Error(`backend.entry 未匹配当前平台: ${key}`);
  }

  logWarn(`未找到当前平台 ${key} 的 entry，回退使用: ${fallback}`);
  return fallback;
}

function validateManifest(manifest) {
  if (!manifest?.version || !manifest?.name) {
    throw new Error('配置缺少 name/version');
  }

  if (manifest.start) {
    return { mode: 'start', start: manifest.start, port: manifest.port };
  }

  const runtime = manifest.runtime;
  if (!runtime) {
    throw new Error('配置缺少 runtime 或 start');
  }

  if (runtime.type === 'standalone') {
    if (!runtime.entry) {
      throw new Error('standalone runtime 需要 entry');
    }
    return { mode: 'standalone', runtime };
  }

  if (runtime.type === 'binary') {
    if (!runtime.command) {
      throw new Error('binary runtime 需要 command');
    }
    return { mode: 'binary', runtime };
  }

  if (runtime.type === 'http-service' || runtime.type === 'cli') {
    if (!runtime.backend) {
      throw new Error(`${runtime.type} runtime 需要 backend`);
    }
    if (!runtime.backend.entry) {
      throw new Error(`${runtime.type} runtime 缺少 backend.entry`);
    }
    return { mode: runtime.type, backend: runtime.backend };
  }

  throw new Error(`不支持的 runtime.type: ${runtime.type}。支持的类型: standalone, binary, http-service, cli`);
}

function spawnBackend(pluginPath, backend, pluginId) {
  const resolvedEntry = resolvePlatformSpecificEntry(backend.entry);
  const entry = path.isAbsolute(resolvedEntry)
    ? resolvedEntry
    : path.join(pluginPath, resolvedEntry);
  let cmd;
  let args = backend.args ?? [];
  const env = { ...process.env, ...(backend.env ?? {}), BOOLTOX_TOOL_ID: pluginId || '' };

  if (backend.type === 'python') {
    cmd = PYTHON_CMD;
    args = [entry, ...args];
  } else if (backend.type === 'node') {
    cmd = process.execPath;
    args = [entry, ...args];
  } else {
    cmd = entry;
  }

  const proc = spawn(cmd, args, {
    cwd: pluginPath,
    env,
    stdio: 'inherit',
  });

  logInfo(`后端进程启动 pid=${proc.pid ?? 'unknown'} (${backend.type})`);
  proc.on('exit', (code) => {
    logWarn(`后端退出 code=${code}`);
  });
  proc.on('error', (err) => {
    logError(`后端启动失败: ${err.message}`);
  });
  return proc;
}

function maybeRunFrontend(pluginPath) {
  const pkgPath = path.join(pluginPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    logWarn('未找到 package.json，跳过前端 dev');
    return null;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const script = pkg.scripts?.dev ? 'dev' : pkg.scripts?.start ? 'start' : null;
  if (!script) {
    logWarn('package.json 中未定义 dev/start 脚本，跳过前端 dev');
    return null;
  }
  logInfo(`启动前端脚本: npm run ${script}`);
  const proc = spawn('npm', ['run', script], {
    cwd: pluginPath,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  proc.on('exit', (code) => logWarn(`前端进程退出 code=${code}`));
  proc.on('error', (err) => logError(`前端启动失败: ${err.message}`));
  return proc;
}

async function runDev(pluginPath = process.cwd(), options = { frontend: true }) {
  try {
    const { manifest } = loadToolConfig(pluginPath);
    const toolId = resolveToolId(manifest, pluginPath);
    const info = validateManifest(manifest);

    const inferBackendType = (entry) => {
      const lower = entry.toLowerCase();
      if (lower.endsWith('.py')) return 'python';
      if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'node';
      return 'process';
    };

    const spawnShellCommand = (command) => {
      const proc = spawn(command, {
        cwd: pluginPath,
        env: { ...process.env, BOOLTOX_TOOL_ID: toolId },
        stdio: 'inherit',
        shell: true,
      });
      proc.on('exit', (code) => logWarn(`进程退出 code=${code}`));
      proc.on('error', (err) => logError(`进程启动失败: ${err.message}`));
      return proc;
    };

    let runnerProc = null;
    let watcher = null;

    const startWithWatch = (backend) => {
      runnerProc = spawnBackend(pluginPath, backend, toolId);

      try {
        const resolvedEntry = resolvePlatformSpecificEntry(backend.entry);
        const watchPath = path.isAbsolute(resolvedEntry)
          ? resolvedEntry
          : path.join(pluginPath, resolvedEntry);

        if (fs.existsSync(watchPath)) {
          watcher = chokidar.watch(path.dirname(watchPath), { ignoreInitial: true });
          watcher.on('all', (event, filePath) => {
            logInfo(`检测到变更(${event}): ${filePath}，正在重启...`);
            if (runnerProc && !runnerProc.killed) {
              runnerProc.kill();
            }
            runnerProc = spawnBackend(pluginPath, backend, toolId);
          });
        }
      } catch (err) {
        logWarn(`文件监听初始化失败: ${err.message || err}`);
      }
    };

    if (info.mode === 'start') {
      runnerProc = spawnShellCommand(info.start);
    } else if (info.mode === 'standalone') {
      startWithWatch({
        type: inferBackendType(info.runtime.entry),
        entry: info.runtime.entry,
        args: info.runtime.args ?? [],
        env: info.runtime.env ?? {},
      });
    } else if (info.mode === 'binary') {
      runnerProc = spawnBackend(pluginPath, {
        type: 'process',
        entry: info.runtime.command,
        args: info.runtime.args ?? [],
        env: info.runtime.env ?? {},
      }, toolId);
    } else if (info.backend) {
      startWithWatch({
        type: info.backend.type ?? 'process',
        entry: info.backend.entry,
        args: info.backend.args ?? [],
        env: info.backend.env ?? {},
      });
    } else {
      logWarn('未找到可启动的后端配置');
    }

    const frontendProc = options.frontend ? maybeRunFrontend(pluginPath) : null;

    if (!runnerProc && !frontendProc) {
      logWarn('dev 模式未启动任何进程');
    } else {
      logInfo('Dev 模式运行中：变更自动重启（如启用 watch），前端通过脚本运行（如存在）。');
    }

    const shutdown = async () => {
      if (watcher) {
        await watcher.close();
      }
      if (runnerProc && !runnerProc.killed) {
        runnerProc.kill();
      }
      if (frontendProc && !frontendProc.killed) {
        frontendProc.kill();
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logError(error.message);
    process.exitCode = 1;
  }
}

function computeHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function runBuild(pluginPath = process.cwd()) {
  try {
    const { manifest } = loadToolConfig(pluginPath);
    validateManifest(manifest);
    logWarn('build 命令暂未集成构建流程，请在工具目录自行执行前端/后端构建（如 npm run build）。');
  } catch (error) {
    logError(error.message);
    process.exitCode = 1;
  }
}

async function runPack(pluginPath = process.cwd()) {
  const spinner = ora('打包中...').start();
  try {
    const { manifest } = loadToolConfig(pluginPath);
    validateManifest(manifest);
    const toolId = resolveToolId(manifest, pluginPath);

    const outputDir = path.join(pluginPath, 'dist');
    await fs.ensureDir(outputDir);
    const outputPath = path.join(outputDir, `${toolId}.booltox`);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // 用 Promise 包装归档过程，正确传播错误
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);
      archive.on('warning', (err) => {
        if (err.code !== 'ENOENT') {
          logWarn(`归档警告: ${err.message}`);
        }
      });

      archive.pipe(output);

      archive.glob('**/*', {
        cwd: pluginPath,
        dot: false,
        ignore: ['node_modules/**', '.git/**', '*.log'],
      });

      archive.finalize();
    });
    spinner.text = '计算哈希...';
    const hash = await computeHash(outputPath);
    spinner.text = '写入 metadata...';
    const metadata = {
      id: toolId,
      version: manifest.version,
      name: manifest.name,
      description: manifest.description || '',
      author: manifest.author || '',
      icon: manifest.icon,
      category: manifest.category || 'utility',
      keywords: manifest.keywords || [],
      hash,
      size: fs.statSync(outputPath).size,
    };
    await fs.writeFile(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
    spinner.succeed(`打包完成: ${outputPath}`);
  } catch (error) {
    spinner.fail('打包失败');
    logError(error.message);
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name('booltox')
  .description('BoolTox CLI')
  .version('0.1.0');

program
  .command('templates')
  .description('列出可用模板')
  .action(() => {
    listTemplatesSync().forEach((t) => console.log(t));
  });

program
  .command('create')
  .description('从模板创建工具')
  .argument('<name>', '工具目录名称')
  .option('-t, --template <template>', '模板名称', 'backend-demo')
  .action(async (name, options) => {
    const templates = listTemplatesSync();
    const template = options.template;
    if (!templates.includes(template)) {
      logError(`未知模板 ${template}，可选: ${templates.join(', ')}`);
      process.exitCode = 1;
      return;
    }
    await runCreate(template, name);
  });

program
  .command('dev')
  .description('开发模式：后端文件变更自动重启，可自动启动前端脚本')
  .option('-p, --path <path>', '工具目录', process.cwd())
  .option('--no-frontend', '不启动前端脚本')
  .action(async (opts) => {
    await runDev(path.resolve(opts.path), { frontend: opts.frontend !== false });
  });

program
  .command('build')
  .description('构建工具（当前需手动执行前端/后端构建）')
  .option('-p, --path <path>', '工具目录', process.cwd())
  .action(async (opts) => {
    await runBuild(path.resolve(opts.path));
  });

program
  .command('pack')
  .description('打包为 .booltox，并生成 metadata.json')
  .option('-p, --path <path>', '工具目录', process.cwd())
  .action(async (opts) => {
    await runPack(path.resolve(opts.path));
  });

program.parseAsync(process.argv);
