import { contextBridge, ipcRenderer } from 'electron';

// Whitelisted channels for plugin communication
const VALID_CHANNELS = [
  'booltox:api:call',
  'window:control' // 添加窗口控制channel
];

// runtime state for titlebar
let customTitlebarEnabled = true;
let titlebarRoot: HTMLElement | null = null;
let titleTextEl: HTMLElement | null = null;

function createTitlebar() {
  if (!customTitlebarEnabled || titlebarRoot) return;

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

  // dark mode adaptation
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
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

  const btnBase = [
    'height:32px','width:32px','display:flex','align-items:center','justify-content:center',
    'border:1px solid rgba(148,163,184,0.35)','border-radius:12px',
    'background:rgba(255,255,255,0.55)','cursor:pointer','transition:all .25s ease',
    'color:#1e293b'
  ];
  if (dark) {
    btnBase[6] = 'background:rgba(40,42,48,0.55)';
    btnBase[8] = 'color:#e2e8f0';
  }

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
  controls.appendChild(makeBtn('最小化', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>', () => {
    ipcRenderer.invoke('window:control', 'minimize');
  }));
  // maximize - 匹配主窗口 Square 图标 (lucide-react)
  controls.appendChild(makeBtn('最大化/还原', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>', () => {
    ipcRenderer.invoke('window:control', 'toggle-maximize');
  }));
  // close - 匹配主窗口 X 图标 (lucide-react)
  controls.appendChild(makeBtn('关闭', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', () => {
    ipcRenderer.invoke('window:control', 'close');
  }, 'border-color:rgba(248,113,113,0.9);color:#ef4444;background:rgba(248,113,113,0.15)'));

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

const booltoxAPI = {
  window: {
    hide: () => ipcRenderer.invoke('booltox:api:call', 'window', 'hide'),
    show: () => ipcRenderer.invoke('booltox:api:call', 'window', 'show'),
    close: () => ipcRenderer.invoke('window:control', 'close'),
    minimize: () => ipcRenderer.invoke('window:control', 'minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:control', 'toggle-maximize'),
    setSize: (width: number, height: number) => ipcRenderer.invoke('booltox:api:call', 'window', 'setSize', { width, height }),
    setTitle: (title: string) => { document.title = title; updateTitleFromDocument(); },
    disableCustomTitlebar: () => { customTitlebarEnabled = false; if (titlebarRoot) { titlebarRoot.remove(); titlebarRoot = null; document.body.style.marginTop = '0'; } },
    enableCustomTitlebar: () => { customTitlebarEnabled = true; if (!titlebarRoot) createTitlebar(); }
  },
  shell: {
    exec: (command: string, args: string[] = []) => ipcRenderer.invoke('booltox:api:call', 'shell', 'exec', { command, args }),
    runPython: (scriptPath: string, args: string[] = []) => ipcRenderer.invoke('booltox:api:call', 'shell', 'runPython', { scriptPath, args }),
  },
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('booltox:api:call', 'fs', 'readFile', { path }),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('booltox:api:call', 'fs', 'writeFile', { path, content }),
  },
  db: {
    get: (key: string) => ipcRenderer.invoke('booltox:api:call', 'db', 'get', { key }),
    set: (key: string, value: any) => ipcRenderer.invoke('booltox:api:call', 'db', 'set', { key, value }),
  }
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

console.log('[BoolTox] Plugin preload script loaded');
