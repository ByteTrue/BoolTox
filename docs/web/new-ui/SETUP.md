# BoolTox Web 设计系统安装指南

本文档记录了新设计系统的安装和配置步骤。

---

## ✅ 已完成的配置

### 1. 基础设计系统

- [x] 创建 `DESIGN.md` 设计文档
- [x] 创建 `components.json` (Shadcn/ui 配置)
- [x] 更新 `app/globals.css` (新配色方案)
- [x] 更新 `tailwind.config.ts` (字体、阴影、动画)

### 2. 配色方案

**主色 - 电光蓝**:
```css
--primary: 210 100% 56%;  /* #0EA5E9 */
```

**暗色模式 - 深空黑**:
```css
--background: 240 10% 4%;  /* #0A0A0A */
--card: 240 8% 8%;         /* #141414 */
```

---

## 📦 需要安装的依赖

### 步骤 1: 安装核心 UI 库

```bash
cd packages/web

# 安装 Toast 通知系统
pnpm add sonner

# 安装命令面板（高级）
pnpm add cmdk

# 安装轮播图库
pnpm add embla-carousel-react

# 安装底部抽屉（移动端）
pnpm add vaul

# 安装图片放大查看
pnpm add react-medium-image-zoom

# 安装虚拟滚动（性能优化）
pnpm add @tanstack/react-virtual
```

---

### 步骤 2: 安装 Shadcn/ui 组件

运行以下命令安装核心 UI 组件：

```bash
# 基础组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton

# 交互组件
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add tabs

# 命令面板
npx shadcn@latest add command

# 表单组件
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add switch

# 反馈组件
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add progress

# 导航组件
npx shadcn@latest add navigation-menu
npx shadcn@latest add breadcrumb
```

**或者一次性安装所有组件**:
```bash
npx shadcn@latest add button card badge skeleton dialog dropdown-menu sheet tabs command input label select switch alert toast progress navigation-menu breadcrumb
```

---

### 步骤 3: 字体配置（可选）

#### 方式 1: 使用 Google Fonts

在 `app/layout.tsx` 中添加：

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

#### 方式 2: 使用 CDN（临时方案）

在 `app/layout.tsx` 的 `<head>` 中添加：

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

---

## 🎨 使用新设计系统

### 1. 使用新配色

```tsx
// 主色
<div className="bg-primary-500 text-white">电光蓝按钮</div>

// 语义色
<div className="bg-success-500">成功状态</div>
<div className="bg-warning-500">警告状态</div>
<div className="bg-error-500">错误状态</div>

// 中性色（深空灰）
<div className="bg-neutral-950 dark:bg-neutral-950">深色背景</div>
```

---

### 2. 使用新阴影

```tsx
// 柔和阴影（卡片）
<div className="shadow-soft hover:shadow-soft-lg">卡片</div>

// 层次阴影
<div className="shadow-md">中阴影</div>
<div className="shadow-lg">大阴影</div>

// 霓虹光晕（CTA 按钮）
<button className="shadow-glow hover:shadow-glow-lg">立即安装</button>
```

---

### 3. 使用新动画

```tsx
// 淡入上浮
<div className="animate-fade-in-up">内容</div>

// 滑入效果
<div className="animate-slide-in-right">侧边栏</div>

// 闪烁效果（加载状态）
<div className="relative overflow-hidden">
  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</div>
```

---

### 4. 使用 Toast 通知

```tsx
'use client';

import { Toaster, toast } from 'sonner';

// 在 layout.tsx 中添加
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

// 使用示例
toast.success('插件安装成功', {
  description: 'Python Runner v2.1.0',
  action: {
    label: '打开',
    onClick: () => router.push('/tools/python-runner')
  }
});

toast.error('安装失败', {
  description: '网络连接错误'
});

toast.loading('正在安装插件...');
```

---

### 5. 使用命令面板

```tsx
'use client';

import { Command } from 'cmdk';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  // 全局快捷键
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="搜索插件、命令..." />
      <Command.List>
        <Command.Group heading="插件">
          <Command.Item>Python Runner</Command.Item>
          <Command.Item>Package Manager</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

---

## 🚀 下一步

### P0 - 立即开始（Week 1-2）

- [ ] 安装所有依赖包
- [ ] 创建 PluginCard 组件
- [ ] 重构首页
- [ ] 重构插件市场页面

### P1 - 增强体验（Week 3-4）

- [ ] 实现命令面板
- [ ] 添加 Toast 通知
- [ ] 优化加载状态（骨架屏）
- [ ] 插件详情页

### P2 - 高级功能（Week 5-6）

- [ ] 3D 悬浮卡片效果
- [ ] AI 推荐算法
- [ ] 主题定制器
- [ ] 性能优化（虚拟滚动）

---

## 📝 注意事项

### 1. 类型定义

如果遇到 TypeScript 类型错误，在 `next-env.d.ts` 中添加：

```typescript
/// <reference types="sonner" />
/// <reference types="cmdk" />
```

---

### 2. CSS 变量冲突

如果主题切换不生效，检查 `globals.css` 中的 CSS 变量是否被覆盖。

---

### 3. 性能优化

- 使用 `loading="lazy"` 延迟加载图片
- 大列表使用 `@tanstack/react-virtual` 虚拟滚动
- 路由切换使用 `<Link prefetch>` 预加载

---

## 🆘 常见问题

### Q: Shadcn 组件安装失败？

确保 `components.json` 存在且配置正确：
```bash
cat components.json
```

### Q: 字体没有加载？

检查字体是否正确引入，或临时使用系统字体：
```css
font-family: -apple-system, BlinkMacSystemFont, sans-serif;
```

### Q: 暗色模式不生效？

确保 `next-themes` 配置正确：
```tsx
<ThemeProvider attribute="class" defaultTheme="system">
```

---

## 📚 参考文档

- [Shadcn/ui 官方文档](https://ui.shadcn.com)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [cmdk GitHub](https://github.com/pacocoursey/cmdk)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Framer Motion 文档](https://www.framer.com/motion/)

---

**最后更新**: 2025-12-07
**维护者**: BoolTox Team
