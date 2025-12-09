# 技术栈集成指南

本文档记录了从 shadcn-dashboard-landing-template 到完整的 next-shadcn-dashboard-starter 技术栈的集成过程。

## 已集成的功能

### ✅ 1. Prettier（代码格式化）

**安装的包：**
- `prettier@^3.7.4`
- `prettier-plugin-tailwindcss@^0.7.2`

**配置文件：**
- [.prettierrc](.prettierrc) - Prettier 配置
- [.prettierignore](.prettierignore) - 忽略文件配置

**可用命令：**
```bash
pnpm format        # 格式化所有文件
pnpm format:check  # 检查格式是否正确
```

---

### ✅ 2. Husky（Git Hooks）

**安装的包：**
- `husky@^9.1.7`
- `lint-staged@^16.2.7`

**配置位置：**
- 根目录：`../../.husky/pre-commit` - Git pre-commit hook
- package.json：`lint-staged` 配置

**功能：**
- 在 Git 提交前自动运行 Prettier 和 ESLint
- 确保提交的代码符合格式规范

---

### ✅ 3. Nuqs（URL 状态管理）

**安装的包：**
- `nuqs@^2.8.3`

**配置位置：**
- [src/app/layout.tsx](src/app/layout.tsx) - 已添加 `NuqsAdapter`

**使用示例：**
```typescript
import { useQueryState } from "nuqs";

function MyComponent() {
  const [search, setSearch] = useQueryState("q");
  // search 会自动同步到 URL ?q=...
}
```

---

### ✅ 4. Clerk（认证系统）⭐

**安装的包：**
- `@clerk/nextjs@^6.36.0`

**配置文件：**
- [src/middleware.ts](src/middleware.ts) - Clerk middleware（路由保护）
- [src/app/layout.tsx](src/app/layout.tsx) - ClerkProvider
- [src/app/(auth)/sign-in/page.tsx](src/app/(auth)/sign-in/page.tsx) - 登录页面
- [src/app/(auth)/sign-up/page.tsx](src/app/(auth)/sign-up/page.tsx) - 注册页面

**环境变量配置：**
需要在 [.env.local](.env.local) 中配置以下变量：

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

**获取密钥：**
1. 访问 [Clerk Dashboard](https://dashboard.clerk.com/)
2. 创建新应用或选择现有应用
3. 在 API Keys 页面复制密钥
4. 粘贴到 `.env.local` 文件中

**路由配置：**
- 公开路由（无需登录）：`/`, `/sign-in`, `/sign-up`
- 受保护路由（需要登录）：所有其他路由

---

### ✅ 5. Sentry（错误追踪）

**安装的包：**
- `@sentry/nextjs@^10.29.0`

**配置文件：**
- [sentry.client.config.ts](sentry.client.config.ts) - 客户端配置
- [sentry.server.config.ts](sentry.server.config.ts) - 服务端配置
- [sentry.edge.config.ts](sentry.edge.config.ts) - Edge Runtime 配置
- [next.config.ts](next.config.ts) - 已集成 Sentry webpack 插件

**环境变量配置：**
需要在 [.env.local](.env.local) 中配置以下变量：

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=your_org_name
SENTRY_PROJECT=your_project_name
SENTRY_AUTH_TOKEN=your_auth_token  # 可选，用于上传 source maps
```

**获取配置：**
1. 访问 [Sentry](https://sentry.io/)
2. 创建新项目（选择 Next.js）
3. 复制 DSN 和其他配置信息
4. 粘贴到 `.env.local` 文件中

---

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`：
```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 填入真实的密钥：

```env
# Clerk（必需）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=你的_clerk_公钥
CLERK_SECRET_KEY=你的_clerk_密钥

# Sentry（可选）
NEXT_PUBLIC_SENTRY_DSN=你的_sentry_dsn
SENTRY_ORG=你的_组织名
SENTRY_PROJECT=你的_项目名
```

### 3. 运行开发服务器
```bash
pnpm dev
```

---

## 技术栈对比

| 功能 | 之前 | 现在 |
|------|------|------|
| 代码格式化 | ❌ 无 | ✅ Prettier |
| Git Hooks | ❌ 无 | ✅ Husky + lint-staged |
| URL 状态管理 | ❌ 无 | ✅ Nuqs |
| 认证系统 | ❌ 无 | ✅ Clerk |
| 错误追踪 | ❌ 无 | ✅ Sentry |

---

## 下一步

### 必需配置（项目无法运行）：
1. **配置 Clerk 密钥**（必需）- 否则无法访问受保护的路由

### 可选配置：
2. **配置 Sentry DSN**（可选）- 用于生产环境错误监控
3. **自定义 Clerk 外观** - 修改登录/注册页面样式以匹配你的品牌
4. **配置 Clerk Webhooks** - 用于同步用户数据到你的数据库

---

## 常见问题

### Q: 为什么访问 /dashboard 会重定向到登录页面？
A: 因为 Clerk middleware 已配置，所有非公开路由都需要登录。请先配置 Clerk 密钥并创建用户账号。

### Q: 如何禁用 Sentry（开发环境）？
A: 不配置 `NEXT_PUBLIC_SENTRY_DSN` 即可，Sentry 不会初始化。

### Q: 如何添加更多公开路由？
A: 编辑 [src/middleware.ts](src/middleware.ts)，在 `isPublicRoute` 中添加路由模式。

### Q: Git 提交时卡住了？
A: Husky 的 pre-commit hook 正在运行 lint-staged。如果代码有格式问题，会自动修复。如果有 ESLint 错误，需要手动修复。

---

## 相关文档

- [Clerk 文档](https://clerk.com/docs)
- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Nuqs 文档](https://nuqs.47ng.com/)
- [Prettier 文档](https://prettier.io/docs/)
- [Husky 文档](https://typicode.github.io/husky/)

---

## 更新记录

### 2024-12-07 - 配置修复

**修复的问题：**

1. ✅ Next.js Turbo 配置弃用警告 - 已迁移到 `turbopack`
2. ✅ Sentry 配置现代化 - 使用 instrumentation 文件
3. ✅ 添加全局错误处理器 - [src/app/global-error.tsx](src/app/global-error.tsx)
4. ✅ 修复 Webpack 模块加载错误
5. ✅ Clerk 路由配置 - 使用 catch-all routes
6. ✅ Sentry hooks 完善 - 添加路由和错误追踪

**新增文件：**

- [instrumentation.ts](instrumentation.ts) - Sentry 服务端初始化
- [instrumentation-client.ts](instrumentation-client.ts) - Sentry 客户端初始化
- [src/app/global-error.tsx](src/app/global-error.tsx) - 全局错误捕获
- [FIXES_APPLIED.md](FIXES_APPLIED.md) - 详细修复说明
- [QUICK_START.md](QUICK_START.md) - 快速开始指南

**已删除文件：**

- `sentry.client.config.ts` ❌
- `sentry.server.config.ts` ❌
- `sentry.edge.config.ts` ❌

**查看详情：** [FIXES_APPLIED.md](FIXES_APPLIED.md)
