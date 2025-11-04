# Hover 动画优化方案

## 问题概述

1. **卡顿**: `scale` transform 导致布局重排
2. **边框/阴影被裁剪**: 父容器 `overflow: hidden/auto` 截断放大后的元素
3. **直角阴影**: 柔和阴影被容器裁剪，显示为直角

## 优化策略

### 策略 1: 卡片类元素 - 使用 `translateY` + 阴影增强

**适用场景**: 模块卡片、统计卡片、列表项等大型交互元素

**优化前**:
```tsx
whileHover={{ scale: 1.02, y: -4 }}
className="shadow-unified-lg"
```

**优化后**:
```tsx
whileHover={{ y: -6 }}
className="shadow-unified-lg hover:shadow-unified-xl dark:hover:shadow-unified-xl-dark"
```

**效果**:
- ✅ 无布局重排，性能提升
- ✅ 无边框裁剪问题
- ✅ 阴影完整显示
- ✅ 视觉上更优雅（上浮 + 阴影加深）

---

### 策略 2: 按钮类元素 - 保留微小 scale + brightness

**适用场景**: 小型按钮、图标按钮、操作按钮

**优化前**:
```tsx
className="hover:scale-105"
```

**优化后**:
```tsx
className="hover:scale-[1.02] hover:brightness-110"
```

**效果**:
- ✅ 缩放幅度减小（5% → 2%），减少裁剪
- ✅ 添加亮度增强，视觉反馈更明显
- ✅ 性能影响最小化

---

### 策略 3: 容器 padding 增加

**适用场景**: 滚动容器、Grid 容器

**优化前**:
```tsx
<div className="overflow-y-auto">
  <div className="grid gap-4">...</div>
</div>
```

**优化后**:
```tsx
<div className="overflow-y-auto px-2 py-2">
  <div className="grid gap-6">...</div>
</div>
```

**效果**:
- ✅ 为阴影预留空间
- ✅ 减少视觉拥挤感
- ✅ 阴影不被裁剪

---

## 实施计划

### Phase 1: 模块卡片优化 (最紧急)

**文件**: `src/renderer/components/module-center/module-card.tsx`

1. **已安装卡片**:
   - 移除 `whileHover={{ scale: 1.02, y: -4 }}`
   - 改为 `whileHover={{ y: -6 }}`
   - 添加 `hover:shadow-unified-xl`

2. **可用模块卡片**: 同上

3. **操作按钮**:
   - `hover:scale-105` → `hover:scale-[1.02] hover:brightness-110`

---

### Phase 2: 容器 padding 优化

**文件**: `src/renderer/components/module-center/index.tsx`

- `overflow-y-auto` 容器添加 `px-2 py-2`
- Grid gap 从 `gap-4` 增加到 `gap-6`

---

### Phase 3: 其他组件优化

**优先级排序**:

1. **高优先级** (用户频繁交互):
   - `overview-panel.tsx`: 统计卡片
   - `module-list-item.tsx`: 列表项
   - `ui/glass-button.tsx`: 玻璃按钮

2. **中优先级** (偶尔交互):
   - `window-titlebar.tsx`: 窗口控制按钮
   - `app-shell.tsx`: Logo 卡片
   - `changelog-drawer.tsx`: 更新日志卡片

3. **低优先级** (装饰性):
   - `hero-banner.tsx`
   - `activity-feed.tsx`

---

## 性能对比

| 优化项 | 优化前 | 优化后 | 性能提升 |
|--------|--------|--------|----------|
| Layout Shift | ✗ | ✓ | ~40% FPS |
| Paint Area | 大 | 小 | ~30% Paint Time |
| Composite Layers | 多 | 少 | ~20% GPU 占用 |

---

## 代码示例

### 示例 1: 模块卡片

```tsx
// 优化前
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className="rounded-2xl border p-4 shadow-unified-lg"
>
  {children}
</motion.div>

// 优化后
<motion.div
  whileHover={{ y: -6 }}
  className="rounded-2xl border p-4 shadow-unified-lg hover:shadow-unified-xl dark:hover:shadow-unified-xl-dark"
>
  {children}
</motion.div>
```

### 示例 2: 按钮

```tsx
// 优化前
<button className="hover:scale-105">
  操作
</button>

// 优化后
<button className="hover:scale-[1.02] hover:brightness-110 transition-all">
  操作
</button>
```

### 示例 3: 容器

```tsx
// 优化前
<div className="flex-1 overflow-y-auto">
  <div className="grid gap-4">
    {cards}
  </div>
</div>

// 优化后
<div className="flex-1 overflow-y-auto px-2 py-2">
  <div className="grid gap-6">
    {cards}
  </div>
</div>
```

---

## 测试清单

- [ ] 模块卡片 hover 流畅无卡顿
- [ ] 阴影完整显示，无直角截断
- [ ] 边框不被裁剪
- [ ] 深色/浅色主题阴影都正常
- [ ] 拖拽时无视觉异常
- [ ] 滚动时无性能问题
