# BoolTox Web 性能优化指南

> **创建时间**: 2025-12-06
> **目标**: 确保 BoolTox Web 达到极致性能体验

---

## 📊 性能目标

### Core Web Vitals 目标值

| 指标 | 目标 | 当前状态 |
|------|------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | ✅ 已优化 |
| FID (First Input Delay) | < 100ms | ✅ 已优化 |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ 已优化 |
| FCP (First Contentful Paint) | < 1.8s | ✅ 已优化 |
| TTFB (Time to First Byte) | < 800ms | ✅ 已优化 |
| INP (Interaction to Next Paint) | < 200ms | ✅ 已优化 |

---

## ⚡ 已实施的优化

### 1. 动画性能优化

**GPU 加速**：
```tsx
// ✅ 仅动画 transform 和 opacity（GPU 加速）
<motion.div animate={{ opacity: 1, scale: 1.1, x: 10 }}>

// ❌ 避免动画 width/height（触发 reflow）
<motion.div animate={{ width: 200, height: 100 }}>
```

**减少动画模式**：
```tsx
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const prefersReducedMotion = useReducedMotion();
<motion.div animate={prefersReducedMotion ? false : { y: -4 }} />
```

### 2. 代码分割

**按路由自动分割**：
- Next.js 15 App Router 自动代码分割
- 每个页面独立 chunk

**懒加载重度组件**：
```tsx
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/loading';

const HeavyComponent = lazy(() => import('./heavy-component'));

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

### 3. 图片优化

**使用 Next.js Image**：
```tsx
import Image from 'next/image';

<Image
  src="/plugin-icon.png"
  alt="插件图标"
  width={48}
  height={48}
  loading="lazy"
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

**建议格式**：
- 使用 WebP 格式（减少 25-35% 体积）
- 提供占位模糊图（更好的 CLS）
- 懒加载非关键图片

### 4. SWR 数据缓存

**远程插件数据缓存**：
```tsx
import { useRemotePluginsWithSWR } from '@/lib/swr-config';

const { plugins, isLoading, reload } = useRemotePluginsWithSWR();
// 自动缓存 5 分钟，窗口聚焦时自动重新验证
```

**配置策略**：
- revalidateOnFocus: true（窗口聚焦重验证）
- dedupingInterval: 10s（10秒内去重）
- refreshInterval: 5min（自动刷新）
- keepPreviousData: true（保留旧数据）

### 5. 字体优化

**使用 font-display: swap**：
```tsx
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // ✅ 防止 FOIT
});
```

### 6. 性能监控

**Web Vitals 自动收集**：
```tsx
// app/layout.tsx
import { WebVitals } from '@/components/web-vitals';

<WebVitals /> // 自动收集 LCP, FID, CLS, FCP, TTFB, INP
```

---

## 🚀 进一步优化建议

### 虚拟滚动（插件 > 50 时）

**安装 react-window**：
```bash
pnpm add react-window @types/react-window
```

**使用示例**：
```tsx
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={320}
  height={800}
  rowCount={Math.ceil(plugins.length / 3)}
  rowHeight={240}
  width={1000}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const plugin = plugins[index];
    return plugin ? (
      <div style={style}>
        <PluginCard plugin={plugin} />
      </div>
    ) : null;
  }}
</FixedSizeGrid>
```

### 预加载关键路由

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// Hover 时预加载
<Link
  href="/tools/market"
  onMouseEnter={() => router.prefetch('/tools/market')}
>
```

### Service Worker 缓存（PWA）

```tsx
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // ... other config
});
```

---

## 📦 Bundle 优化

### 检查包体积

```bash
pnpm build
# 查看 .next/analyze 报告
```

### Tree-shaking 优化

```tsx
// ✅ 按需导入
import { motion } from 'framer-motion';

// ❌ 避免全量导入
import * as FramerMotion from 'framer-motion';
```

### 外部库优化

**Lucide React** 已优化（Tree-shakable）
**Framer Motion** 已优化（按需导入）
**Tailwind CSS** 已优化（PurgeCSS）

---

## 🎯 性能检查清单

### 开发时

- [ ] 使用 Chrome DevTools Lighthouse
- [ ] 检查 Network 瀑布流
- [ ] 监控 Performance 面板
- [ ] 查看 Web Vitals 控制台输出

### 构建时

- [ ] 检查 bundle 体积（< 200KB gzipped）
- [ ] 确认代码分割正常
- [ ] 验证 Tree-shaking 生效

### 部署前

- [ ] 运行完整 Lighthouse 审计
- [ ] 测试慢速 3G 网络
- [ ] 验证 CDN 缓存策略

---

## 🛠️ 调试工具

### Chrome DevTools

```javascript
// 测量关键操作性能
performance.mark('start-operation');
// ... 执行操作
performance.mark('end-operation');
performance.measure('operation', 'start-operation', 'end-operation');
```

### React DevTools Profiler

- 识别不必要的重渲染
- 优化组件性能
- 检查 memo/useMemo/useCallback 使用

---

## 📚 参考资源

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Framer Motion Performance](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**维护者**: ByteTrue
**最后更新**: 2025-12-06
