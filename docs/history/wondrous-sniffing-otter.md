# BoolTox Web + Agent 架构实施计划

## 一、项目概述

### 核心决策
✅ **采用 Web + Agent 架构**（放弃 Electron）
- Web 前端：Next.js 15（零安装门槛、SEO 友好、生态扩展）
- 本地 Agent：Node.js HTTP 服务（进程调度器）
- 插件系统：独立仓库维护（解耦设计）

### 战略价值
1. **生态扩展性**：一站式平台（导航页+工具箱+论坛+博客）
2. **获客优势**：分享链接即用、搜索引擎可索引
3. **性能合理**：工具箱是"调度器"，性能瓶颈在插件本身
4. **插件独立**：Agent 最小化，插件可选安装

### 关键决策（已确认）
- ✅ **插件市场**：GitOps（静态文件 + GitHub + jsDelivr CDN，零后端成本）
- ✅ **Agent 预装**：完全最小化（0 个预装插件，纯净核心服务）
- ✅ **插件迁移**：立即创建独立仓库（`booltox-plugins`，从一开始就解耦）
- ✅ **插件审核**：分级管理（官方严格审核，社区标记"未验证"）
- ✅ **UI 风格**：现代简约风 + Apple 元素（shadcn/ui + Tailwind + Framer Motion）

---

## 二、目录结构设计

### 2.1 主仓库（BoolTox）

```
BoolTox/
├── packages/
│   # ========== 保留现有代码 ==========
│   ├── client/           # Electron 版本（保留作为参考）
│   ├── shared/           # 类型定义（两边共用）
│   ├── cli/              # 插件开发 CLI
│   │
│   # ========== 全新 Web 平台 ==========
│   ├── web/              # 🆕 Next.js 前端（从零开始）
│   ├── agent/            # 🆕 Node.js HTTP 服务（完全最小化）
│   ├── core/             # 🆕 共享业务逻辑（从 client 抽离）
│   ├── sdk/              # 🆕 前端 SDK（Agent 连接）
│   └── plugin-sdk/       # 🆕 插件开发 SDK（轻量级）
│
├── docs/
│   └── agent-platform-spec.md
│
└── turbo.json
```

### 2.2 插件仓库（booltox-plugins，独立仓库）

```
booltox-plugins/          # 🆕 独立 Git 仓库
├── packages/
│   ├── official/         # 官方插件（严格审核）
│   │   ├── pomodoro/     # 番茄钟
│   │   ├── clipboard/    # 剪贴板管理
│   │   └── quick-note/   # 快速笔记
│   │
│   ├── community/        # 社区插件（标记"未验证"）
│   │   └── translator/   # 翻译工具
│   │
│   └── examples/         # 示例插件（教学）
│       ├── backend-demo/ # Python 后端示例
│       ├── frontend-only-demo/
│       └── standalone-demo/
│
├── plugins/              # GitOps 元数据目录
│   ├── index.json        # 插件索引（实时拉取）
│   └── official/
│       └── pomodoro/
│           ├── metadata.json    # 插件元数据
│           ├── icon.png
│           ├── screenshots/
│           └── releases/
│               └── pomodoro-1.0.0.zip
│
├── scripts/              # 自动化脚本
│   ├── update-registry.js
│   └── validate-plugin.js
│
├── .github/workflows/    # CI/CD
│   ├── publish-plugin.yml
│   └── validate-pr.yml
│
└── turbo.json
```

**关键设计**：
- ✅ **完全独立**：插件仓库与主仓库完全分离
- ✅ **分级管理**：官方/社区/示例三级目录结构
- ✅ **GitOps**：`plugins/` 目录作为静态元数据，通过 jsDelivr CDN 分发

### 2.3 Web 前端结构（packages/web）

```
web/
├── app/
│   ├── (marketing)/          # 营销页面
│   │   ├── page.tsx          # 首页/导航页
│   │   ├── about/
│   │   └── pricing/
│   │
│   ├── (tools)/              # 工具箱
│   │   ├── tools/
│   │   │   ├── page.tsx      # 工具列表
│   │   │   ├── market/       # 插件市场
│   │   │   └── [toolId]/     # 动态工具页面
│   │   └── settings/
│   │
│   ├── (community)/          # 社区
│   │   ├── forum/
│   │   └── blog/
│   │
│   ├── (account)/            # 用户中心
│   │   ├── profile/
│   │   └── plugins/
│   │
│   └── docs/                 # 文档中心
│
├── components/
│   ├── ui/                   # shadcn/ui 基础组件
│   ├── layout/               # 导航栏、页脚
│   ├── tools/                # 工具箱专用组件
│   │   ├── agent-status.tsx  # Agent 状态指示器
│   │   └── agent-installer.tsx # 安装引导
│   └── community/
│
├── lib/
│   ├── agent-sdk.ts          # Agent 连接 SDK
│   └── api-client.ts
│
├── hooks/
│   ├── use-agent.ts          # Agent 状态管理
│   └── use-plugins.ts
│
└── package.json
```

### 2.4 Agent 结构（packages/agent）

```
agent/
├── src/
│   ├── server.ts             # Fastify HTTP 服务
│   ├── routes/               # API 路由
│   │   ├── plugins.ts        # 插件管理 API
│   │   ├── system.ts
│   │   └── processes.ts
│   │
│   ├── services/             # 🔗 调用 @booltox/core
│   │   ├── plugin-service.ts
│   │   ├── process-service.ts
│   │   └── storage-service.ts
│   │
│   ├── websocket/            # WebSocket 服务
│   │   ├── plugin-logs.ts    # 日志流
│   │   └── system-events.ts
│   │
│   └── config/
│
├── bin/
│   └── booltox-agent.js      # CLI 入口
│
├── install/
│   ├── macos.sh
│   ├── windows.ps1
│   └── linux.sh
│
└── package.json
```

### 2.5 共享逻辑（packages/core）

```
core/
├── src/
│   ├── plugin/               # 🔗 从 client 迁移
│   │   ├── plugin-manager.ts # 去除 Electron API
│   │   ├── plugin-installer.ts
│   │   └── plugin-lifecycle.ts
│   │
│   ├── runtime/
│   │   ├── python-manager.ts # 🔗 100% 复用
│   │   ├── node-runner.ts
│   │   └── process-pool.ts
│   │
│   ├── storage/
│   │   ├── plugin-store.ts
│   │   └── config-store.ts
│   │
│   └── protocol/
│       ├── json-rpc.ts
│       └── event-emitter.ts
│
└── package.json
```

### 2.6 插件开发工作流（跨仓库）

**开发模式配置**：

```bash
# 1. Clone 两个仓库
git clone https://github.com/ByteTrue/BoolTox.git
git clone https://github.com/ByteTrue/booltox-plugins.git

# 2. 配置环境变量（指向本地插件目录）
export BOOLTOX_DEV_PLUGINS_DIR="$HOME/projects/booltox-plugins/packages"

# 3. 同时启动开发服务
cd BoolTox
pnpm dev:agent    # Agent 自动扫描 DEV_PLUGINS_DIR

cd booltox-plugins/packages/official/pomodoro
pnpm dev          # 插件热重载
```

**Agent 插件扫描逻辑**：

```typescript
// packages/agent/src/services/plugin-service.ts
export class PluginService {
  async loadPlugins() {
    // 1. 扫描用户安装目录
    await this.scanDir(userPluginsDir, false);

    // 2. 扫描开发插件目录（环境变量）
    const devPluginsDir = process.env.BOOLTOX_DEV_PLUGINS_DIR;
    if (devPluginsDir) {
      await this.scanDir(devPluginsDir, true);
    }

    // 3. 从 GitOps 拉取插件列表
    const registry = await gitOpsService.getPluginRegistry(
      'https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/index.json'
    );
  }
}
```

---

## 三、技术栈选型

### 3.1 Web 前端（packages/web）
```typescript
{
  "framework": "Next.js 15",           // App Router
  "ui": "shadcn/ui + Tailwind CSS",   // 现代简约风
  "state": "Zustand",                 // 轻量状态管理
  "forms": "React Hook Form + Zod",   // 表单验证
  "animation": "Framer Motion",       // 流畅动画（Apple 风格）
  "http": "ky",                       // 现代 HTTP 客户端
  "icons": "lucide-react",            // 图标库
  "pwa": "@ducanh2912/next-pwa"       // PWA 支持
}
```

**设计参考**：
- Linear（现代简约）
- Vercel（清晰层次）
- Raycast（高效交互）
- macOS（动画曲线）

### 3.2 Agent 后端（packages/agent）
```typescript
{
  "runtime": "Node.js 20+",
  "framework": "Fastify",             // 高性能（比 Express 快 2-3 倍）
  "websocket": "@fastify/websocket",
  "database": "better-sqlite3",       // SQLite
  "logger": "pino",                   // 高性能日志
  "process": "execa",                 // 进程管理
  "validation": "zod"                 // 请求验证
}
```

### 3.3 Core 库（packages/core）
```typescript
{
  "runtime": "纯 TypeScript",
  "validation": "zod",
  "events": "eventemitter3",
  "utils": "lodash-es",
  "json-rpc": "jsonrpc-lite"
}
```

### 3.4 插件 SDK（packages/plugin-sdk）
```typescript
{
  "runtime": "纯 TypeScript",
  "dependencies": ["@booltox/shared"], // 仅类型定义
  "peerDependencies": ["react"]        // 可选（Hooks）
}
```

---

## 四、UI 设计系统（现代简约风 + Apple 元素）

### 4.1 设计 Token

**颜色系统**：

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // 品牌色（保留现有系统蓝，致敬 Apple）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',  // 主品牌色
          600: '#2563eb',
          900: '#1e3a8a',
        },

        // 中性色（现代简约风格）
        neutral: {
          50: '#fafafa',   // 背景色
          100: '#f5f5f5',  // 卡片背景
          200: '#e5e5e5',  // 边框
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',  // 辅助文字
          600: '#525252',
          700: '#404040',
          800: '#262626',  // 主文字
          900: '#171717',  // 深色背景
        },

        // 语义色
        success: {
          500: '#22c55e',  // 官方插件标记
          100: '#dcfce7',  // 背景
        },
        warning: {
          500: '#f59e0b',  // 社区插件警告
          100: '#fef3c7',  // 背景
        },
        error: {
          500: '#ef4444',
          100: '#fee2e2',
        },
      },

      // 圆角（Apple 风格）
      borderRadius: {
        'xl': '16px',   // 卡片
        '2xl': '24px',  // 大型容器
        '3xl': '32px',  // Hero 区域
      },

      // 间距系统（8px 栅格）
      spacing: {
        '18': '4.5rem',  // 72px
        '112': '28rem',  // 448px
      },

      // 阴影（柔和）
      boxShadow: {
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.05), 0 6px 20px -3px rgb(0 0 0 / 0.1)',
        'soft-lg': '0 4px 16px -4px rgb(0 0 0 / 0.05), 0 12px 32px -6px rgb(0 0 0 / 0.1)',
      },

      // 动画曲线（Apple 标准）
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'apple-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'apple-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
    },
  },
};
```

**字体系统**：

```typescript
{
  fontFamily: {
    sans: [
      'Inter',                  // 英文主字体（现代简约）
      'SF Pro Display',         // Apple 备用
      'PingFang SC',            // 中文（苹方）
      'Microsoft YaHei',        // Windows 中文
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',         // 代码字体
      'SF Mono',
      'Menlo',
      'monospace',
    ],
  },

  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
    'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
    'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
}
```

### 4.2 核心组件设计

**按钮组件**（基于 shadcn/ui Button）：

```tsx
// components/ui/button.tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        ghost: 'hover:bg-neutral-100 active:bg-neutral-200',
        outline: 'border border-neutral-200 hover:bg-neutral-50',
      },
      size: {
        sm: 'h-9 px-3',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

**卡片组件**：

```tsx
// components/ui/card.tsx
export function Card({ className, children, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white p-6',
        'shadow-soft hover:shadow-soft-lg',
        'transition-all duration-200 ease-apple',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

**导航栏**：

```tsx
// components/layout/navbar.tsx
export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-semibold">BoolTox</span>
        </Link>

        {/* 主导航 */}
        <div className="flex items-center gap-1">
          {['工具箱', '插件市场', '社区', '文档'].map(item => (
            <Button key={item} variant="ghost" className="rounded-lg">
              {item}
            </Button>
          ))}
        </div>

        {/* Agent 状态 + 用户菜单 */}
        <div className="flex items-center gap-3">
          <AgentStatus />
          <Button variant="default" size="sm">
            登录
          </Button>
        </div>
      </div>
    </nav>
  );
}
```

### 4.3 布局系统

**主布局**（工具箱页面）：

```tsx
// app/(tools)/layout.tsx
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 侧边栏 */}
          <aside className="w-64 shrink-0">
            <Card className="sticky top-24">
              <nav className="space-y-1">
                <SidebarItem icon={Home} href="/tools">
                  概览
                </SidebarItem>
                <SidebarItem icon={Grid} href="/tools/market">
                  插件市场
                </SidebarItem>
                <SidebarItem icon={Settings} href="/tools/settings">
                  设置
                </SidebarItem>
              </nav>
            </Card>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
```

### 4.4 动画规范（Apple 风格）

**页面过渡**：

```tsx
// components/page-transition.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1], // Apple 标准曲线
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**列表项动画**：

```tsx
// 插件列表
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 错开 100ms
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

<motion.div variants={containerVariants} initial="hidden" animate="show">
  {plugins.map(plugin => (
    <motion.div key={plugin.id} variants={itemVariants}>
      <PluginCard plugin={plugin} />
    </motion.div>
  ))}
</motion.div>
```

**微交互**：

```tsx
// 按钮点击反馈
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  点击我
</motion.button>

// 卡片悬停效果
<motion.div
  whileHover={{
    scale: 1.02,
    boxShadow: '0 12px 32px -6px rgb(0 0 0 / 0.1)',
  }}
  transition={{ duration: 0.2 }}
>
  <Card />
</motion.div>
```

### 4.5 响应式设计

**断点系统**：

```typescript
{
  screens: {
    'sm': '640px',   // 手机横屏
    'md': '768px',   // 平板
    'lg': '1024px',  // 笔记本
    'xl': '1280px',  // 桌面
    '2xl': '1536px', // 大屏
  }
}
```

**移动端适配**：

```tsx
// 响应式导航栏
<nav className="px-4 md:px-6">
  <div className="h-14 md:h-16 flex items-center justify-between">
    {/* 移动端：汉堡菜单 */}
    <Sheet>
      <SheetTrigger className="md:hidden">
        <Menu />
      </SheetTrigger>
      <SheetContent>
        <MobileMenu />
      </SheetContent>
    </Sheet>

    {/* 桌面端：水平菜单 */}
    <div className="hidden md:flex items-center gap-1">
      <NavItems />
    </div>
  </div>
</nav>

// 响应式网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {plugins.map(plugin => <PluginCard key={plugin.id} plugin={plugin} />)}
</div>
```

### 4.6 暗色模式（可选）

```tsx
// next-themes 集成
import { ThemeProvider } from 'next-themes';

// 暗色 token
{
  colors: {
    background: {
      light: '#fafafa',
      dark: '#0a0a0a',
    },
    foreground: {
      light: '#171717',
      dark: '#fafafa',
    },
  }
}

// 组件使用
<Card className="bg-background border-border">
  <h2 className="text-foreground">标题</h2>
</Card>
```

### 4.7 设计检查清单

**视觉一致性**：
- [ ] 所有圆角统一使用 `rounded-xl` (16px)
- [ ] 间距使用 8px 栅格（4, 8, 12, 16, 24, 32...）
- [ ] 颜色仅使用设计 token（不手写 hex）
- [ ] 阴影仅使用 `shadow-soft` 和 `shadow-soft-lg`

**动画流畅性**：
- [ ] 所有过渡使用 Apple 曲线 `ease-apple`
- [ ] 动画时长 200-300ms（快速响应）
- [ ] 避免过度动画（性能优先）
- [ ] 使用 `will-change` 优化关键动画

**可访问性**：
- [ ] 所有交互元素支持键盘导航
- [ ] 焦点可见（`focus-visible:ring-2`）
- [ ] 色彩对比度 ≥ 4.5:1（WCAG AA）
- [ ] 支持屏幕阅读器（`aria-label`）

**性能优化**：
- [ ] 图片使用 Next.js Image 组件
- [ ] 懒加载非首屏内容
- [ ] 列表虚拟化（react-window）
- [ ] 动画使用 CSS transform（GPU 加速）

---

## 五、插件系统设计

### 5.1 核心原则

1. **插件可选安装** - Agent 只是最小运行壳
2. **完全解耦** - 插件只依赖 `@booltox/plugin-sdk`
3. **独立构建** - 每个插件可单独构建和发布
4. **独立仓库** - 未来迁移到 `booltox-plugins` 仓库

### 5.2 插件独立性检查清单

**构建独立性**：
- [ ] 独立的 `package.json`
- [ ] 独立的 `vite.config.ts`
- [ ] 可单独运行 `pnpm build`
- [ ] 可单独运行 `pnpm dev`

**依赖独立性**：
- [ ] 不 import `@booltox/client`
- [ ] 不 import `@booltox/core`
- [ ] 不 import 其他插件
- [ ] 只依赖 `@booltox/plugin-sdk`

**运行时独立性**：
- [ ] 独立的 manifest.json
- [ ] 独立的权限声明
- [ ] 独立的数据目录
- [ ] 进程隔离（Python 虚拟环境）

**发布独立性**：
- [ ] 可单独打包为 ZIP
- [ ] 包含所有必需文件
- [ ] 可通过 URL 安装
- [ ] 版本独立管理

### 5.3 插件 SDK 设计（@booltox/plugin-sdk）

```typescript
// packages/plugin-sdk/src/index.ts
export * from './types.js';          // 类型定义
export * from './api.js';            // 运行时 API
export * from './backend.js';        // 后端通信
export * from './hooks.js';          // React Hooks

// API 封装
export class BooltoxClient {
  async setTitle(title: string): Promise<void>
  async readFile(path: string): Promise<string>
  async getStorage<T>(key: string): Promise<T | undefined>
  async setStorage<T>(key: string, value: T): Promise<void>
}

// 后端通信
export class BackendClient {
  async connect(): Promise<void>
  async call<TResult>(method: string, params?: unknown): Promise<TResult>
  on(event: string, listener: (data: unknown) => void): () => void
}

// React Hooks
export function useStorage<T>(key: string, defaultValue: T)
export function useBackend()
```

### 5.4 插件市场架构

**GitOps 实现**（零后端成本）：
```
Agent 客户端
    ↓
[索引] GitHub Raw URL (实时) ←─ plugins/index.json
    ↓
[元数据] jsDelivr CDN (加速) ←─ plugins/*/metadata.json
    ↓
[ZIP包] jsDelivr CDN (加速) ←─ plugins/*/releases/*.zip
```

**API 规范**：
```typescript
// 获取插件列表
GET /api/plugins?category=official&search=timer&page=1

// 获取插件详情
GET /api/plugins/:id

// 检查更新
POST /api/plugins/check-updates
Body: { installed: [{ id, version }] }
```

**CI/CD 自动化**：
```yaml
# GitHub Actions
on:
  push:
    tags: ['pomodoro-v*']
steps:
  - build plugin
  - calculate SHA-256
  - create GitHub Release
  - update registry metadata
```

---

## 五、代码复用策略

### 5.1 复用矩阵

| 现有代码 | 复用价值 | 目标位置 | 改造难度 |
|---------|---------|----------|----------|
| **UI 层** | ❌ 几乎无价值 | - | - |
| `app-shell.tsx` | ❌ | 重写 | - |
| `module-center/` | ❌ | 重写 | - |
| **业务逻辑层** | ✅ 高价值 | packages/core | 低-中 |
| `plugin-manager.ts` | ✅ 80% | core/plugin/ | 低 |
| `plugin-installer.ts` | ✅ 90% | core/plugin/ | 低 |
| `plugin-runner.ts` | ✅ 70% | core/runtime/ | 中 |
| `python-manager.service.ts` | ✅ 100% | core/runtime/ | 低 |
| `extension-host.ts` | ⚠️ 60% | core/protocol/ | 中 |
| **类型定义** | ✅ 完全复用 | 直接使用 | 无 |
| `@booltox/shared/types/*` | ✅ 100% | 直接使用 | 无 |
| **工具函数** | ⚠️ 选择性 | core/utils/ | 低 |
| `logger.ts` | ✅ | core/utils/ | 无 |
| `system-info.ts` | ✅ | core/utils/ | 无 |

### 5.2 复用原则

```typescript
// 三步走策略
1. 先建立新项目骨架（不依赖旧代码）
2. 遇到需要的功能时，检查旧代码
3. 如果可复用，则抽离到 @booltox/core

// ❌ 不要一开始就"迁移"旧代码
// ✅ 按需复用，保持新项目的清洁
```

### 5.3 改造示例

```typescript
// ❌ 旧代码（client/electron/services/plugin/plugin-manager.ts）
class PluginManager {
  async installPlugin(pluginPath: string) {
    const result = await this.installer.install(pluginPath)
    mainWindow.webContents.send('plugin:installed', result) // Electron IPC
    return result
  }
}

// ✅ 新代码（core/src/plugin/plugin-manager.ts）
import { EventEmitter } from 'eventemitter3'

export class PluginManager extends EventEmitter {
  async installPlugin(pluginPath: string) {
    const result = await this.installer.install(pluginPath)
    this.emit('plugin:installed', result) // 通用事件
    return result
  }
}

// Agent 中使用
pluginManager.on('plugin:installed', (result) => {
  wss.broadcast({ type: 'plugin:installed', data: result })
})
```

---

## 六、实施计划

### 6.1 第一周：项目初始化（0 → 1）✨

**Day 1：创建独立插件仓库**
```bash
# 1. 创建 booltox-plugins 仓库
cd ~/projects
mkdir booltox-plugins
cd booltox-plugins
git init
pnpm init

# 2. 创建目录结构
mkdir -p packages/{official,community,examples}
mkdir -p plugins
mkdir -p scripts .github/workflows

# 3. 创建初始文件
echo '{"plugins":[]}' > plugins/index.json
touch scripts/update-registry.js
touch .github/workflows/publish-plugin.yml

# 4. 提交并推送到 GitHub
git add .
git commit -m "chore: 初始化插件仓库"
git remote add origin https://github.com/ByteTrue/booltox-plugins.git
git push -u origin main
```

**Day 2：主仓库基础架构**
```bash
cd ~/projects/BoolTox

# 创建新包
pnpm create next-app@latest packages/web
mkdir -p packages/{agent,core,sdk,plugin-sdk}

# 配置 Turbo
# 配置 TypeScript 路径别名
# 配置环境变量 BOOLTOX_DEV_PLUGINS_DIR
```

**Day 3-4：Web 平台骨架**
```bash
cd packages/web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog

# 创建基础路由
app/(marketing)/page.tsx      # 首页
app/(tools)/tools/page.tsx    # 工具列表
```

**Day 5-7：Agent HTTP 服务**
```bash
cd packages/agent
pnpm add fastify @fastify/cors @fastify/websocket

# 创建基础服务
src/server.ts
src/routes/health.ts
```

**目标**：
- ✅ Web 平台可访问（localhost:3000）
- ✅ Agent 服务可启动（localhost:9527）
- ✅ 基础路由和布局完成

### 6.2 第二周：Agent 连接 + 工具箱首页

**Day 8-10：Agent SDK**
```bash
cd packages/sdk
# 实现 Agent 自动探测和连接
```

**Day 11-12：前端集成**
```bash
# Agent 状态指示器
components/tools/agent-status.tsx
hooks/use-agent.ts
```

**Day 13-14：工具箱首页**
```bash
app/(tools)/tools/page.tsx
# 工具列表、Agent 状态、安装引导
```

**目标**：
- ✅ 前端可检测 Agent 状态
- ✅ 工具箱首页完成
- ✅ Agent 安装引导完成

### 6.3 第三周：插件 SDK + 第一个工具

**Day 15-17：创建插件 SDK**
```bash
cd packages/plugin-sdk
# 实现核心 API 封装
src/api.ts
src/backend.ts
src/hooks.ts
```

**Day 18-19：复用核心代码**
```bash
cd packages/core
# 从 client 迁移核心逻辑
src/runtime/python-manager.ts
src/runtime/process-pool.ts
```

**Day 20-21：第一个插件（番茄钟）**
```bash
cd packages/plugins/official/pomodoro
# 使用新的 @booltox/plugin-sdk
# 实现番茄钟 UI 和后端
```

**目标**：
- ✅ 插件 SDK 可用
- ✅ 核心逻辑抽离到 @booltox/core
- ✅ 番茄钟工具可用

### 6.4 第四周：插件市场

**Day 22-24：插件管理 API**
```bash
cd packages/agent
# 实现插件 CRUD API
GET  /api/plugins
POST /api/plugins/install
DELETE /api/plugins/:id
```

**Day 25-27：插件市场 UI**
```bash
cd packages/web
app/(tools)/tools/market/page.tsx
components/tools/plugin-card.tsx
```

**Day 28：测试和优化**

**目标**：
- ✅ 插件市场完成
- ✅ 插件安装流程跑通
- ✅ 至少 3 个插件可用

### 6.5 第五-六周：社区功能（可选）

**Week 5：博客**
- Markdown 文章系统
- 文章列表、详情、搜索

**Week 6：论坛**
- 选项 1：集成 Discourse
- 选项 2：集成 Flarum
- 选项 3：自建（Next.js + Prisma）

### 6.6 第七-八周：完善和优化

**Week 7：用户系统**
- 账号注册/登录
- 配置同步
- 插件收藏

**Week 8：优化和测试**
- 性能优化（Lighthouse）
- SEO 优化（meta、sitemap）
- PWA 配置
- E2E 测试

---

## 七、插件迁移策略

### 7.1 迁移路径

**阶段 0：当前状态**
```
packages/client/plugins/
├── com.booltox.backend-demo/
└── com.booltox.frontend-only-demo/
```

**阶段 1：Monorepo 内解耦（🎯 当前目标）**
```
packages/
├── plugin-sdk/                    # 🆕 创建 SDK
├── plugins/                       # 🆕 插件集合
│   ├── official/
│   │   └── pomodoro/              # 迁移示例插件
│   └── examples/
│       └── backend-demo/          # 移动原有插件
```

**阶段 2：独立 Monorepo（📅 3-6 个月后）**
```
booltox-plugins/  (新仓库)
├── packages/
│   ├── pomodoro/
│   └── clipboard/
└── .github/workflows/
```

**阶段 3：社区开放（📅 6-12 个月后）**
```
github.com/user1/booltox-plugin-translator
github.com/user2/booltox-plugin-screenshot
```

### 7.2 迁移优先级

**P0（立即执行）**：
1. 创建 `@booltox/plugin-sdk` 包
2. 创建 `packages/plugins/` 目录
3. 迁移 1 个示例插件（验证 POC）

**P1（1-2 周）**：
4. 迁移所有示例插件
5. 更新 CLI 模板
6. 编写插件开发文档

**P2（1-2 个月）**：
7. 创建 2-3 个官方插件
8. 完善插件市场
9. CI/CD 自动发布

**P3（3-6 个月）**：
10. 创建独立 `booltox-plugins` 仓库
11. 批量迁移插件
12. 开放社区贡献

---

## 八、关键文件清单

### 8.1 需要创建的文件

**Web 前端**：
- `packages/web/app/page.tsx` - 首页
- `packages/web/app/(tools)/tools/page.tsx` - 工具列表
- `packages/web/components/layout/navbar.tsx` - 导航栏
- `packages/web/components/tools/agent-status.tsx` - Agent 状态
- `packages/web/hooks/use-agent.ts` - Agent 连接 Hook

**Agent 服务**：
- `packages/agent/src/server.ts` - HTTP 服务器
- `packages/agent/src/routes/plugins.ts` - 插件 API
- `packages/agent/src/routes/health.ts` - 健康检查
- `packages/agent/bin/booltox-agent.js` - CLI 入口

**Core 库**：
- `packages/core/src/plugin/plugin-manager.ts` - 插件管理器
- `packages/core/src/runtime/python-manager.ts` - Python 环境
- `packages/core/src/protocol/json-rpc.ts` - JSON-RPC

**插件 SDK**：
- `packages/plugin-sdk/src/api.ts` - API 封装
- `packages/plugin-sdk/src/backend.ts` - 后端通信
- `packages/plugin-sdk/src/hooks.ts` - React Hooks

**插件示例**：
- `packages/plugins/official/pomodoro/manifest.json`
- `packages/plugins/official/pomodoro/src/index.tsx`
- `packages/plugins/official/pomodoro/backend/server.py`

### 8.2 需要迁移的文件（从 client）

**优先级 P0**：
- `packages/client/electron/services/plugin/plugin-manager.ts` → `core/plugin/`
- `packages/client/electron/services/plugin/plugin-installer.ts` → `core/plugin/`
- `packages/client/electron/services/python-manager.service.ts` → `core/runtime/`

**优先级 P1**：
- `packages/client/electron/services/plugin/plugin-runner.ts` → `core/runtime/`
- `packages/client/electron/services/plugin/plugin-backend-runner.ts` → `core/runtime/`

**优先级 P2**：
- `packages/client/electron/services/extension-host/` → `core/protocol/`

---

## 九、成功标准

### 9.1 第一周目标
- [ ] 项目结构搭建完成
- [ ] Web 平台可访问（localhost:3000）
- [ ] Agent 服务可启动（localhost:9527）
- [ ] 基础路由和布局完成

### 9.2 第二周目标
- [ ] 前端可检测 Agent 状态
- [ ] 工具箱首页完成
- [ ] Agent 安装引导完成

### 9.3 第三周目标
- [ ] 插件 SDK 可用
- [ ] 核心逻辑抽离到 @booltox/core
- [ ] 番茄钟工具可用

### 9.4 第四周目标
- [ ] 插件市场完成
- [ ] 插件安装流程跑通
- [ ] 至少 3 个插件可用

### 9.5 第八周目标（MVP）
- [ ] 完整的用户旅程跑通（访问→试用→安装 Agent→使用插件）
- [ ] 插件市场可用（浏览、搜索、安装）
- [ ] 至少 5 个官方插件
- [ ] 基础社区功能（博客或论坛）
- [ ] 通过 Lighthouse 性能测试（>90 分）

---

## 十、风险与缓解

### 10.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Agent 安装率过低 | 高 | 提供云端 Agent（付费）、WebAssembly 降级 |
| 浏览器兼容性 | 中 | 渐进式增强、Polyfill、明确支持范围 |
| 性能不及预期 | 中 | gRPC-Web、本地缓存、WebAssembly 加速 |
| 插件生态冷启动 | 高 | 先做 5-10 个官方插件、激励社区贡献 |

### 10.2 产品风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 用户不愿安装 Agent | 高 | 提供纯 Web 工具、渐进式引导 |
| 迁移现有用户失败 | 中 | 保留 Electron 版本 6 个月 |
| SEO 效果不明显 | 低 | 内容营销、长尾关键词 |

---

## 十一、下一步行动

### 立即可以开始（本周）

**1. 创建项目骨架**
```bash
cd packages
pnpm create next-app@latest web
mkdir -p agent/src core/src sdk/src plugin-sdk/src plugins/{official,community,examples}
```

**2. 初始化 shadcn/ui**
```bash
cd web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input badge toast
```

**3. 创建 Agent HTTP 服务**
```bash
cd ../agent
pnpm init
pnpm add fastify @fastify/cors @fastify/websocket pino
```

**4. 创建 Core 包**
```bash
cd ../core
pnpm init
pnpm add eventemitter3 zod
```

**5. 创建插件 SDK**
```bash
cd ../plugin-sdk
pnpm init
pnpm add -D @types/node
```

**6. 更新 Turbo 配置**
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**"],
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 十二、附录

### 12.1 依赖关系图

```
@booltox/shared (类型定义)
    ↑
    ├─ @booltox/plugin-sdk ←─ 插件开发依赖
    ├─ @booltox/core       ←─ Agent 核心依赖
    ├─ @booltox/agent      ←─ HTTP 服务
    ├─ @booltox/web        ←─ Web 前端
    └─ @booltox/sdk        ←─ Agent 连接 SDK
```

### 12.2 关键技术决策

1. **放弃 Electron** - 生态扩展性是战略级优势
2. **从零开始 UI** - 比改造旧代码快 3-5 倍
3. **插件独立仓库** - 解耦设计，便于社区贡献
4. **GitOps 市场** - 零后端成本，自动化发布
5. **渐进式迁移** - 降低风险，保留灵活性

---

**计划版本**: 1.0.0
**创建日期**: 2025-12-05
**预计完成**: 2 个月（MVP）
