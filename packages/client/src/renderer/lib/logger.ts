/* eslint-disable no-console */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableNamespace: boolean;
}

export interface LogEvent {
  level: LogLevel;
  namespace: string;
  message: string;
  args: unknown[];
  timestamp: number;
}

export type LogSink = (event: LogEvent) => void;

type WindowWithViteEnv = Window & {
  __VITE_ENV__?: {
    PROD?: boolean;
    LOG_LEVEL?: string;
    VITE_LOG_LEVEL?: string;
  };
};

function readEnvLogLevel(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const { LOG_LEVEL, VITE_LOG_LEVEL } = process.env;
    if (LOG_LEVEL) return LOG_LEVEL;
    if (VITE_LOG_LEVEL) return VITE_LOG_LEVEL;
  }

  try {
    const meta = (0, eval)('import.meta') as { env?: Record<string, unknown> } | undefined;
    const envValue = meta?.env?.VITE_LOG_LEVEL as string | undefined;
    if (envValue) return envValue;
  } catch {
    // import.meta 不可用时忽略
  }

  if (typeof window !== 'undefined') {
    const viteEnv = (window as WindowWithViteEnv).__VITE_ENV__;
    if (viteEnv?.LOG_LEVEL) return viteEnv.LOG_LEVEL;
    if (viteEnv?.VITE_LOG_LEVEL) return viteEnv.VITE_LOG_LEVEL;
  }

  return undefined;
}

function parseLogLevel(value: string | undefined): LogLevel | undefined {
  switch (value?.toUpperCase()) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'NONE':
      return LogLevel.NONE;
    default:
      return undefined;
  }
}

function isProduction(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return true;
  }

  if (typeof window !== 'undefined') {
    const viteEnv = (window as WindowWithViteEnv).__VITE_ENV__;
    if (typeof viteEnv?.PROD === 'boolean') {
      return viteEnv.PROD;
    }
  }

  try {
    const meta = (0, eval)('import.meta') as { env?: Record<string, unknown> } | undefined;
    const prod = meta?.env?.PROD as boolean | undefined;
    if (typeof prod === 'boolean') {
      return prod;
    }
  } catch {
    // ignore
  }

  return false;
}

function resolveDefaultLogLevel(): LogLevel {
  const envLevel = parseLogLevel(readEnvLogLevel());
  if (envLevel !== undefined) {
    return envLevel;
  }

  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return LogLevel.ERROR;
  }

  return isProduction() ? LogLevel.ERROR : LogLevel.DEBUG;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: resolveDefaultLogLevel(),
  enableTimestamp: true,
  enableNamespace: true,
};

let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };
const logSinks = new Set<LogSink>();

const notifyLogSinks = (event: LogEvent) => {
  for (const sink of logSinks) {
    try {
      sink(event);
    } catch (error) {
      console.error("Logger sink error", error);
    }
  }
};

export const registerLogSink = (sink: LogSink): (() => void) => {
  logSinks.add(sink);
  return () => {
    logSinks.delete(sink);
  };
};

export class Logger {
  private readonly namespace: string;
  private readonly config: LoggerConfig;

  constructor(namespace: string, config?: Partial<LoggerConfig>) {
    this.namespace = namespace;
    this.config = { ...globalConfig, ...config };
  }

  static create(namespace: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(namespace, config);
  }

  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  static getLogLevelFromEnv(): LogLevel {
    return resolveDefaultLogLevel();
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', (...params) => console.debug(...params), message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'INFO', (...params) => console.info(...params), message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, 'WARN', (...params) => console.warn(...params), message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, 'ERROR', (...params) => console.error(...params), message, args);
  }

  time(label: string): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.time(this.buildLabel(label));
    }
  }

  timeEnd(label: string): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.timeEnd(this.buildLabel(label));
    }
  }

  group(label: string): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.group(this.buildLabel(label));
    }
  }

  groupEnd(): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }

  private log(
    level: LogLevel,
    label: string,
    output: (...params: unknown[]) => void,
    message: string,
    args: unknown[],
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const prefixParts: string[] = [label];

    if (this.config.enableTimestamp) {
      prefixParts.push(this.getTimestamp());
    }

    if (this.config.enableNamespace) {
      prefixParts.push(`[${this.namespace}]`);
    }

    const prefix = prefixParts.join(' ');
    output(`${prefix} ${message}`.trim(), ...args);

    notifyLogSinks({
      level,
      namespace: this.namespace,
      message,
      args,
      timestamp: Date.now(),
    });
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.level === LogLevel.NONE) {
      return false;
    }

    return this.config.level <= level;
  }

  private buildLabel(label: string): string {
    if (!this.config.enableNamespace) {
      return label;
    }

    return `[${this.namespace}] ${label}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `[${hours}:${minutes}:${seconds}.${ms}]`;
  }
}

export function createLogger(namespace: string, config?: Partial<LoggerConfig>): Logger {
  return Logger.create(namespace, config);
}

export function configureLogger(config: Partial<LoggerConfig>): void {
  Logger.configure(config);
}

Logger.configure({
  level: Logger.getLogLevelFromEnv(),
});
