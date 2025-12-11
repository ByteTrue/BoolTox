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
const repoNodeSdk = path.resolve(__dirname, '../../../sdks/node');
const repoPythonSdk = path.resolve(__dirname, '../../../sdks/python');

const logInfo = (msg) => console.log(chalk.cyan(`[booltox] ${msg}`));
const logWarn = (msg) => console.warn(chalk.yellow(`[booltox] ${msg}`));
const logError = (msg) => console.error(chalk.red(`[booltox] ${msg}`));

const templateNames = ['backend-demo', 'backend-node-demo', 'frontend-only-demo', 'python-standalone-demo'];
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

function loadManifest(pluginPath) {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`未找到 manifest.json: ${manifestPath}`);
  }
  const content = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(content);
}

function validateManifest(manifest) {
  if (!manifest.id || !manifest.version || !manifest.name) {
    throw new Error('manifest 缺少 id/version/name');
  }
  const runtime = manifest.runtime;
  if (!runtime) {
    throw new Error('manifest.runtime 缺失');
  }
  if (runtime.type === 'standalone') {
    if (!runtime.entry) {
      throw new Error('standalone runtime 需要 entry');
    }
    return { mode: 'standalone' };
  }
  if (!runtime.ui?.entry) {
    throw new Error('webview runtime 缺少 ui.entry');
  }
  return { mode: 'webview', backend: runtime.backend };
}

function spawnBackend(pluginPath, backend, pluginId) {
  const entry = path.isAbsolute(backend.entry)
    ? backend.entry
    : path.join(pluginPath, backend.entry);
  let cmd;
  let args = backend.args ?? [];
  const env = { ...process.env, ...(backend.env ?? {}), BOOLTOX_PLUGIN_ID: pluginId || '' };

  if (backend.type === 'python') {
    cmd = PYTHON_CMD;
    args = [entry, ...args];
    const pythonSdk = fs.existsSync(repoPythonSdk) ? repoPythonSdk : undefined;
    if (pythonSdk) {
      env.PYTHONPATH = env.PYTHONPATH ? `${env.PYTHONPATH}${path.delimiter}${pythonSdk}` : pythonSdk;
    }
  } else if (backend.type === 'node') {
    cmd = process.execPath;
    args = [entry, ...args];
    const nodeSdk = fs.existsSync(repoNodeSdk) ? repoNodeSdk : undefined;
    if (nodeSdk) {
      env.NODE_PATH = env.NODE_PATH ? `${env.NODE_PATH}${path.delimiter}${nodeSdk}` : nodeSdk;
    }
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
  logInfo(`启动前端脚本: pnpm run ${script}`);
  const proc = spawn('pnpm', ['run', script], {
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
    const manifest = loadManifest(pluginPath);
    const info = validateManifest(manifest);
    const backend = manifest.runtime.backend;

    let backendProc = null;
    if (backend) {
      const resolvedBackend = { ...backend, entry: backend.entry };
      backendProc = spawnBackend(pluginPath, resolvedBackend, manifest.id);

      const watchPath = path.isAbsolute(backend.entry)
        ? backend.entry
        : path.join(pluginPath, backend.entry);
      const watcher = chokidar.watch(path.dirname(watchPath), { ignoreInitial: true });

      watcher.on('all', (event, filePath) => {
        logInfo(`检测到变更(${event}): ${filePath}，正在重启后端...`);
        if (backendProc && !backendProc.killed) {
          backendProc.kill();
        }
        backendProc = spawnBackend(pluginPath, resolvedBackend, manifest.id);
      });

      const shutdown = async () => {
        await watcher.close();
        if (backendProc && !backendProc.killed) {
          backendProc.kill();
        }
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } else {
      logWarn('未声明 backend，后端热重载跳过');
    }

    let frontendProc = null;
    if (options.frontend) {
      frontendProc = maybeRunFrontend(pluginPath);
    }

    if (!backend && !frontendProc) {
      logWarn('dev 模式未启动任何进程');
    } else {
      logInfo('Dev 模式运行中：后端变更自动重启，前端通过脚本运行（如存在）。');
    }
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
    const manifest = loadManifest(pluginPath);
    validateManifest(manifest);
    logWarn('build 命令暂未集成构建流程，请在工具目录自行执行前端/后端构建（如 pnpm build）。');
  } catch (error) {
    logError(error.message);
    process.exitCode = 1;
  }
}

async function runPack(pluginPath = process.cwd()) {
  const spinner = ora('打包中...').start();
  try {
    const manifest = loadManifest(pluginPath);
    validateManifest(manifest);

    const clientPackScript = path.resolve(__dirname, '../../client/scripts/package-plugin.mjs');
    const repoPluginDir = path.resolve(__dirname, `../../client/plugins/${manifest.id}`);
    const useClientScript =
      fs.existsSync(clientPackScript) && path.resolve(pluginPath) === repoPluginDir;

    if (useClientScript) {
      spinner.text = '调用客户端打包脚本...';
      await new Promise((resolve, reject) => {
        const proc = spawn(process.execPath, [clientPackScript, manifest.id], {
          cwd: path.dirname(clientPackScript),
          stdio: 'inherit',
        });
        proc.on('exit', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`package-plugin.mjs 退出码 ${code}`));
        });
        proc.on('error', reject);
      });
      spinner.succeed('客户端打包完成（resources/plugins 下生成 plugin.zip + metadata.json）');
      return;
    }

    const outputDir = path.join(pluginPath, 'dist');
    await fs.ensureDir(outputDir);
    const outputPath = path.join(outputDir, `${manifest.id}.booltox`);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    archive.glob('**/*', {
      cwd: pluginPath,
      dot: false,
      ignore: ['node_modules/**', '.git/**', '*.log'],
    });

    await archive.finalize();
    spinner.text = '计算哈希...';
    const hash = await computeHash(outputPath);
    spinner.text = '写入 metadata...';
    const metadata = {
      id: manifest.id,
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
    templateNames.forEach((t) => console.log(t));
  });

program
  .command('create')
  .description('从模板创建工具')
  .argument('<name>', '工具目录名称')
  .option('-t, --template <template>', '模板名称', 'python-backend')
  .action(async (name, options) => {
    const template = options.template;
    if (!templateNames.includes(template)) {
      logWarn(`未知模板 ${template}，可选: ${templateNames.join(', ')}`);
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
