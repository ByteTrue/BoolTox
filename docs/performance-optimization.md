# 性能优化指南

本指南提供 BoolTox 的性能优化技巧，涵盖应用启动、内存占用、工具响应速度等方面。

---

## 性能指标

### 正常性能基准

| 指标 | 正常范围 | 优化目标 |
|------|---------|----------|
| **启动时间** | 3-5 秒 | < 3 秒 |
| **主进程内存** | 150-250 MB | < 150 MB |
| **渲染进程内存** | 100-200 MB | < 100 MB |
| **工具启动时间** | 5-10 秒 | < 5 秒 |
| **标签页切换** | < 100 ms | < 50 ms |

---

## 启动性能优化

### 1. 减少启动加载项

**问题**：首次启动时间超过 10 秒

**优化措施**：

**禁用不必要的工具源**
```
设置 → 工具源 → 禁用不常用的工具源
```

**延迟加载工具列表**
```typescript
// packages/client/electron/main.ts
app.on('ready', async () => {
  // ✅ 先创建窗口
  mainWindow = createMainWindow();
  mainWindow.show();

  // ✅ 后台加载工具
  setTimeout(async () => {
    await toolManager.loadTools();
  }, 1000);
});
```

### 2. 清理缓存

**定期清理缓存文件**：
```bash
# macOS
rm -rf ~/Library/Caches/BoolTox/
rm -rf ~/Library/Application\ Support/BoolTox/Cache/

# Windows
rd /s /q %LOCALAPPDATA%\BoolTox\Cache
rd /s /q %APPDATA%\BoolTox\Cache

# Linux
rm -rf ~/.cache/BoolTox/
```

### 3. 优化 Electron 启动参数

**文件**：`packages/client/electron/main.ts`

```typescript
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('enable-gpu-rasterization');
```

---

## 内存优化

### 1. 限制同时运行的工具数量

**建议**：
- 最多同时运行 5-10 个工具
- 关闭不使用的工具标签页
- 使用「收藏」功能快速访问常用工具

### 2. 主进程内存优化

**优化 ToolManager 缓存**：

**文件**：`packages/client/electron/services/tool/tool-manager.ts`

```typescript
// ❌ 缓存所有工具完整信息
private tools: Map<string, ToolRuntime> = new Map();

// ✅ 仅缓存必要信息
private tools: Map<string, {
  id: string;
  manifest: Pick<ToolManifest, 'name' | 'version' | 'runtime'>;
  path: string;
}> = new Map();
```

**定期清理未使用的工具状态**：
```typescript
// ToolRunner 中添加内存清理
private cleanupUnusedStates() {
  const now = Date.now();
  for (const [id, state] of this.states.entries()) {
    // 停止超过 30 分钟的工具
    if (state.status === 'stopped' && now - state.lastUsed > 1800000) {
      this.states.delete(id);
    }
  }
}
```

### 3. 渲染进程内存优化

**减少 React 重渲染**：

**文件**：`packages/client/src/renderer/contexts/module-context.tsx`

```typescript
// ✅ 使用 useMemo 缓存计算结果
const installedModules = useMemo(() => {
  return modules.filter(m => m.runtime.installed);
}, [modules]);

// ✅ 使用 useCallback 稳定回调函数
const openModule = useCallback(async (id: string) => {
  // ...
}, []);
```

**虚拟化长列表**（未实现，计划中）：
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={modules.length}
  itemSize={80}
>
  {({ index, style }) => (
    <ModuleCard module={modules[index]} style={style} />
  )}
</FixedSizeList>
```

---

## 工具性能优化

### 1. Python 工具优化

**使用 uvloop（异步 IO 加速）**：

```python
# requirements.txt
flask
uvloop  # 性能提升 2-4x

# main.py
import uvloop
import asyncio

uvloop.install()
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
```

**启用生产模式**：
```python
# ❌ 开发模式（慢）
app.run(debug=True)

# ✅ 生产模式（快）
app.run(debug=False, threaded=True)
```

**预加载依赖**：
```python
# main.py 顶部
import flask
import requests
import pandas  # 提前加载，避免首次使用时延迟
```

### 2. Node.js 工具优化

**使用 PM2 管理进程**：

```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "process",
      "entry": "pm2",
      "args": ["start", "server.js", "--name", "my-tool"],
      "port": 8001
    }
  }
}
```

**启用 Node.js 性能优化**：
```bash
NODE_ENV=production node --max-old-space-size=512 server.js
```

### 3. 减少工具启动时间

**优化依赖安装**：

**使用哈希检测（已内置）**：
```typescript
// PythonManager 自动检测依赖变化
needsToolRequirementsSetup(toolId: string, requirementsPath: string): boolean {
  const currentHash = sha256(fs.readFileSync(requirementsPath));
  const savedHash = this.readHashFile(toolId);
  return currentHash !== savedHash;
}
```

**并行安装依赖**（未实现，计划中）：
```typescript
// 同时安装多个工具的依赖
await Promise.all(
  toolIds.map(id => pythonManager.ensureDependencies(id))
);
```

---

## 网络性能优化

### 1. 使用 CDN 加速

**jsDelivr CDN（已内置）**：
```typescript
// GitOpsService 自动使用 CDN
const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`;
```

**自定义 CDN**：
```typescript
// packages/client/electron/services/git-ops.service.ts
const CDN_BASE_URL = process.env.BOOLTOX_CDN_URL || 'https://cdn.jsdelivr.net';
```

### 2. 缓存工具元数据

**启用缓存（已内置）**：
```typescript
// GitOpsService 缓存工具列表（15 分钟）
private cache: Map<string, { data: ToolRegistry; timestamp: number }> = new Map();
```

**手动清除缓存**：
```
设置 → 高级 → 清除缓存
```

### 3. 配置代理

**系统代理**：
```bash
# macOS/Linux
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890

# Windows
set http_proxy=http://127.0.0.1:7890
set https_proxy=http://127.0.0.1:7890
```

**Electron 代理配置**：
```typescript
// main.ts
app.commandLine.appendSwitch('proxy-server', 'http://127.0.0.1:7890');
```

---

## UI 性能优化

### 1. 减少标签页卡顿

**优化 WebView 渲染**：

**文件**：`packages/client/src/renderer/contexts/tool-tab-context.tsx`

```typescript
// ✅ 使用 will-change 优化动画
<Box
  sx={{
    willChange: 'transform, opacity',
    transition: 'transform 0.2s ease',
  }}
>
```

**延迟渲染未激活标签页**：
```typescript
{tabs.map(tab => (
  <TabPanel value={activeTab} index={tab.id}>
    {activeTab === tab.id ? (
      <ToolIframe url={tab.url} />
    ) : (
      <Skeleton variant="rectangular" height="100%" />
    )}
  </TabPanel>
))}
```

### 2. 优化 React 渲染

**使用 React.memo 避免无效渲染**：
```typescript
export const ModuleCard = React.memo(({ module }: { module: ModuleInstance }) => {
  return <Box>{/* ... */}</Box>;
});
```

**分割 Context 避免全局重渲染**：
```typescript
// ❌ 单一 Context（全部数据变化都会重渲染）
<AppContext.Provider value={{ modules, tabs, toasts }}>

// ✅ 分割 Context（按需渲染）
<ModuleContext.Provider value={modules}>
  <ToolTabContext.Provider value={tabs}>
    <ToastContext.Provider value={toasts}>
```

### 3. 使用 Web Worker

**卸载 CPU 密集任务到 Worker**：

```typescript
// packages/client/src/renderer/workers/parser.worker.ts
self.onmessage = (e) => {
  const result = parseHeavyData(e.data);
  self.postMessage(result);
};

// 使用 Worker
const worker = new Worker('parser.worker.ts');
worker.postMessage(data);
worker.onmessage = (e) => {
  setResult(e.data);
};
```

---

## 磁盘 I/O 优化

### 1. 减少日志写入

**调整日志级别**：
```typescript
// packages/client/electron/utils/logger.ts
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
```

**日志轮转**（避免日志文件过大）：
```typescript
transports: [
  new winston.transports.File({
    filename: 'main.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,      // 保留 5 个文件
  }),
],
```

### 2. 优化配置文件读写

**批量写入配置**：
```typescript
// ❌ 频繁写入
config.set('key1', value1);
config.set('key2', value2);
config.set('key3', value3);

// ✅ 批量写入
config.set({
  key1: value1,
  key2: value2,
  key3: value3,
});
```

**使用防抖（debounce）**：
```typescript
import { debounce } from 'lodash';

const saveConfig = debounce((config) => {
  fs.writeFileSync('config.json', JSON.stringify(config));
}, 1000);
```

---

## 构建优化

### 1. 减小打包体积

**Tree-shaking 优化**：

**文件**：`packages/client/vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console.log
        drop_debugger: true,
      },
    },
  },
});
```

**排除不必要的依赖**：
```json
{
  "files": [
    "dist/**/*",
    "!dist/**/*.map",     // 排除 source map
    "!dist/**/*.test.js", // 排除测试文件
  ]
}
```

### 2. 启用代码压缩

**Electron asar 打包**：
```json5
// electron-builder.json5
{
  asar: true,
  asarUnpack: [
    'node_modules/better-sqlite3/**/*',  // 原生模块不压缩
  ],
}
```

### 3. 使用 V8 快照（高级）

**生成 V8 快照**：
```bash
electron-mksnapshot --output_dir=snapshots src/preload.js
```

---

## 监控与诊断

### 1. 启用性能监控

**集成 Sentry（可选）**：

```typescript
import * as Sentry from '@sentry/electron';

Sentry.init({
  dsn: 'YOUR_DSN',
  tracesSampleRate: 0.1,
});
```

**自定义性能指标**：
```typescript
performance.mark('tool-start');
await toolRunner.startTool(id);
performance.mark('tool-ready');
performance.measure('tool-startup', 'tool-start', 'tool-ready');

const measure = performance.getEntriesByName('tool-startup')[0];
console.log(`工具启动耗时: ${measure.duration}ms`);
```

### 2. Chrome DevTools 性能分析

**启用 DevTools**：
```
设置 → 开发者 → 启用开发者工具
```

**性能分析步骤**：
1. 打开 DevTools（F12 或 Cmd+Option+I）
2. 切换到「Performance」标签
3. 点击「Record」开始录制
4. 执行操作（如启动工具）
5. 点击「Stop」停止录制
6. 分析火焰图，找出耗时操作

### 3. Node.js Profiling

**生成 CPU Profile**：
```bash
node --inspect --prof server.js
```

**分析 Profile**：
```bash
node --prof-process isolate-*.log > profile.txt
```

---

## 最佳实践

### 1. 工具开发者

- ✅ 使用生产模式运行（`debug=False`, `NODE_ENV=production`）
- ✅ 启用 HTTP 缓存（静态资源）
- ✅ 压缩响应（gzip / brotli）
- ✅ 延迟加载非关键资源
- ❌ 避免在启动时执行耗时操作
- ❌ 避免频繁写入日志

### 2. BoolTox 用户

- ✅ 定期清理缓存（每月）
- ✅ 关闭不使用的工具
- ✅ 禁用不需要的工具源
- ✅ 使用 SSD（而非机械硬盘）
- ❌ 避免同时运行 10+ 个工具
- ❌ 避免在低配置设备上运行大型工具

### 3. Fork 定制者

- ✅ 移除不必要的功能（如遥测）
- ✅ 优化默认配置（减少启动加载）
- ✅ 使用 CDN 加速资源加载
- ✅ 启用代码压缩和混淆
- ❌ 避免在主进程中执行耗时操作
- ❌ 避免过度定制导致维护困难

---

## 性能检查清单

### 启动性能

- [ ] 启动时间 < 5 秒
- [ ] 主进程内存 < 200 MB
- [ ] 渲染进程内存 < 150 MB
- [ ] 禁用不必要的工具源
- [ ] 清理缓存文件

### 运行时性能

- [ ] 标签页切换 < 100 ms
- [ ] 同时运行工具 < 10 个
- [ ] 工具启动时间 < 10 秒
- [ ] 内存占用稳定（无泄漏）

### 构建性能

- [ ] 打包体积 < 150 MB（macOS）
- [ ] 启用代码压缩
- [ ] 排除不必要的依赖
- [ ] 使用 asar 打包

---

## 参考资料

- **Electron 性能优化**：https://www.electronjs.org/docs/latest/tutorial/performance
- **React 性能优化**：https://react.dev/learn/render-and-commit
- **Node.js 性能调优**：https://nodejs.org/en/docs/guides/simple-profiling/

---

**持续优化**：性能优化是一个持续过程，建议定期（每个版本）进行性能测试和优化。
