/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import * as net from 'node:net';
import { execSync } from 'node:child_process';
import * as os from 'node:os';
import { createLogger } from './logger.js';

const logger = createLogger('PortUtils');

export async function isPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, host);
  });
}

function parsePids(output: string): number[] {
  const pids = new Set<number>();
  for (const token of output.split(/\s+/)) {
    const pid = Number(token.trim());
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }
  return Array.from(pids);
}

function safeExec(command: string, timeout: number = 5000): string {
  try {
    return execSync(command, { encoding: 'utf8', timeout }).trim();
  } catch {
    return '';
  }
}

function sleepSync(ms: number): void {
  if (ms <= 0) {
    return;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as NodeJS.ErrnoException).code !== 'ESRCH';
    }
    return false;
  }
}

export function getPidsByPort(port: number): number[] {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      const output = safeExec(`netstat -ano | findstr :${port} | findstr LISTENING`);
      return parsePids(output);
    } else if (platform === 'darwin') {
      const output = safeExec(`lsof -ti :${port}`);
      return parsePids(output);
    } else {
      const lsofOutput = safeExec(`lsof -ti :${port}`);
      if (lsofOutput) {
        return parsePids(lsofOutput);
      }

      const fuserOutput = safeExec(`fuser ${port}/tcp 2>/dev/null`);
      return parsePids(fuserOutput);
    }
  } catch (error) {
    logger.warn(`[PortUtils] 获取端口 ${port} 占用进程失败`, error);
  }

  return [];
}

export type KillProcessOptions = {
  gracefulTimeoutMs?: number;
  pollIntervalMs?: number;
};

export function killProcess(pid: number, options: KillProcessOptions = {}): boolean {
  const platform = os.platform();
  const gracefulTimeoutMs = options.gracefulTimeoutMs ?? 1500;
  const pollIntervalMs = options.pollIntervalMs ?? 100;

  try {
    if (platform === 'win32') {
      try {
        execSync(`taskkill /T /PID ${pid}`, { timeout: 5000 });
      } catch {
        execSync(`taskkill /F /T /PID ${pid}`, { timeout: 5000 });
      }
      return true;
    }

    if (!isPidAlive(pid)) {
      return true;
    }

    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
          return true;
        }
      }
      throw error;
    }

    const deadline = Date.now() + gracefulTimeoutMs;
    while (Date.now() < deadline) {
      if (!isPidAlive(pid)) {
        return true;
      }
      sleepSync(pollIntervalMs);
    }

    try {
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
          return true;
        }
      }
      throw error;
    }

    const hardDeadline = Date.now() + 1500;
    while (Date.now() < hardDeadline) {
      if (!isPidAlive(pid)) {
        return true;
      }
      sleepSync(pollIntervalMs);
    }

    return !isPidAlive(pid);
  } catch (error) {
    logger.warn(`[PortUtils] 终止进程 ${pid} 失败`, error);
    return false;
  }
}

export async function findAvailablePort(
  startPort: number,
  host: string = '127.0.0.1',
  maxAttempts: number = 100
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`未找到可用端口 (从 ${startPort} 开始搜索 ${maxAttempts} 个端口)`);
}

export async function cleanupPort(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  if (await isPortAvailable(port, host)) {
    return true;
  }

  logger.info(`[PortUtils] 端口 ${port} 被占用，尝试清理...`);

  const pids = getPidsByPort(port);
  if (pids.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (await isPortAvailable(port, host)) {
      return true;
    }
    logger.warn(`[PortUtils] 未找到占用端口 ${port} 的进程`);
    return false;
  }

  logger.info(`[PortUtils] 发现 ${pids.length} 个进程占用端口 ${port}: ${pids.join(', ')}`);

  let successCount = 0;
  for (const pid of pids) {
    if (killProcess(pid)) {
      successCount++;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 200));
  const available = await isPortAvailable(port, host);
  if (available) {
    logger.info(`[PortUtils] 端口 ${port} 清理完成 (成功: ${successCount}/${pids.length})`);
    return true;
  }

  logger.warn(`[PortUtils] 端口 ${port} 清理失败 (成功: ${successCount}/${pids.length})`);
  return false;
}
