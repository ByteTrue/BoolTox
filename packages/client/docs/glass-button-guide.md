# 玻璃拟态按钮使用指南

## 组件概述

`GlassButton` 是从 `glassmorphism-demo` 模块提取的可复用玻璃拟态按钮组件，提供统一的视觉风格和交互体验。

## 已应用位置

- ✅ **快速访问空状态** (`app-shell.tsx` 行 514-520)
  - 用户未添加快速访问时的引导按钮
  - 变体: `primary`, 尺寸: `sm`, 圆角: `fullRounded`

## 推荐应用场景

### 1. 主要操作按钮
- 模块中心的"安装模块"按钮 (可选，当前样式已足够好)
- 确认对话框的确认/取消按钮
- 表单提交按钮

**示例:**
```tsx
<GlassButton variant="primary" size="md">
  确认操作
</GlassButton>
```

### 2. 危险操作按钮
- 删除模块
- 清空缓存
- 重置设置

**示例:**
```tsx
<GlassButton variant="danger" size="md" icon={<Trash2 />}>
  删除模块
</GlassButton>
```

### 3. 次要操作按钮
- 取消按钮
- 返回按钮
- 关闭按钮

**示例:**
```tsx
<GlassButton variant="secondary" size="sm">
  取消
</GlassButton>
```

### 4. 成功状态按钮
- 下载完成
- 保存成功
- 操作完成

**示例:**
```tsx
<GlassButton variant="success" size="md" icon={<CheckCircle />}>
  保存成功
</GlassButton>
```

### 5. 幽灵按钮 (Ghost)
- 非关键性操作
- 内联操作
- 工具栏按钮

**示例:**
```tsx
<GlassButton variant="ghost" size="sm" icon={<Settings />}>
  设置
</GlassButton>
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'ghost'` | `'primary'` | 按钮变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按钮尺寸 |
| `icon` | `React.ReactNode` | - | 左侧图标 |
| `iconRight` | `React.ReactNode` | - | 右侧图标 |
| `fullRounded` | `boolean` | `false` | 完整圆角 (pill shape) |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `onClick` | `() => void` | - | 点击事件 |

### 变体样式

- **primary**: 主题色高亮，适用于主要操作
- **secondary**: 中性色，适用于次要操作
- **success**: 绿色，适用于成功状态
- **danger**: 红色，适用于危险操作
- **ghost**: 透明背景，适用于非关键操作

### 尺寸对比

- **sm**: `px-3 py-1.5 text-xs` - 小型按钮
- **md**: `px-4 py-2 text-sm` - 中型按钮（默认）
- **lg**: `px-6 py-3 text-base` - 大型按钮

## 设计原则

1. **统一阴影系统**: 所有按钮使用 `shadow-unified-*` 系列阴影
2. **主题适配**: 自动适配深色/浅色主题
3. **交互反馈**: hover 时缩放 105%，图标旋转 12°
4. **可访问性**: 支持键盘焦点和 ARIA 属性

## 不推荐使用的场景

- ❌ 导航链接（使用 `NavItem` 组件）
- ❌ 卡片点击区域（使用整个卡片作为点击区域）
- ❌ 标签/徽章（使用 badge 组件）
- ❌ 开关/切换（使用 toggle 组件）

## 迁移现有按钮

如需将现有按钮迁移为 `GlassButton`，请参考以下步骤：

1. 识别按钮的用途（主要/次要/危险等）
2. 选择合适的 `variant`
3. 确定 `size`（根据原按钮的 padding 和 font-size）
4. 提取图标（如有）并传入 `icon` 或 `iconRight`
5. 检查是否需要 `fullRounded`

## 示例集合

```tsx
import { GlassButton } from '@/components/ui/glass-button';
import { Download, Trash2, CheckCircle, Settings } from 'lucide-react';

// 主要操作
<GlassButton variant="primary" size="md" icon={<Download />}>
  下载模块
</GlassButton>

// 危险操作
<GlassButton variant="danger" size="md" icon={<Trash2 />}>
  删除
</GlassButton>

// 成功状态
<GlassButton variant="success" size="sm" icon={<CheckCircle />}>
  已保存
</GlassButton>

// 次要操作
<GlassButton variant="secondary" size="sm">
  取消
</GlassButton>

// 幽灵按钮
<GlassButton variant="ghost" size="sm" icon={<Settings />} fullRounded />
```

## 相关文件

- 组件定义: `src/renderer/components/ui/glass-button.tsx`
- 玻璃样式工具: `src/renderer/utils/glass-layers.ts`
- 统一阴影系统: `src/renderer/utils/shadow-system.ts`
- 原始示例: `src/modules/glassmorphism-demo/module.tsx`
