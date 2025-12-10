# @booltox/web - Next.js 前端

> [根目录](../../CLAUDE.md) > [packages](./) > **web**

---

## 变更记录（Changelog）

| 时间             | 操作     | 说明                       |
| ---------------- | -------- | -------------------------- |
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

BoolTox 的 **Web 前端主站**，基于 Next.js 15 + React 19，提供：

- **落地页（Landing）**：产品介绍、功能展示、资源导航
- **仪表盘（Dashboard）**：工具管理、资源浏览、数据可视化
- **错误页面**：Forbidden/404/500/Maintenance
- **主题系统**：支持自定义主题（Tailwind CSS + shadcn/ui）

**核心特性**：

- App Router（Next.js 15）
- React 19 Server Components
- Sentry 错误监控
- Tailwind CSS v4 + shadcn/ui
- 响应式设计 + 暗色模式

---

## 入口与启动

### 开发模式

```bash
pnpm dev
# 或从根目录
pnpm dev:web
```

访问：http://localhost:3000

### 生产构建

```bash
pnpm build
pnpm start
```

### 关键入口文件

- **根布局**：`src/app/layout.tsx`（全局 ThemeProvider、Toaster、字体）
- **首页重定向**：`src/app/page.tsx`（自动跳转到 `/landing`）
- **落地页**：`src/app/landing/page.tsx`
- **仪表盘**：`src/app/(dashboard)/dashboard/page.tsx`

---

## 对外接口

### 路由结构

```
/                           → 重定向到 /landing
/landing                    → 落地页（营销）
  /landing/resources        → 资源导航
/dashboard                  → 仪表盘（登录后）
  /dashboard/resources      → 资源管理
  /dashboard/tools          → 工具中心
/errors/*                   → 错误页面
```

### API 端点

- **无后端 API**：纯前端渲染（RSC），数据来自静态 JSON 或客户端状态
- **未来扩展**：可通过 API Routes（`app/api/`）对接外部服务

---

## 关键依赖与配置

### 核心依赖

- **Next.js 15.4.7**：App Router + React 19
- **Tailwind CSS v4**：样式引擎
- **shadcn/ui**：组件库（`components/ui/`）
- **Radix UI**：底层无障碍组件
- **Sentry**：错误监控（`@sentry/nextjs`）
- **Framer Motion**：动画（通过 shadcn）
- **Zustand**：客户端状态管理

### 配置文件

- `next.config.ts`：Next.js 配置（Sentry + 图片优化 + 重定向）
- `tailwind.config.ts`：Tailwind 主题配置
- `.env.example`：环境变量模板（Sentry DSN 等）

### 环境变量（必需）

```bash
# Sentry（可选）
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

---

## 数据模型

### 主题系统

- **配置**：`src/config/theme-data.ts`、`src/config/theme-customizer-constants.ts`
- **上下文**：`src/contexts/theme-context.ts`
- **Hooks**：`src/hooks/use-theme-manager.ts`
- **类型**：`src/types/theme.ts`、`src/types/theme-customizer.ts`

### 侧边栏配置

- **上下文**：`src/contexts/sidebar-context.tsx`
- **Hooks**：`src/hooks/use-sidebar-config.ts`

### 资源数据

- **静态数据**：`src/lib/resources-data.ts`
- **展示组件**：`src/app/landing/resources/page.tsx`

---

## 测试与质量

### 当前状态

- ❌ 无单元测试（依赖 TypeScript 类型检查 + ESLint）
- ✅ ESLint：`pnpm lint`（Next.js 默认规则）
- ✅ Prettier：`pnpm format:check`
- ✅ 类型检查：`next build` 时自动运行

### 建议改进

1. 添加 Vitest + React Testing Library
2. 对关键组件（如 `ThemeCustomizer`）编写单元测试
3. E2E 测试（Playwright）覆盖核心流程

---

## 常见问题（FAQ）

### Q1：如何添加新页面？

**A**：在 `src/app/` 下创建目录，添加 `page.tsx`：

```tsx
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>新页面</div>;
}
```

### Q2：如何修改主题颜色？

**A**：编辑 `tailwind.config.ts` 和 `src/config/theme-data.ts`。

### Q3：Sentry 报错如何处理？

**A**：检查 `.env` 中的 Sentry 配置，或在 `next.config.ts` 中禁用 Sentry。

### Q4：如何集成后端 API？

**A**：在 `src/app/api/` 下创建 API Route，或直接调用外部 API（如 `fetch`）。

---

## 相关文件清单

### 核心目录

- `src/app/`：页面路由（Next.js App Router）
- `src/components/`：公共组件（shadcn/ui + 自定义）
- `src/hooks/`：自定义 React Hooks
- `src/lib/`：工具函数、字体加载
- `src/contexts/`：React Context（主题、侧边栏）
- `src/types/`：TypeScript 类型定义

### 关键文件

- `src/app/layout.tsx`：全局布局
- `src/app/page.tsx`：首页（重定向）
- `src/app/landing/page.tsx`：落地页
- `src/app/(dashboard)/dashboard/page.tsx`：仪表盘
- `src/components/theme-customizer/index.tsx`：主题定制器
- `src/lib/utils.ts`：工具函数（`cn` 等）

---

## 下一步建议

- ✅ 已覆盖：路由结构、主题系统、关键组件
- ⚠️ 待补充：如需深入某功能（如 ThemeCustomizer），可读取具体组件源码
- 🔍 推荐操作：运行 `pnpm dev` 后访问 http://localhost:3000，体验完整流程
