# 插件管理功能重新设计

> **创建日期**: 2025-12-06
> **完成日期**: 2025-12-06
> **状态**: ✅ 已完成
> **问题**: 当前插件市场逻辑混乱（显示已安装插件 + 可以启动/停止）
> **目标**: 明确分离"插件市场"和"已安装插件"的职责
> **结果**: 已成功实现页面分离、导航系统、插件运行时、GitOps 市场

---

## 🎯 设计目标

### 核心原则
1. **职责分离**：插件市场 ≠ 插件管理
2. **清晰的用户旅程**：浏览 → 安装 → 使用 → 管理
3. **统一的入口**：工具箱首页作为总览

---

## 📐 新的页面结构

```
/tools                          工具箱首页
├── /tools/installed            我的插件（已安装）
├── /tools/market               插件市场（远程）
└── /tools/[pluginId]           插件运行页面
```

### 页面职责划分

| 页面 | URL | 职责 | 显示内容 | 主要操作 |
|------|-----|------|----------|---------|
| **工具箱首页** | `/tools` | 总览和快速访问 | 正在运行的插件<br>最近使用的插件<br>快捷入口 | 启动插件<br>跳转到已安装插件<br>跳转到插件市场 |
| **我的插件** | `/tools/installed` | 管理已安装的插件 | 已安装的所有插件<br>状态（运行中/已停止） | 启动/停止<br>卸载<br>查看详情<br>更新 |
| **插件市场** | `/tools/market` | 浏览和安装新插件 | 远程插件列表<br>官方/社区分类<br>搜索和筛选 | 安装<br>查看详情<br>收藏 |
| **插件运行** | `/tools/[pluginId]` | 运行插件 | 插件 UI | 使用插件功能 |

---

## 🖼️ 页面设计详情

### 1. 工具箱首页 (`/tools`)

**布局**：
```
┌─────────────────────────────────────────────────┐
│ 工具箱                                           │
├─────────────────────────────────────────────────┤
│ 🔷 正在运行 (2)                                  │
│ ┌────────┐  ┌────────┐                          │
│ │ 番茄钟  │  │ 剪贴板 │                          │
│ │ 运行中  │  │ 运行中 │                          │
│ └────────┘  └────────┘                          │
│                                                  │
│ 📂 最近使用                                      │
│ ┌────────┐  ┌────────┐  ┌────────┐             │
│ │ 快速笔记 │ │ 翻译工具 │ │ 正则测试│             │
│ └────────┘  └────────┘  └────────┘             │
│                                                  │
│ 快捷入口                                         │
│ [📦 我的插件]  [🛒 插件市场]  [⚙️ 设置]        │
└─────────────────────────────────────────────────┘
```

**核心功能**：
- 显示正在运行的插件（实时状态）
- 显示最近使用的插件（快速启动）
- Agent 状态指示器
- 快捷导航入口

**数据来源**：
```typescript
const { runningPlugins } = useRunningPlugins();    // Agent 实时状态
const { recentPlugins } = useRecentPlugins();       // 本地 localStorage
const { isAvailable } = useAgent();                 // Agent 连接状态
```

---

### 2. 我的插件页面 (`/tools/installed`)

**布局**：
```
┌─────────────────────────────────────────────────┐
│ 我的插件                          [🔄 刷新]      │
├─────────────────────────────────────────────────┤
│ 分类: [全部] [运行中] [已停止] [可更新]          │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 🍅 番茄钟                v1.0.0  ✅ 运行中 │    │
│ │ 基于番茄工作法的时间管理工具              │    │
│ │ [停止] [详情] [卸载]                      │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 📋 剪贴板管理         v2.1.0  ⚪ 已停止 │    │
│ │ 剪贴板历史记录和快速粘贴                │    │
│ │ [启动] [详情] [卸载] [🔄 更新]          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 📝 快速笔记          v1.5.0  ⚪ 已停止 │    │
│ │ 轻量级笔记工具，支持 Markdown            │    │
│ │ [启动] [详情] [卸载]                      │    │
│ └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**核心功能**：
- 显示所有已安装的插件
- 插件状态（运行中/已停止）
- 插件操作：
  - 启动/停止
  - 卸载
  - 查看详情
  - 更新（如果有新版本）
- 分类筛选

**数据来源**：
```typescript
const { plugins, startPlugin, stopPlugin, uninstallPlugin } = usePlugins();
```

**状态显示**：
```typescript
interface PluginCardProps {
  plugin: PluginInfo;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onUninstall: (id: string) => void;
  showActions: boolean;  // true - 显示启动/停止按钮
}
```

---

### 3. 插件市场页面 (`/tools/market`)

**布局**：
```
┌─────────────────────────────────────────────────┐
│ 插件市场                      [🔍 搜索框]        │
├─────────────────────────────────────────────────┤
│ 分类: [全部] [官方] [社区] [生产力] [开发工具]  │
│ 排序: [最新] [最热] [评分]                       │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 🍅 番茄钟                v1.0.0  ✅ 官方  │    │
│ │ 基于番茄工作法的时间管理工具              │    │
│ │ ⭐ 4.8  📦 1.2k 下载  📅 2025-12-01      │    │
│ │ [安装] [详情]                             │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 🔤 翻译工具           v2.3.0  ⚠️ 社区  │    │
│ │ 多语言翻译工具，支持 10+ 翻译引擎        │    │
│ │ ⭐ 4.5  📦 856 下载  📅 2025-11-28       │    │
│ │ [✅ 已安装] [详情]                        │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 🎨 截图工具           v1.8.0  ✅ 官方  │    │
│ │ 强大的屏幕截图和标注工具                │    │
│ │ ⭐ 4.9  📦 2.3k 下载  📅 2025-12-05      │    │
│ │ [安装] [详情] [💖 收藏]                   │    │
│ └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**核心功能**：
- 显示远程插件列表（从 GitHub 拉取）
- 插件信息：
  - 名称、版本、图标
  - 官方/社区标识
  - 描述、评分、下载量
  - 发布日期
- 插件操作：
  - 安装（如果未安装）
  - 查看详情
  - 收藏
- 搜索和筛选
- 分类浏览

**数据来源**：
```typescript
const { remotePlugins } = useRemotePlugins();      // 从 GitHub 拉取
const { plugins } = usePlugins();                   // 本地已安装
const mergedPlugins = useMemo(() =>
  mergePlugins(remotePlugins, plugins),
  [remotePlugins, plugins]
);
```

**合并逻辑**：
```typescript
function mergePlugins(remote: RemotePlugin[], local: PluginInfo[]) {
  return remote.map(rp => ({
    ...rp,
    installed: local.some(lp => lp.id === rp.id),
    installedVersion: local.find(lp => lp.id === rp.id)?.version,
    needUpdate: local.find(lp => lp.id === rp.id)?.version !== rp.version,
  }));
}
```

---

### 4. 插件运行页面 (`/tools/[pluginId]`)

**布局**：
```
┌─────────────────────────────────────────────────┐
│ ← 返回  番茄钟                       [⚙️ 设置]   │
├─────────────────────────────────────────────────┤
│                                                  │
│            [插件 UI 渲染区域]                    │
│                                                  │
│         (动态加载插件前端代码)                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**核心功能**：
- 加载和渲染插件前端
- 注入 `window.booltox` API
- 连接到插件后端
- 全屏显示插件 UI

---

## 🔄 用户旅程

### 新用户流程
```
1. 访问工具箱首页 (/tools)
   ↓
2. 点击"插件市场"
   ↓
3. 浏览插件，点击"安装"
   ↓
4. 安装完成，跳转到"我的插件"
   ↓
5. 点击"启动"，跳转到插件运行页面
   ↓
6. 使用插件功能
```

### 老用户流程
```
1. 访问工具箱首页 (/tools)
   ↓
2. 在"最近使用"中点击插件
   ↓
3. 直接跳转到插件运行页面
```

---

## 🛠️ 实施计划

### 阶段 1: 创建新页面结构 (0.5 天)
- [ ] 创建 `/tools/page.tsx` - 工具箱首页
- [ ] 创建 `/tools/installed/page.tsx` - 我的插件
- [ ] 重构 `/tools/market/page.tsx` - 插件市场

### 阶段 2: 实现远程插件数据源 (0.5 天)
- [ ] 创建 `useRemotePlugins` Hook
- [ ] 实现 `fetchPluginRegistry()` 函数
- [ ] 创建插件合并逻辑 `mergePlugins()`

### 阶段 3: 实现插件运行时 (2 天)
- [ ] 创建 `/tools/[pluginId]/page.tsx`
- [ ] 实现 `PluginLoader`
- [ ] 注入 `window.booltox` API
- [ ] Agent 静态文件服务

### 阶段 4: UI 优化和测试 (0.5 天)
- [ ] 统一组件样式
- [ ] 添加动画过渡
- [ ] 端到端测试

**总计**: 约 3.5 天

---

## 📁 文件清单

### 需要创建的文件
```
packages/web/
├── app/(tools)/tools/
│   ├── page.tsx                          # 🆕 工具箱首页
│   ├── installed/
│   │   └── page.tsx                      # 🆕 我的插件
│   ├── market/
│   │   └── page.tsx                      # ✏️ 重构 - 插件市场
│   └── [pluginId]/
│       └── page.tsx                      # 🆕 插件运行页面
│
├── components/tools/
│   ├── plugin-card.tsx                   # ✏️ 修改 - 支持两种模式
│   ├── running-plugin-card.tsx           # 🆕 运行中的插件卡片
│   └── remote-plugin-card.tsx            # 🆕 远程插件卡片
│
├── hooks/
│   ├── use-remote-plugins.ts             # 🆕 远程插件数据
│   └── use-running-plugins.ts            # 🆕 运行中的插件
│
└── lib/
    ├── plugin-loader.ts                  # 🆕 插件加载器
    ├── booltox-api.ts                    # 🆕 API 桥接
    └── plugin-registry.ts                # 🆕 插件注册表
```

### 需要修改的文件
```
packages/web/
├── components/tools/plugin-card.tsx      # 添加 mode 参数
└── hooks/use-plugins.ts                  # 优化 API 调用
```

---

## 🎨 组件设计

### PluginCard 组件重构

```typescript
interface PluginCardProps {
  plugin: PluginInfo | RemotePlugin;
  mode: 'installed' | 'market' | 'running';
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onInstall?: (plugin: RemotePlugin) => void;
  onUninstall?: (id: string) => void;
  isLoading?: boolean;
}

// 使用示例

// 已安装插件页面
<PluginCard
  plugin={plugin}
  mode="installed"
  onStart={handleStart}
  onStop={handleStop}
  onUninstall={handleUninstall}
/>

// 插件市场页面
<PluginCard
  plugin={remotePlugin}
  mode="market"
  onInstall={handleInstall}
/>

// 工具箱首页（运行中）
<PluginCard
  plugin={runningPlugin}
  mode="running"
  onStop={handleStop}
/>
```

---

## 🔍 数据流设计

### 插件状态管理

```typescript
// 1. 远程插件数据（从 GitHub）
interface RemotePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  downloadUrl: string;
  sha256: string;
  verified: boolean;
  stats: {
    downloads: number;
    rating: number;
    updatedAt: string;
  };
}

// 2. 本地插件数据（从 Agent）
interface PluginInfo {
  id: string;
  manifest: PluginManifest;
  status: 'stopped' | 'running';
  installed: true;
  version: string;
}

// 3. 合并后的插件数据（市场显示）
interface MergedPlugin extends RemotePlugin {
  installed: boolean;
  installedVersion?: string;
  needUpdate: boolean;
  status?: 'stopped' | 'running';
}
```

---

## 📝 实施优先级

### P0 - 立即完成（功能完整性）
1. ✅ 创建"我的插件"页面
2. ✅ 修改"插件市场"逻辑
3. ✅ 创建工具箱首页
4. ✅ 实现插件运行页面

### P1 - 短期完成（用户体验）
5. 远程插件数据源
6. 插件安装功能
7. 插件详情页

### P2 - 长期优化（增强功能）
8. 插件搜索
9. 插件收藏
10. 插件评分和评论

---

## ✅ 验收标准

### 功能验收
- [ ] 工具箱首页显示正在运行的插件
- [ ] "我的插件"页面可以管理已安装插件
- [ ] "插件市场"页面只显示远程插件
- [ ] 插件状态实时更新
- [ ] 启动/停止/安装/卸载功能正常

### 体验验收
- [ ] 页面导航逻辑清晰
- [ ] 用户旅程流畅
- [ ] 加载状态反馈及时
- [ ] 错误提示友好

---

**下一步**: 开始实施阶段 1 - 创建新的页面结构
