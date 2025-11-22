import { contextBridge, ipcRenderer } from 'electron';

// Whitelisted channels for plugin communication
const VALID_CHANNELS = [
  'booltox:api:call'
];

const booltoxAPI = {
  // Window management
  window: {
    hide: () => ipcRenderer.invoke('booltox:api:call', 'window', 'hide'),
    show: () => ipcRenderer.invoke('booltox:api:call', 'window', 'show'),
    close: () => ipcRenderer.invoke('booltox:api:call', 'window', 'close'),
    setSize: (width: number, height: number) => 
      ipcRenderer.invoke('booltox:api:call', 'window', 'setSize', { width, height }),
  },

  // System shell (restricted)
  shell: {
    exec: (command: string, args: string[] = []) => 
      ipcRenderer.invoke('booltox:api:call', 'shell', 'exec', { command, args }),
    
    runPython: (scriptPath: string, args: string[] = []) => 
      ipcRenderer.invoke('booltox:api:call', 'shell', 'runPython', { scriptPath, args }),
  },

  // File system (scoped)
  fs: {
    readFile: (path: string) => 
      ipcRenderer.invoke('booltox:api:call', 'fs', 'readFile', { path }),
    writeFile: (path: string, content: string) => 
      ipcRenderer.invoke('booltox:api:call', 'fs', 'writeFile', { path, content }),
  },

  // Database (KV store)
  db: {
    get: (key: string) => 
      ipcRenderer.invoke('booltox:api:call', 'db', 'get', { key }),
    set: (key: string, value: any) => 
      ipcRenderer.invoke('booltox:api:call', 'db', 'set', { key, value }),
  }
};

// Expose API to the plugin
contextBridge.exposeInMainWorld('booltox', booltoxAPI);

console.log('[BoolTox] Plugin preload script loaded');
