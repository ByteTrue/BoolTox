import { useMemo } from 'react';

// Define types for window.booltox
declare global {
  interface Window {
    booltox: {
      window: {
        hide: () => Promise<void>;
        show: () => Promise<void>;
        close: () => Promise<void>;
        setSize: (width: number, height: number) => Promise<void>;
      };
      shell: {
        exec: (command: string, args?: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
        runPython: (scriptPath: string, args?: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
      };
      fs: {
        readFile: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
        writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      };
      db: {
        get: <T>(key: string) => Promise<T | undefined>;
        set: <T>(key: string, value: T) => Promise<{ success: boolean }>;
      };
    };
  }
}

export function useBooltox() {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.booltox) {
      console.warn('BoolTox API not found. Are you running inside BoolTox?');
      // Return mock API for development outside BoolTox
      return {
        window: {
          hide: async () => console.log('Mock: window.hide'),
          show: async () => console.log('Mock: window.show'),
          close: async () => console.log('Mock: window.close'),
          setSize: async (w: number, h: number) => console.log(`Mock: window.setSize(${w}, ${h})`),
        },
        shell: {
          exec: async (cmd: string, args: string[] = []) => {
            console.log(`Mock: shell.exec(${cmd}, ${args})`);
            return { success: true, stdout: 'Mock output' };
          },
          runPython: async (script: string, args: string[] = []) => {
            console.log(`Mock: shell.runPython(${script}, ${args})`);
            return { success: true, stdout: 'Mock python output' };
          },
        },
        fs: {
          readFile: async (path: string) => {
            console.log(`Mock: fs.readFile(${path})`);
            return { success: true, data: 'Mock file content' };
          },
          writeFile: async (path: string, content: string) => {
            console.log(`Mock: fs.writeFile(${path})`);
            return { success: true };
          },
        },
        db: {
          get: async (key: string) => {
            console.log(`Mock: db.get(${key})`);
            return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : undefined;
          },
          set: async (key: string, value: any) => {
            console.log(`Mock: db.set(${key}, ${value})`);
            localStorage.setItem(key, JSON.stringify(value));
            return { success: true };
          },
        },
      };
    }
    return window.booltox;
  }, []);
}
