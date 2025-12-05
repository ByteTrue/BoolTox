/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/* eslint-disable no-console */
import { IPC_CHANNELS, type RendererConsoleLevel, type RendererConsolePayload } from '@shared/constants/ipc-channels';

const PATCH_FLAG = '__BOOLTOX_CONSOLE_PATCHED__';
const consoleMethods: RendererConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

const normalizeArg = (arg: unknown): unknown => {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
      cause: (arg as Error & { cause?: unknown }).cause,
    };
  }

  if (typeof arg === 'function') {
    return `[Function ${arg.name || 'anonymous'}]`;
  }

  if (typeof arg === 'symbol') {
    return arg.toString();
  }

  if (typeof arg === 'bigint') {
    return `${String(arg)}n`;
  }

  if (typeof Event !== 'undefined' && arg instanceof Event) {
    return {
      type: arg.type,
      detail: (arg as CustomEvent<unknown>).detail ?? undefined,
    };
  }

  if (typeof Node !== 'undefined' && arg instanceof Node) {
    return `<${arg.nodeName.toLowerCase()}>`;
  }

  return arg;
};

const stringifyFallback = (arg: unknown): string => {
  if (typeof arg === 'string') {
    return arg;
  }
  if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
    return String(arg);
  }
  if (typeof arg === 'function') {
    return `[Function ${arg.name || 'anonymous'}]`;
  }
  if (typeof arg === 'symbol') {
    return arg.toString();
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return Object.prototype.toString.call(arg);
  }
};

const forwardToMain = (payload: RendererConsolePayload, warn?: (...args: unknown[]) => void) => {
  if (!window.ipc) {
    return;
  }

  const send = () => {
    if (typeof window.ipc.send === 'function') {
      window.ipc.send(IPC_CHANNELS.RENDERER_CONSOLE_LOG, payload);
    } else if (typeof window.ipc.invoke === 'function') {
      void window.ipc.invoke(IPC_CHANNELS.RENDERER_CONSOLE_LOG, payload);
    }
  };

  try {
    send();
  } catch (error) {
    warn?.('[RendererConsole] 序列化日志失败,使用字符串回退', error);
    const fallbackPayload: RendererConsolePayload = {
      level: payload.level,
      args: payload.args.map((item) => stringifyFallback(item)),
    };
    try {
      if (typeof window.ipc.send === 'function') {
        window.ipc.send(IPC_CHANNELS.RENDERER_CONSOLE_LOG, fallbackPayload);
      } else if (typeof window.ipc.invoke === 'function') {
        void window.ipc.invoke(IPC_CHANNELS.RENDERER_CONSOLE_LOG, fallbackPayload);
      }
    } catch (fallbackError) {
      warn?.('[RendererConsole] 无法将日志发送到主进程', fallbackError);
    }
  }
};

(() => {
  if (typeof window === 'undefined' || !window.ipc) {
    return;
  }

  const typedWindow = window as typeof window & { [PATCH_FLAG]?: boolean };
  if (typedWindow[PATCH_FLAG]) {
    return;
  }

  typedWindow[PATCH_FLAG] = true;

  const originalConsole: Record<RendererConsoleLevel, (...args: unknown[]) => void> = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: (console.debug || console.log).bind(console),
  };

  const patchedConsole = console as Record<RendererConsoleLevel, (...args: unknown[]) => void>;

  consoleMethods.forEach((level) => {
    patchedConsole[level] = (...args: unknown[]) => {
      originalConsole[level](...args);
      const payload: RendererConsolePayload = {
        level,
        args: args.map((arg) => normalizeArg(arg)),
      };
      forwardToMain(payload, originalConsole.warn);
    };
  });

  originalConsole.info?.('[RendererConsole] 控制台日志已同步到主进程 main.log');
})();
