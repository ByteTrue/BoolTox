/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { BooltoxAPI, BooltoxBackendMessage, BooltoxEncoding, PluginBackendConfig } from '@booltox/shared';

// ============================================================================
// Types for JSON-RPC Backend API
// ============================================================================

type BackendEventListener = (data: unknown) => void;

// Event listeners storage: Map<channelId, Map<event, Set<listener>>>
const backendEventListeners = new Map<string, Map<string, Set<BackendEventListener>>>();

// Ready state tracking
const backendReadyState = new Map<string, boolean>();
const backendReadyWaiters = new Map<string, Array<{ resolve: () => void; reject: (err: Error) => void }>>();

// runtime state for titlebar
let customTitlebarEnabled = true;
let titlebarRoot: HTMLElement | null = null;
let titleTextEl: HTMLElement | null = null;

function detectDarkMode() {
  try {
    const mediaDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    const doc = document.documentElement;
    if (!doc) return mediaDark;
    const scheme = getComputedStyle(doc).getPropertyValue('color-scheme') || '';
    const schemeHasDark = scheme
      .split(/[\s,]+/)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
      .some((token) => token === 'dark');
    return schemeHasDark || mediaDark;
  } catch {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }
}

function ensureTitlebarStyleSheet() {
  if (document.getElementById('booltox-plugin-titlebar-style')) return;
  const style = document.createElement('style');
  style.id = 'booltox-plugin-titlebar-style';
  style.textContent = `
    #booltox-plugin-titlebar {
      isolation: isolate;
    }
    #booltox-plugin-titlebar button,
    #booltox-plugin-titlebar svg {
      pointer-events: auto;
    }
    #booltox-plugin-titlebar button svg {
      display: block;
      pointer-events: none;
    }
    #booltox-plugin-titlebar button svg *,
    #booltox-plugin-titlebar button svg line,
    #booltox-plugin-titlebar button svg rect {
      vector-effect: non-scaling-stroke;
    }
  `;
  document.head.appendChild(style);
}

function createTitlebar() {
  if (!customTitlebarEnabled || titlebarRoot) return;

  ensureTitlebarStyleSheet();

  titlebarRoot = document.createElement('div');
  titlebarRoot.id = 'booltox-plugin-titlebar';
  titlebarRoot.style.cssText = [
    'position:fixed',
    'top:0','left:0','right:0','height:44px',
    'display:flex','align-items:center','justify-content:space-between',
    'padding:0 12px','gap:8px',
    'backdrop-filter:blur(60px) saturate(180%) brightness(1.05)',
    'background:linear-gradient(135deg, rgba(101,187,233,0.12) 0%, rgba(249,193,207,0.1) 100%), rgba(255,255,255,0.72)',
    'border-bottom:1px solid rgba(148,163,184,0.35)',
    'font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif',
    'font-size:12px','letter-spacing:0.08em','text-transform:uppercase',
    'color:#475569','z-index:9999','-webkit-app-region:drag','user-select:none'
  ].join(';');

  const dark = detectDarkMode();
  const iconColor = dark ? '#e2e8f0' : '#1e293b';
  const buttonBorder = dark ? 'rgba(71,85,105,0.4)' : 'rgba(148,163,184,0.35)';
  const buttonBackground = dark ? 'rgba(40,42,48,0.55)' : 'rgba(255,255,255,0.55)';

  if (dark) {
    titlebarRoot.style.background = 'linear-gradient(135deg, rgba(101,187,233,0.08) 0%, rgba(249,193,207,0.06) 100%), rgba(28,30,35,0.88)';
    titlebarRoot.style.color = 'rgba(255,255,255,0.6)';
    titlebarRoot.style.borderBottom = '1px solid rgba(71,85,105,0.35)';
  }

  // left spacer / title
  titleTextEl = document.createElement('div');
  titleTextEl.id = 'booltox-plugin-titlebar-text';
  titleTextEl.style.flex = '1';
  titleTextEl.style.paddingLeft = '4px';
  titleTextEl.style.fontWeight = '600';
  titleTextEl.style.fontSize = '12px';
  titleTextEl.style.overflow = 'hidden';
  titleTextEl.style.textOverflow = 'ellipsis';
  titleTextEl.style.whiteSpace = 'nowrap';
  titlebarRoot.appendChild(titleTextEl);

  // right controls container
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '6px';
  // 通过 setProperty 设置自定义窗口拖拽区域属性避免 TS 报错
  controls.style.setProperty('-webkit-app-region', 'no-drag');

  const important = (prop: string, value: string) => `${prop}:${value} !important`;
  const btnBase = [
    important('height', '32px'),
    important('width', '32px'),
    important('display', 'flex'),
    important('align-items', 'center'),
    important('justify-content', 'center'),
    important('padding', '0'),
    important('margin', '0'),
    important('gap', '0'),
    important('border', `1px solid ${buttonBorder}`),
    important('border-radius', '12px'),
    important('background', buttonBackground),
    important('box-shadow', 'none'),
    important('outline', 'none'),
    important('font-size', '0'),
    important('line-height', '0'),
    important('-webkit-app-region', 'no-drag'),
    'cursor:pointer',
    'transition:all .25s ease',
    important('color', iconColor)
  ];

  const svgAttrs = (size: number) =>
    `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="presentation"`;

  function makeBtn(label: string, svg: string, handler: () => void, extraHover?: string) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.style.cssText = btnBase.join(';');
    b.innerHTML = svg;
    b.onmousedown = e => e.stopPropagation();
    b.ondblclick = e => e.stopPropagation();
    b.onclick = e => { e.stopPropagation(); handler(); };
    b.onmouseenter = () => { b.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)'; if (extraHover) b.style.cssText += ';'+extraHover; };
    b.onmouseleave = () => { b.style.boxShadow = 'none'; if (extraHover) b.style.cssText = btnBase.join(';'); };
    return b;
  }

  // minimize - 匹配主窗口 Minus 图标 (lucide-react)
  controls.appendChild(makeBtn('最小化', `<svg ${svgAttrs(16)}><line x1="5" y1="12" x2="19" y2="12"/></svg>`, () => {
    ipcRenderer.invoke('window:control', 'minimize');
  }));
  // maximize - 匹配主窗口 Square 图标 (lucide-react)
  controls.appendChild(makeBtn('最大化/还原', `<svg ${svgAttrs(16)}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`, () => {
    ipcRenderer.invoke('window:control', 'toggle-maximize');
  }));
  // close - 匹配主窗口 X 图标 (lucide-react)
  controls.appendChild(makeBtn('关闭', `<svg ${svgAttrs(18)}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`, () => {
    ipcRenderer.invoke('window:control', 'close');
  }, 'border-color:rgba(248,113,113,0.9) !important;color:#ef4444 !important;background:rgba(248,113,113,0.15) !important'));

  titlebarRoot.appendChild(controls);
  document.body.appendChild(titlebarRoot);

  // push content downward
  const existingMarginTop = parseFloat(getComputedStyle(document.body).marginTop || '0');
  document.body.style.marginTop = (existingMarginTop + 44) + 'px';

  updateTitleFromDocument();
}

function updateTitleFromDocument() {
  if (!titleTextEl) return;
  const t = document.title || 'PLUGIN';
  titleTextEl.textContent = t.toUpperCase();
}

function watchTitleChanges() {
  const head = document.head;
  if (!head) return;
  const obs = new MutationObserver(() => updateTitleFromDocument());
  obs.observe(head, { subtree: true, childList: true, characterData: true });
}

const callAPI = <T = unknown>(module: string, method: string, payload?: unknown) =>
  ipcRenderer.invoke('booltox:api:call', module, method, payload) as Promise<T>;

const storageBridge = {
  get: <T = unknown>(key: string) => callAPI<T | undefined>('storage', 'get', { key }),
  set: (key: string, value: unknown) => callAPI<void>('storage', 'set', { key, value }),
  delete: (key: string) => callAPI<void>('storage', 'delete', { key }),
  list: () => callAPI<string[]>('storage', 'list'),
};

const backendSubscribers = new Set<(message: BooltoxBackendMessage) => void>();

// Handle backend messages from main process
ipcRenderer.on('booltox:backend:message', (_event, message: BooltoxBackendMessage) => {
  // Forward to legacy subscribers
  backendSubscribers.forEach((listener) => listener(message));
});

// Handle backend events (JSON-RPC $event notifications)
ipcRenderer.on('booltox:backend:event', (_event, payload: { channelId: string; event: string; data: unknown }) => {
  const { channelId, event, data } = payload;
  const channelListeners = backendEventListeners.get(channelId);
  if (channelListeners) {
    const eventListeners = channelListeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`[BoolTox] Error in backend event listener for ${event}:`, e);
        }
      });
    }
  }
});

// Handle backend ready notifications
ipcRenderer.on('booltox:backend:ready', (_event, payload: { channelId: string }) => {
  const { channelId } = payload;
  backendReadyState.set(channelId, true);

  // Resolve all waiters
  const waiters = backendReadyWaiters.get(channelId);
  if (waiters) {
    waiters.forEach(({ resolve }) => resolve());
    backendReadyWaiters.delete(channelId);
  }
});

// Helper: Add event listener for a channel
function addBackendEventListener(channelId: string, event: string, listener: BackendEventListener): () => void {
  let channelListeners = backendEventListeners.get(channelId);
  if (!channelListeners) {
    channelListeners = new Map();
    backendEventListeners.set(channelId, channelListeners);
  }

  let eventListeners = channelListeners.get(event);
  if (!eventListeners) {
    eventListeners = new Set();
    channelListeners.set(event, eventListeners);
  }

  eventListeners.add(listener);

  // Return unsubscribe function
  return () => {
    eventListeners?.delete(listener);
    if (eventListeners?.size === 0) {
      channelListeners?.delete(event);
    }
    if (channelListeners?.size === 0) {
      backendEventListeners.delete(channelId);
    }
  };
}

// Helper: Remove event listener
function removeBackendEventListener(channelId: string, event: string, listener: BackendEventListener): void {
  const channelListeners = backendEventListeners.get(channelId);
  if (!channelListeners) return;

  const eventListeners = channelListeners.get(event);
  if (!eventListeners) return;

  eventListeners.delete(listener);
  if (eventListeners.size === 0) {
    channelListeners.delete(event);
  }
  if (channelListeners.size === 0) {
    backendEventListeners.delete(channelId);
  }
}

const booltoxAPI = {
  window: {
    hide: () => callAPI<void>('window', 'hide'),
    show: () => callAPI<void>('window', 'show'),
    close: () => callAPI<void>('window', 'close'),
    minimize: () => callAPI<void>('window', 'minimize'),
    toggleMaximize: () => callAPI<void>('window', 'toggleMaximize'),
    setSize: (width: number, height: number) => callAPI<void>('window', 'setSize', { width, height }),
    setTitle: (title: string) => {
      document.title = title;
      updateTitleFromDocument();
      return callAPI<void>('window', 'setTitle', { title });
    },
    disableCustomTitlebar: () => { customTitlebarEnabled = false; if (titlebarRoot) { titlebarRoot.remove(); titlebarRoot = null; document.body.style.marginTop = '0'; } },
    enableCustomTitlebar: () => { customTitlebarEnabled = true; if (!titlebarRoot) createTitlebar(); }
  },
  shell: {
    exec: (command: string, args: string[] = []) => callAPI('shell', 'exec', { command, args }),
    runPython: (scriptPath: string, args: string[] = [], timeoutMs?: number) =>
      callAPI('shell', 'runPython', { scriptPath, args, timeoutMs }),
    spawn: () => Promise.reject(new Error('shell.spawn is not implemented yet')),
  },
  fs: {
    readFile: (path: string, encoding?: BooltoxEncoding) => callAPI('fs', 'readFile', { path, encoding }),
    writeFile: (path: string, content: string | Uint8Array, encoding?: BooltoxEncoding) =>
      callAPI('fs', 'writeFile', { path, content, encoding }),
    listDir: (path = '.') => callAPI('fs', 'listDir', { path }),
    stat: (path: string) => callAPI('fs', 'stat', { path }),
  },
  storage: storageBridge,
  db: storageBridge,
  /**
   * Python 运行时 API
   * 提供完整的 Python 环境管理和脚本执行能力
   */
  python: {
    /**
     * 获取 Python 环境状态
     * @returns {Promise<PythonStatus>} 环境状态信息
     */
    getStatus: () => callAPI('python', 'getStatus'),
    
    /**
     * 确保 Python 环境就绪（自动安装 Python 和创建虚拟环境）
     * 首次调用可能需要下载 Python（约 40-50MB）
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    ensure: () => callAPI('python', 'ensure'),
    
    installDeps: (packages: string[]) => callAPI('python', 'installDeps', { packages }),
    listDeps: () => callAPI('python', 'listDeps'),
    runCode: (code: string, timeout?: number) => callAPI('python', 'runCode', { code, timeout }),
    runScript: (scriptPath: string, args?: string[], timeout?: number) =>
      callAPI('python', 'runScript', { scriptPath, args, timeout }),
  },
  backend: {
    // Legacy API (backward compatible)
    register: (definition?: PluginBackendConfig) => callAPI('backend', 'register', definition),
    postMessage: (channelId: string, payload: unknown) =>
      callAPI('backend', 'postMessage', { channelId, payload }),
    dispose: (channelId: string) => {
      // Clean up event listeners for this channel
      backendEventListeners.delete(channelId);
      backendReadyState.delete(channelId);
      backendReadyWaiters.delete(channelId);
      return callAPI('backend', 'dispose', { channelId });
    },
    onMessage: (listener: (message: BooltoxBackendMessage) => void) => {
      backendSubscribers.add(listener);
      return () => backendSubscribers.delete(listener);
    },

    // New JSON-RPC API
    /**
     * Call a method on the backend and wait for response (JSON-RPC request)
     * @param channelId - Backend channel ID
     * @param method - Method name to call
     * @param params - Method parameters (optional)
     * @param timeoutMs - Timeout in milliseconds (default: 30000)
     * @returns Promise resolving to the method result
     */
    call: <TParams = unknown, TResult = unknown>(
      channelId: string,
      method: string,
      params?: TParams,
      timeoutMs?: number
    ): Promise<TResult> => callAPI<TResult>('backend', 'call', { channelId, method, params, timeoutMs }),

    /**
     * Send a notification to the backend (no response expected)
     * @param channelId - Backend channel ID
     * @param method - Method name
     * @param params - Method parameters (optional)
     */
    notify: <TParams = unknown>(
      channelId: string,
      method: string,
      params?: TParams
    ): Promise<void> => callAPI<void>('backend', 'notify', { channelId, method, params }),

    /**
     * Subscribe to backend events
     * @param channelId - Backend channel ID
     * @param event - Event name to listen for
     * @param listener - Callback function
     * @returns Unsubscribe function
     */
    on: (channelId: string, event: string, listener: BackendEventListener): (() => void) => {
      return addBackendEventListener(channelId, event, listener);
    },

    /**
     * Subscribe to backend events (once)
     * @param channelId - Backend channel ID
     * @param event - Event name to listen for
     * @param listener - Callback function
     * @returns Unsubscribe function
     */
    once: (channelId: string, event: string, listener: BackendEventListener): (() => void) => {
      const wrappedListener: BackendEventListener = (data) => {
        unsubscribe();
        listener(data);
      };
      const unsubscribe = addBackendEventListener(channelId, event, wrappedListener);
      return unsubscribe;
    },

    /**
     * Remove event listener
     * @param channelId - Backend channel ID
     * @param event - Event name
     * @param listener - Callback function to remove
     */
    off: (channelId: string, event: string, listener: BackendEventListener): void => {
      removeBackendEventListener(channelId, event, listener);
    },

    /**
     * Check if backend is ready
     * @param channelId - Backend channel ID
     * @returns true if backend has sent $ready notification
     */
    isReady: (channelId: string): boolean => {
      return backendReadyState.get(channelId) ?? false;
    },

    /**
     * Wait for backend to be ready
     * @param channelId - Backend channel ID
     * @param timeoutMs - Timeout in milliseconds (default: 30000)
     * @returns Promise that resolves when backend is ready
     */
    waitForReady: (channelId: string, timeoutMs: number = 30000): Promise<void> => {
      // Already ready
      if (backendReadyState.get(channelId)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Remove from waiters
          const waiters = backendReadyWaiters.get(channelId);
          if (waiters) {
            const index = waiters.findIndex((w) => w.resolve === resolve);
            if (index !== -1) waiters.splice(index, 1);
            if (waiters.length === 0) backendReadyWaiters.delete(channelId);
          }
          reject(new Error(`Backend ${channelId} did not become ready within ${timeoutMs}ms`));
        }, timeoutMs);

        const waiter = {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (err: Error) => {
            clearTimeout(timeout);
            reject(err);
          },
        };

        let waiters = backendReadyWaiters.get(channelId);
        if (!waiters) {
          waiters = [];
          backendReadyWaiters.set(channelId, waiters);
        }
        waiters.push(waiter);
      });
    },
  },
  telemetry: {
    send: (event: string, payload?: Record<string, unknown>) =>
      callAPI('telemetry', 'send', { event, payload }),
  },
} satisfies BooltoxAPI & {
  db: BooltoxAPI['storage'];
  window: BooltoxAPI['window'] & {
    disableCustomTitlebar: () => void;
    enableCustomTitlebar: () => void;
  };
};

// Expose API to the plugin
contextBridge.exposeInMainWorld('booltox', booltoxAPI);

// Inject titlebar after DOM ready
window.addEventListener('DOMContentLoaded', () => {
  try {
    if (customTitlebarEnabled) {
      createTitlebar();
      watchTitleChanges();
    }
  } catch (e) {
    console.warn('[BoolTox] Failed to inject custom titlebar', e);
  }
});
