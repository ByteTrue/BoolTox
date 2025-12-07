# BoolTox Web 使用指南

> **版本**: v1.0
> **更新日期**: 2025-12-07
> **适用于**: 开发者和最终用户

---

## 📖 目录

- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [组件使用](#组件使用)
- [主题定制](#主题定制)
- [快捷键](#快捷键)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 启动项目

```bash
# 进入项目目录
cd E:\Code\TS\BoolTox\booltox-web

# 启动开发服务器
pnpm --filter @booltox/web dev

# 访问应用
# 浏览器打开 http://localhost:3000
```

### 首次使用

1. **浏览首页** - 了解 BoolTox 的核心功能
2. **按 ⌘K** - 打开命令面板，体验快速导航
3. **点击主题按钮** - 尝试切换深色/浅色模式
4. **点击调色板图标** - 打开主题定制器，选择喜欢的颜色
5. **前往插件市场** - 浏览和安装插件

---

## 🎯 核心功能

### 1. 命令面板（⌘K）

**打开方式**:
- 快捷键: `⌘K` (Mac) 或 `Ctrl+K` (Windows/Linux)
- 点击 Navbar 右侧的搜索按钮

**功能**:
- 🔍 搜索插件、命令、设置
- 🧭 快速导航到任意页面
- 🌓 切换主题（⌘T）
- ⚙️ 打开设置（⌘,）
- 🏠 返回首页（⌘H）

**使用技巧**:
- 输入关键词快速搜索
- 使用 `↑↓` 键导航
- 按 `Enter` 执行命令
- 按 `ESC` 关闭面板

---

### 2. 插件市场

**位置**: `/tools/market`

**功能**:
- 📦 浏览 16+ 个精选插件
- 🔍 搜索插件（支持名称、描述、标签）
- 🏷️ 按分类筛选（10 个分类）
- 🔖 按标签筛选（多选）
- 📊 排序（评分/下载量/更新时间）
- 🎨 网格/列表视图切换
- 📱 响应式布局（支持移动端）

**筛选操作**:
1. **分类筛选** - 点击左侧分类列表
2. **标签筛选** - 点击左侧标签（可多选）
3. **排序** - 使用左侧排序下拉菜单
4. **搜索** - 顶部搜索框输入关键词
5. **清除筛选** - 点击"清除全部"按钮

**插件卡片**:
- ⭐ 星级评分
- 📥 下载量统计
- 🏷️ 官方/社区标记
- 🎯 快速安装/详情按钮
- 🟢 运行状态指示器（已安装的插件）

---

### 3. 工具箱

**位置**: `/tools`

**功能**:
- 📊 Agent 状态监控（CPU/内存/磁盘）
- 🔌 已安装插件管理
- ▶️ 快速启动/停止插件
- 🔍 搜索已安装的工具
- 📊 状态筛选（全部/运行中/已停止）

**Agent 状态面板**:
- **CPU 使用率** - 实时进度条（蓝色渐变）
- **内存使用率** - 实时进度条（紫色渐变）
- **磁盘使用率** - 实时进度条（绿色渐变）

**插件操作**:
- **启动** - 点击"启动"按钮
- **停止** - 点击"停止"按钮（运行中的插件）
- **设置** - 点击齿轮图标
- **查看详情** - 点击外部链接图标

---

### 4. 插件详情页

**位置**: `/tools/market/[pluginId]`

**功能**:
- 🖼️ Hero 区域展示
- ℹ️ 详细信息（评分/下载/版本/许可证）
- 📑 Tab 切换（简介/功能/更新日志/评论）
- 🔐 权限说明
- 👤 作者信息
- 🏷️ 标签展示
- 🔗 GitHub/文档链接

**操作按钮**:
- **安装插件** - 未安装时显示
- **打开** - 已安装时显示
- **设置** - 配置插件
- **GitHub** - 查看源码
- **文档** - 查看文档

---

## 🧩 组件使用

### Toast 通知

**基础用法**:
```typescript
import { toast } from 'sonner';

// 成功提示
toast.success('操作成功');

// 错误提示
toast.error('操作失败');

// 警告提示
toast.warning('请注意');

// 信息提示
toast.info('提示信息');

// 加载提示
toast.loading('加载中...');
```

**高级用法**:
```typescript
// 带描述
toast.success('插件已安装', {
  description: 'Python Runner v2.1.0'
});

// 带操作按钮
toast.success('更新可用', {
  description: '发现新版本 v3.0.0',
  action: {
    label: '立即更新',
    onClick: () => handleUpdate()
  }
});

// Promise 状态跟踪
toast.promise(
  installPlugin(),
  {
    loading: '正在安装...',
    success: '安装成功！',
    error: '安装失败'
  }
);
```

---

### 插件卡片

**基础用法**:
```typescript
import { PluginCard } from '@/components/tools/plugin-card-new';
import { Package } from 'lucide-react';

<PluginCard
  id="python-runner"
  name="Python Runner"
  description="运行 Python 脚本和包"
  icon={<Package size={24} />}
  category="开发工具"
  tags={['python', 'automation']}
  rating={4.9}
  downloads={25800}
  version="2.1.0"
  isOfficial={true}
  isRunning={false}
  isInstalled={false}
  onInstall={() => handleInstall()}
  onLaunch={() => handleLaunch()}
  onStop={() => handleStop()}
/>
```

**骨架屏**:
```typescript
import { PluginCardSkeleton } from '@/components/tools/plugin-card-new';

{isLoading && <PluginCardSkeleton />}
```

---

### 3D 倾斜卡片

**完整版（推荐用于特殊场景）**:
```typescript
import { TiltCard } from '@/components/ui/tilt-card';

<TiltCard
  tiltMaxAngle={15}    // 最大倾斜角度
  scale={1.05}         // 悬停缩放比例
  transitionSpeed={300} // 过渡速度
  glareEnable={true}    // 启用光晕效果
>
  <div className="p-6 bg-card rounded-xl">
    卡片内容
  </div>
</TiltCard>
```

**简化版（性能优先）**:
```typescript
import { SimpleTiltCard } from '@/components/ui/tilt-card';

<SimpleTiltCard>
  <div className="p-6 bg-card rounded-xl">
    卡片内容
  </div>
</SimpleTiltCard>
```

---

### 命令面板

命令面板已自动集成，用户按 `⌘K` 即可使用。

**自定义命令**:
编辑 `components/ui/command-palette-new.tsx`，在 `commands` 数组中添加新命令：

```typescript
const commands: CommandItem[] = [
  {
    id: 'custom-command',
    label: '自定义命令',
    description: '命令描述',
    icon: <Icon size={18} />,
    shortcut: '⌘X',
    action: () => {
      // 执行操作
      toast.success('命令已执行');
      setOpen(false);
    },
    group: '自定义',
  },
  // ... 其他命令
];
```

---

## 🎨 主题定制

### 切换深色/浅色模式

**方式 1**: 点击 Navbar 右侧的月亮/太阳图标

**方式 2**: 使用命令面板
- 按 `⌘K` 打开命令面板
- 输入"主题"或按 `⌘T`
- 选择浅色/深色模式

**方式 3**: 跟随系统
- 应用会自动跟随系统的深色模式设置

---

### 自定义主色调

**步骤**:
1. 点击 Navbar 右侧的**调色板图标** 🎨
2. 在弹出的面板中选择喜欢的颜色
3. 实时预览效果
4. 设置会自动保存到本地

**可选颜色**:
- 🔵 电光蓝（默认）
- 🟣 紫罗兰
- 🟢 翡翠绿
- 🟠 热情橙
- 🌸 樱花粉
- 🔷 青色
- 🟦 靛蓝
- 🌹 玫瑰红

**重置主题**:
打开主题定制器，点击底部的"重置为默认"按钮

---

## ⌨️ 快捷键

### 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `⌘K` / `Ctrl+K` | 打开命令面板 | 快速搜索和导航 |
| `⌘H` | 返回首页 | - |
| `⌘T` | 切换主题 | 深色/浅色模式 |
| `⌘,` | 打开设置 | - |
| `ESC` | 关闭面板 | 关闭命令面板或模态框 |

### 命令面板快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` `↓` | 上下导航 |
| `Enter` | 执行命令 |
| `ESC` | 关闭面板 |

---

## 🎨 设计系统使用

### 颜色类

```tsx
// 主色
<div className="bg-primary-500 text-white">主色按钮</div>
<div className="text-primary-600">主色文字</div>

// 语义色
<div className="bg-success-500">成功状态</div>
<div className="bg-warning-500">警告状态</div>
<div className="bg-error-500">错误状态</div>

// 中性色
<div className="bg-neutral-100 dark:bg-neutral-900">卡片背景</div>
<div className="text-neutral-600 dark:text-neutral-400">辅助文字</div>
```

---

### 阴影类

```tsx
// 柔和阴影
<div className="shadow-soft">卡片</div>
<div className="shadow-soft-lg">大卡片</div>

// 层次阴影
<div className="shadow-sm">小阴影</div>
<div className="shadow-md">中阴影</div>
<div className="shadow-lg">大阴影</div>

// 霓虹光晕（CTA 按钮）
<button className="shadow-glow">立即安装</button>
<button className="shadow-glow-purple">紫色光晕</button>
<button className="shadow-glow-green">绿色光晕</button>
```

---

### 动画类

```tsx
// 淡入上浮
<div className="animate-fade-in-up">内容</div>

// 淡入下落
<div className="animate-fade-in-down">顶部通知</div>

// 滑入效果
<div className="animate-slide-in-right">侧边栏</div>

// 闪烁加载
<div className="relative overflow-hidden">
  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</div>
```

---

### 圆角类

```tsx
// 标准圆角
<div className="rounded-lg">12px 圆角</div>
<div className="rounded-xl">16px 圆角</div>
<div className="rounded-2xl">24px 圆角</div>
<div className="rounded-3xl">32px 圆角</div>

// 完全圆形
<div className="rounded-full">圆形头像</div>
```

---

## 🛠️ 开发者指南

### 添加新插件（Mock 数据）

编辑 `lib/mock-plugins.tsx`：

```typescript
export const MOCK_PLUGINS: Plugin[] = [
  // ... 现有插件
  {
    id: 'my-plugin',
    name: '我的插件',
    description: '插件描述...',
    icon: <MyIcon size={24} />,
    category: 'development',
    tags: ['tag1', 'tag2'],
    rating: 4.5,
    downloads: 1000,
    version: '1.0.0',
    isOfficial: false,
    author: '你的名字',
    lastUpdated: '2025-12-07',
    license: 'MIT',
  },
];
```

---

### 创建新页面

使用新设计系统创建页面：

```typescript
'use client';

import { motion } from 'framer-motion';

export default function MyPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* 顶部栏 */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">页面标题</h1>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          页面内容...
        </motion.div>
      </div>
    </div>
  );
}
```

---

### 使用 Framer Motion 动画

**淡入动画**:
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  内容
</motion.div>
```

**上浮动画**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  内容
</motion.div>
```

**悬停效果**:
```typescript
<motion.div
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  卡片
</motion.div>
```

**分层延迟**:
```typescript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    {item.content}
  </motion.div>
))}
```

---

## 📱 响应式设计

### 断点使用

```tsx
// Tailwind 断点
<div className="
  text-sm           // 默认（< 640px）
  sm:text-base      // 手机横屏（≥ 640px）
  md:text-lg        // 平板（≥ 768px）
  lg:text-xl        // 笔记本（≥ 1024px）
  xl:text-2xl       // 桌面（≥ 1280px）
  2xl:text-3xl      // 大屏（≥ 1536px）
">
  响应式文字
</div>

// 布局响应式
<div className="
  grid
  grid-cols-1       // 移动端 1 列
  md:grid-cols-2    // 平板 2 列
  lg:grid-cols-3    // 桌面 3 列
  gap-6
">
  {/* 卡片 */}
</div>
```

---

### 移动端优化技巧

```tsx
// 隐藏/显示
<div className="hidden md:block">桌面端显示</div>
<div className="block md:hidden">移动端显示</div>

// 条件渲染
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

---

## ❓ 常见问题

### Q: 命令面板打不开？

**A**: 检查以下几点：
1. 确保没有其他应用占用 `⌘K` 快捷键
2. 尝试使用鼠标点击搜索按钮
3. 检查浏览器控制台是否有错误

---

### Q: 主题切换后样式不生效？

**A**: 尝试以下解决方案：
1. 刷新页面（F5）
2. 清除浏览器缓存
3. 检查 `globals.css` 中的 CSS 变量是否正确加载

---

### Q: 卡片悬停没有 3D 效果？

**A**: 3D 效果需要：
1. 使用 `<TiltCard>` 组件包裹
2. 确保浏览器支持 CSS 3D 变换
3. 检查 Framer Motion 是否正确安装

---

### Q: Toast 通知不显示？

**A**: 确保：
1. `layout.tsx` 中已添加 `<Toaster />` 组件
2. 正确导入 `import { toast } from 'sonner'`
3. 检查是否有其他组件遮挡（z-index 冲突）

---

### Q: 移动端侧边栏无法折叠？

**A**:
1. 点击顶部的滑块图标（`SlidersHorizontal`）
2. 检查屏幕宽度是否 < 768px
3. 尝试刷新页面

---

### Q: 如何查看所有可用插件？

**A**:
1. 访问 `/tools/market`
2. 在左侧选择"全部插件"分类
3. 或使用顶部搜索框搜索

---

### Q: 如何贡献新插件？

**A**:
1. Fork GitHub 仓库
2. 在 `lib/mock-plugins.tsx` 添加插件数据
3. 创建 Pull Request
4. 等待团队审核

---

## 🎯 性能优化建议

### 大列表优化

如果插件列表超过 100 个，建议使用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = React.useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: plugins.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200, // 卡片高度
  overscan: 5,
});

<div ref={parentRef} className="h-screen overflow-auto">
  <div style={{ height: rowVirtualizer.getTotalSize() }}>
    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
      <div
        key={virtualRow.key}
        style={{
          height: virtualRow.size,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <PluginCard {...plugins[virtualRow.index]} />
      </div>
    ))}
  </div>
</div>
```

---

### 图片懒加载

```typescript
import Image from 'next/image';

<Image
  src={plugin.icon}
  alt={plugin.name}
  width={96}
  height={96}
  loading="lazy"
  placeholder="blur"
/>
```

---

### 代码分割

```typescript
import dynamic from 'next/dynamic';

const PluginDetail = dynamic(() => import('./plugin-detail'), {
  loading: () => <PluginCardSkeleton />,
  ssr: false, // 可选：禁用 SSR
});
```

---

## 📊 性能监控

### Web Vitals

应用已集成 Web Vitals 监控（`components/web-vitals.tsx`）。

**查看性能指标**:
1. 打开浏览器控制台（F12）
2. 切换到 Console 标签
3. 查看 Web Vitals 输出

**优化目标**:
- **LCP** (最大内容绘制): < 2.5s
- **FID** (首次输入延迟): < 100ms
- **CLS** (累积布局偏移): < 0.1

---

## 🐛 故障排除

### 样式不生效

```bash
# 重新构建 Tailwind CSS
pnpm --filter @booltox/web dev

# 清除 .next 缓存
rm -rf .next
pnpm --filter @booltox/web dev
```

---

### TypeScript 类型错误

```bash
# 重新生成类型
pnpm --filter @booltox/web tsc --noEmit

# 检查配置
cat tsconfig.json
```

---

### 依赖问题

```bash
# 重新安装依赖
rm -rf node_modules
pnpm install

# 更新依赖
pnpm update
```

---

## 📞 获取帮助

### 文档
- **设计方案**: 查看 `DESIGN.md`
- **安装指南**: 查看 `SETUP.md`
- **进度报告**: 查看 `PROGRESS.md`

### 联系我们
- GitHub Issues: `https://github.com/booltox/booltox/issues`
- 讨论区: `https://github.com/booltox/booltox/discussions`
- 邮件: `support@booltox.dev`

---

## 🎉 进阶技巧

### 自定义动画

创建自己的动画曲线：

```typescript
<motion.div
  animate={{ ... }}
  transition={{
    type: 'spring',
    stiffness: 300,  // 刚度（越大越快）
    damping: 20,     // 阻尼（越大越少弹跳）
  }}
>
```

---

### 玻璃态效果

```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/20">
  玻璃态卡片
</div>

// Dark Mode
<div className="bg-black/10 backdrop-blur-md border border-white/10">
  深色玻璃态
</div>
```

---

### 渐变背景

```tsx
// 线性渐变
<div className="bg-gradient-to-r from-primary-500 to-purple-500">
  渐变背景
</div>

// 径向渐变（需要自定义 CSS）
<div style={{
  background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)'
}}>
  径向渐变
</div>
```

---

## 📝 更新日志

### v1.0.0 - 2025-12-07

**新增功能**:
- ✅ 完整设计系统
- ✅ Toast 通知系统
- ✅ 命令面板（⌘K）
- ✅ 插件卡片组件
- ✅ 3D 倾斜卡片
- ✅ 主题定制器
- ✅ 首页重构
- ✅ 插件市场页面
- ✅ 工具箱页面
- ✅ 插件详情页

**技术栈**:
- Next.js 15
- React 19
- Tailwind CSS 3.4
- Framer Motion 12
- Sonner (Toast)
- cmdk (Command)

---

**最后更新**: 2025-12-07
**维护者**: BoolTox Team
**版本**: v1.0.0
