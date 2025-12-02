/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

export const IPC_CHANNELS = {
  RENDERER_CONSOLE_LOG: 'renderer:console-log',
} as const;

export type RendererConsoleChannel = typeof IPC_CHANNELS.RENDERER_CONSOLE_LOG;

export type RendererConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface RendererConsolePayload {
  level: RendererConsoleLevel;
  args: unknown[];
}
