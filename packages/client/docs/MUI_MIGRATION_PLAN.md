# BoolTox Client - MUI 迁移计划

> 从自研玻璃拟态组件迁移到 Material-UI (MUI) v6

## 1. 迁移概述

### 1.1 目标
- 统一 UI 设计语言（Material Design）
- 降低组件维护成本
- 提高开发效率
- 升级 Tailwind CSS v3 → v4

### 1.2 技术栈变更

| 项目 | 当前 | 迁移后 |
|------|------|--------|
| UI 组件库 | 自研 (32 个) | MUI v6 |
| 样式方案 | Tailwind CSS v3 | Tailwind CSS v4 + Emotion |
| 动画库 | Framer Motion | MUI 内置 + 少量 Framer Motion |
| 图标库 | Lucide React | MUI Icons + Lucide React |
| 主题系统 | 自研 glass-layers | MUI ThemeProvider |

### 1.3 风险评估

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 动画效果退化 | 高 | 保留关键 Framer Motion 动画 |
| Emotion + Tailwind 冲突 | 中 | 配置 CSS 层级优先级 |
| 业务组件改造工作量 | 高 | 分阶段迁移 |
| 暗色主题适配 | 中 | 使用 MUI 内置暗色主题 |

---

## 2. 组件迁移映射表

### 2.1 基础组件（优先级：高）

| 现有组件 | MUI 组件 | 迁移复杂度 | 备注 |
|----------|----------|------------|------|
| `glass-button.tsx` | `Button` | 低 | 5 种变体 → MUI 变体 |
| `input.tsx` | `TextField` | 低 | 直接替换 |
| `toggle.tsx` | `Switch` | 低 | 直接替换 |
| `modal.tsx` | `Dialog` | 中 | 需调整动画 |
| `confirm-dialog.tsx` | `Dialog` + `DialogActions` | 低 | 直接替换 |
| `dropdown.tsx` | `Menu` / `Select` | 中 | 根据用途选择 |
| `toast.tsx` | `Snackbar` + `Alert` | 低 | 直接替换 |
| `progress-bar.tsx` | `LinearProgress` | 低 | 直接替换 |
| `skeleton.tsx` | `Skeleton` | 低 | 直接替换 |
| `loading.tsx` | `CircularProgress` | 低 | 直接替换 |

### 2.2 复合组件（优先级：中）

| 现有组件 | MUI 组件 | 迁移复杂度 | 备注 |
|----------|----------|------------|------|
| `segmented-control.tsx` | `ToggleButtonGroup` | 中 | 需调整样式 |
| `spotlight.tsx` | `Autocomplete` (Combobox) | 高 | 命令面板风格 |
| `progress-toast.tsx` | `Snackbar` + `LinearProgress` | 中 | 组合使用 |
| `empty-state.tsx` | 自定义 + MUI `Typography` | 低 | 保留布局 |
| `page-header.tsx` | `AppBar` / `Toolbar` | 中 | 可选替换 |

### 2.3 业务组件（优先级：低）

| 现有组件 | 处理方式 | 备注 |
|----------|----------|------|
| `activity-feed.tsx` | 保留，内部使用 MUI 组件 | 业务逻辑复杂 |
| `activity-timeline.tsx` | 替换为 `Timeline` (MUI Lab) | 可选 |
| `system-monitor.tsx` | 保留，内部使用 MUI 组件 | 业务逻辑复杂 |
| `category-chart.tsx` | 保留 | 图表组件 |
| `module-quick-card.tsx` | 使用 `Card` 重写 | 业务组件 |
| `hero-banner.tsx` | 使用 `Paper` + `Typography` | 布局组件 |
| `update-banner.tsx` | 使用 `Alert` | 通知组件 |

### 2.4 特殊组件（需评估）

| 现有组件 | 建议 | 原因 |
|----------|------|------|
| `shine-button.tsx` | 删除或保留 | 特效按钮，MUI 无对应 |
| `tilt-card.tsx` | 删除 | 3D 效果，MUI 无对应 |
| `draggable-card.tsx` | 保留 | 拖拽功能，需 react-dnd |
| `haptic-scroll.tsx` | 评估 | 滚动效果，可能删除 |
| `horizontal-scroll.tsx` | 保留 | 横向滚动容器 |
| `glass-loading-fallback.tsx` | 替换为 `Skeleton` | 加载占位 |

---

## 3. 主题配置

### 3.1 MUI 主题结构

```typescript
// src/renderer/theme/mui-theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  // 调色板
  palette: {
    primary: {
      main: '#51A9D5',      // 品牌蓝
      light: '#65BBE9',
      dark: '#3D97C1',
    },
    secondary: {
      main: '#F9C1CF',      // 品牌粉
    },
    success: {
      main: '#34C759',
    },
    warning: {
      main: '#FF9500',
    },
    error: {
      main: '#FF3B30',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F7',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.85)',
      secondary: 'rgba(0, 0, 0, 0.60)',
    },
  },

  // 圆角
  shape: {
    borderRadius: 8,        // 默认 8px，对应 rounded-lg
  },

  // 字体
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none', // 禁用全大写
      fontWeight: 600,
    },
  },

  // 组件默认值
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,  // 禁用按钮阴影
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          elevation: 24,
        },
      },
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
};

// 亮色主题
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
  },
});

// 暗色主题
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#65BBE9',
    },
    secondary: {
      main: '#F9C1CF',
    },
    background: {
      default: '#1C1C1E',
      paper: '#2C2C2E',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.85)',
      secondary: 'rgba(255, 255, 255, 0.60)',
    },
  },
});
```

### 3.2 主题提供者

```typescript
// src/renderer/theme/ThemeProvider.tsx
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './mui-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const theme = useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
```

---

## 4. 迁移步骤

### Phase 1: 基础设施（预计 1 天）

#### 1.1 安装依赖
```bash
cd packages/client

# 安装 MUI 核心
pnpm add @mui/material @emotion/react @emotion/styled

# 安装 MUI 图标（可选）
pnpm add @mui/icons-material

# 安装 MUI Lab（高级组件）
pnpm add @mui/lab

# 升级 Tailwind CSS
pnpm add -D tailwindcss@next @tailwindcss/postcss@next
```

#### 1.2 配置 Emotion + Tailwind 共存
```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        // Tailwind 在 Emotion 之后加载
      ],
    },
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
});
```

#### 1.3 更新入口文件
```typescript
// src/main.tsx
import { ThemeProvider } from './renderer/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      {/* 应用内容 */}
    </ThemeProvider>
  );
}
```

### Phase 2: 基础组件迁移（预计 2-3 天）

按优先级顺序迁移：

1. **Button** - 替换所有 `GlassButton`
2. **TextField** - 替换所有 `Input`
3. **Switch** - 替换所有 `Toggle`
4. **Dialog** - 替换所有 `Modal` 和 `ConfirmDialog`
5. **Snackbar** - 替换所有 `Toast`
6. **Skeleton** - 替换所有骨架屏组件
7. **CircularProgress / LinearProgress** - 替换加载组件

#### 迁移示例：Button

```typescript
// 旧代码
import { GlassButton } from '@/components/ui/glass-button';
<GlassButton variant="primary" icon={<Star />}>
  主要按钮
</GlassButton>

// 新代码
import Button from '@mui/material/Button';
import StarIcon from '@mui/icons-material/Star';
<Button variant="contained" startIcon={<StarIcon />}>
  主要按钮
</Button>
```

#### 变体映射

| GlassButton variant | MUI Button |
|---------------------|------------|
| `primary` | `variant="contained"` |
| `secondary` | `variant="outlined"` |
| `danger` | `variant="contained" color="error"` |
| `ghost` | `variant="text"` |
| `success` | `variant="contained" color="success"` |

### Phase 3: 复合组件迁移（预计 2 天）

1. **SegmentedControl** → `ToggleButtonGroup`
2. **Dropdown** → `Menu` / `Select`
3. **Spotlight** → `Autocomplete`
4. **ProgressToast** → `Snackbar` + `LinearProgress`

### Phase 4: 业务组件改造（预计 3-4 天）

1. **ModuleCard** - 使用 `Card` 组件重构
2. **ModuleCenter** - 拆分并使用 MUI 组件
3. **SettingsPanel** - 使用 `List` + `ListItem` 重构
4. **TabBar** - 使用 `Tabs` 或保留自定义

### Phase 5: 清理与测试（预计 1-2 天）

1. 删除旧组件文件
2. 删除 `glass-layers.ts` 等旧工具
3. 更新 `tailwind.config.js`（移除自定义阴影等）
4. 全面测试

---

## 5. 删除清单

迁移完成后删除的文件：

### 5.1 组件文件
```
src/renderer/components/ui/
├── glass-button.tsx       ❌ 删除
├── modal.tsx              ❌ 删除
├── confirm-dialog.tsx     ❌ 删除
├── input.tsx              ❌ 删除
├── toggle.tsx             ❌ 删除
├── dropdown.tsx           ❌ 删除
├── toast.tsx              ❌ 删除
├── progress-bar.tsx       ❌ 删除
├── skeleton.tsx           ❌ 删除
├── skeleton-loader.tsx    ❌ 删除
├── loading.tsx            ❌ 删除
├── segmented-control.tsx  ❌ 删除
├── shine-button.tsx       ❌ 删除
├── tilt-card.tsx          ❌ 删除
├── glass-loading-fallback.tsx ❌ 删除
└── ...
```

### 5.2 工具文件
```
src/renderer/utils/
├── glass-layers.ts        ❌ 删除
├── micro-interactions.ts  ❌ 删除（部分保留）
├── fluid-animations.ts    ❌ 删除
├── animation-presets.ts   ❌ 删除（部分保留）
├── blur-effects.ts        ❌ 删除
└── ...
```

### 5.3 Tailwind 配置清理
```javascript
// tailwind.config.js - 删除以下配置
module.exports = {
  theme: {
    extend: {
      // ❌ 删除自定义阴影（使用 MUI elevation）
      boxShadow: { ... },
      // ❌ 删除自定义动画（使用 MUI transitions）
      animation: { ... },
      keyframes: { ... },
    },
  },
};
```

---

## 6. 验收标准

### 6.1 功能验收
- [ ] 所有页面正常渲染
- [ ] 亮色/暗色主题切换正常
- [ ] 所有按钮、输入框、对话框功能正常
- [ ] Toast 通知正常显示
- [ ] 工具安装/卸载/启动流程正常

### 6.2 视觉验收
- [ ] 统一使用 Material Design 风格
- [ ] 圆角、间距、颜色一致
- [ ] 无明显的样式冲突

### 6.3 性能验收
- [ ] 首屏加载时间 < 2s
- [ ] 页面切换流畅
- [ ] 无明显的样式闪烁 (FOUC)

---

## 7. 回滚策略

如果迁移失败，可通过以下方式回滚：

1. **Git 回滚**：`git revert` 到迁移前的 commit
2. **分支策略**：在 `refactor/mui-migration` 分支进行，不合并到 main
3. **增量迁移**：按组件逐个迁移，随时可停止

---

## 8. 时间估算

| 阶段 | 预计时间 | 风险 |
|------|----------|------|
| Phase 1: 基础设施 | 1 天 | 低 |
| Phase 2: 基础组件 | 2-3 天 | 中 |
| Phase 3: 复合组件 | 2 天 | 中 |
| Phase 4: 业务组件 | 3-4 天 | 高 |
| Phase 5: 清理测试 | 1-2 天 | 低 |
| **总计** | **9-12 天** | - |

---

## 附录 A: MUI 组件速查

| 用途 | MUI 组件 | 导入路径 |
|------|----------|----------|
| 按钮 | `Button` | `@mui/material/Button` |
| 输入框 | `TextField` | `@mui/material/TextField` |
| 开关 | `Switch` | `@mui/material/Switch` |
| 对话框 | `Dialog` | `@mui/material/Dialog` |
| 通知 | `Snackbar` | `@mui/material/Snackbar` |
| 提示 | `Alert` | `@mui/material/Alert` |
| 卡片 | `Card` | `@mui/material/Card` |
| 菜单 | `Menu` | `@mui/material/Menu` |
| 选择器 | `Select` | `@mui/material/Select` |
| 进度条 | `LinearProgress` | `@mui/material/LinearProgress` |
| 加载圈 | `CircularProgress` | `@mui/material/CircularProgress` |
| 骨架屏 | `Skeleton` | `@mui/material/Skeleton` |
| 标签组 | `Tabs` | `@mui/material/Tabs` |
| 切换组 | `ToggleButtonGroup` | `@mui/material/ToggleButtonGroup` |
| 时间线 | `Timeline` | `@mui/lab/Timeline` |
| 命令面板 | `Autocomplete` | `@mui/material/Autocomplete` |

---

*文档创建时间：2025-12-23*
*最后更新：2025-12-23*
