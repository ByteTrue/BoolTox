# 🚀 快速开始指南

## 📋 前置条件

- ✅ Node.js >= 20.0.0
- ✅ pnpm >= 8.0.0
- ✅ Clerk 账号（已配置密钥）

---

## 🔧 第一次启动

### 1. 安装依赖

```bash
cd packages/web-next
pnpm install
```

### 2. 配置环境变量

`.env.local` 文件已经包含了 Clerk 密钥：

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

✅ **Clerk 已配置完成！**

Sentry 配置是可选的（用于生产环境错误监控）：

```env
# 可选：如果需要错误追踪，填写 Sentry 配置
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 3. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动

---

## 🎯 测试认证流程

### 访问页面

1. **首页**（公开）
   ```
   http://localhost:3000/
   ```

2. **登录页面**（公开）
   ```
   http://localhost:3000/sign-in
   ```

3. **注册页面**（公开）
   ```
   http://localhost:3000/sign-up
   ```

4. **Dashboard**（需要登录）
   ```
   http://localhost:3000/dashboard
   ```
   - 未登录时会自动重定向到 `/sign-in`

### 创建测试账号

有两种方式：

**方式 1：通过注册页面**
1. 访问 `http://localhost:3000/sign-up`
2. 填写邮箱和密码
3. 完成注册流程

**方式 2：通过 Clerk Dashboard**
1. 访问 [Clerk Dashboard](https://dashboard.clerk.com/)
2. 选择你的应用
3. 进入 "Users" 页面
4. 点击 "Create User" 创建测试用户

---

## 🛠️ 常用命令

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |
| `pnpm format` | 格式化代码 |
| `pnpm format:check` | 检查代码格式 |

---

## 📁 项目结构

```
packages/web-next/
├── src/
│   ├── app/
│   │   ├── (auth)/              # 认证相关页面
│   │   │   ├── sign-in/         # 登录页
│   │   │   └── sign-up/         # 注册页
│   │   ├── (dashboard)/         # Dashboard 页面
│   │   ├── layout.tsx           # 根布局（包含 ClerkProvider）
│   │   └── global-error.tsx     # 全局错误处理
│   ├── components/              # UI 组件
│   ├── contexts/                # Context 提供者
│   ├── lib/                     # 工具函数
│   └── middleware.ts            # Clerk 中间件（路由保护）
├── instrumentation.ts           # Sentry 服务端初始化
├── instrumentation-client.ts    # Sentry 客户端初始化
├── next.config.ts              # Next.js 配置
├── .env.local                  # 环境变量
└── package.json                # 依赖和脚本
```

---

## 🔐 认证工作原理

### 路由保护

[src/middleware.ts](src/middleware.ts) 配置了路由保护：

**公开路由（无需登录）：**
- `/` - 首页
- `/sign-in` - 登录页
- `/sign-up` - 注册页
- `/api/public/*` - 公开 API

**受保护路由（需要登录）：**
- 所有其他路由（如 `/dashboard`）

### 登录后重定向

配置在 `.env.local` 中：

```env
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

用户登录/注册后会自动跳转到 Dashboard。

---

## 🎨 自定义 Clerk UI

### 修改外观

编辑 [src/app/(auth)/sign-in/page.tsx](src/app/(auth)/sign-in/page.tsx)：

```tsx
<SignIn
  appearance={{
    elements: {
      rootBox: "w-full max-w-sm",
      card: "shadow-lg",
      // 添加更多自定义样式
    },
  }}
/>
```

### 添加更多公开路由

编辑 [src/middleware.ts](src/middleware.ts)：

```ts
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',          // 添加新路由
  '/pricing',        // 添加新路由
  '/api/public(.*)',
]);
```

---

## ⚠️ 常见问题

### Q: 访问 Dashboard 时一直重定向？

**A:** 确保已登录。如果已登录仍然重定向，检查：
1. Clerk 密钥是否正确配置
2. 浏览器控制台是否有错误
3. 清除浏览器缓存和 Cookie

### Q: 看到 Sentry 警告？

**A:** Sentry 配置是可选的。如果不需要，可以：
1. 在 `.env.local` 中删除或注释掉 `NEXT_PUBLIC_SENTRY_DSN`
2. Sentry 不会初始化，警告会消失

### Q: 端口 3000 被占用？

**A:** 使用其他端口：
```bash
pnpm dev -p 3001
```

### Q: 看到 TypeScript 错误？

**A:** 运行类型检查：
```bash
pnpm tsc --noEmit
```

---

## 📚 相关文档

- [集成指南](INTEGRATION_GUIDE.md) - 完整的技术栈集成说明
- [修复说明](FIXES_APPLIED.md) - 已应用的修复详情
- [Clerk 文档](https://clerk.com/docs) - Clerk 认证系统
- [Next.js 文档](https://nextjs.org/docs) - Next.js 框架
- [Sentry 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - Sentry 错误追踪

---

## ✨ 特性清单

- ✅ **Prettier** - 代码格式化
- ✅ **Husky + lint-staged** - Git 提交前自动格式化
- ✅ **Nuqs** - URL 状态管理
- ✅ **Clerk** - 完整的认证系统
- ✅ **Sentry** - 错误追踪和监控
- ✅ **Shadcn/ui** - 精美的 UI 组件
- ✅ **Tailwind CSS v4** - 样式框架
- ✅ **Zustand** - 状态管理
- ✅ **React Hook Form** - 表单管理
- ✅ **Zod** - 数据验证

---

**准备好了吗？运行 `pnpm dev` 开始开发！** 🎉
