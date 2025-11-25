/**
 * BoolTox API 类型定义
 */

export interface PythonStatus {
  uvAvailable: boolean;
  uvVersion?: string;
  pythonInstalled: boolean;
  pythonVersion?: string;
  pythonPath?: string;
  venvExists: boolean;
  venvPath?: string;
  error?: string;
}

export interface RunResult {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface ListDepsResult {
  success: boolean;
  packages: string[];
  error?: string;
}

export interface SimpleResult {
  success: boolean;
  error?: string;
}

export interface BoolToxAPI {
  window: {
    hide: () => Promise<void>;
    show: () => Promise<void>;
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    setSize: (width: number, height: number) => Promise<void>;
    setTitle: (title: string) => void;
    disableCustomTitlebar: () => void;
    enableCustomTitlebar: () => void;
  };
  shell: {
    exec: (command: string, args?: string[]) => Promise<RunResult>;
    runPython: (scriptPath: string, args?: string[]) => Promise<RunResult>;
  };
  fs: {
    readFile: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    writeFile: (path: string, content: string) => Promise<SimpleResult>;
  };
  db: {
    get: <T = unknown>(key: string) => Promise<T | undefined>;
    set: (key: string, value: unknown) => Promise<SimpleResult>;
  };
  python: {
    getStatus: () => Promise<PythonStatus>;
    ensure: () => Promise<SimpleResult>;
    installDeps: (packages: string[]) => Promise<SimpleResult>;
    listDeps: () => Promise<ListDepsResult>;
    runCode: (code: string, timeout?: number) => Promise<RunResult>;
    runScript: (scriptPath: string, args?: string[], timeout?: number) => Promise<RunResult>;
  };
}

declare global {
  interface Window {
    booltox: BoolToxAPI;
  }
}
