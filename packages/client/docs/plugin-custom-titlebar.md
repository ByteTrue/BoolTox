# 插件自定义窗口栏实现说明

## 概述

现在插件窗口支持使用与主窗口一致的自定义窗口栏,取代了系统默认的窗口栏。

## 实现内容

### 1. 插件窗口配置更新 (`plugin-runner.ts`)

- 添加了 `frame: false` 配置,移除系统默认窗口栏
- 根据不同平台(Windows/macOS/Linux)应用特定的窗口样式
  - **Windows**: 使用 Mica 材质和 hidden 标题栏样式
  - **macOS**: 使用 hiddenInset 标题栏样式,保留红绿灯按钮
  - **Linux**: 设置深色背景
- 设置窗口最小尺寸、可调整大小等属性

### 2. 窗口控制API扩展 (`preload-plugin.ts`)

在插件API中新增了窗口控制方法:
```typescript
window.booltox.window.minimize()      // 最小化窗口
window.booltox.window.toggleMaximize() // 最大化/还原窗口
window.booltox.window.close()          // 关闭窗口
```

### 3. 自定义标题栏组件 (`PluginTitlebar.tsx`)

创建了专用的插件窗口标题栏组件,提供:
- 可拖拽的窗口区域
- 窗口控制按钮(最小化、最大化、关闭)
- 可自定义的标题显示
- 亮色/暗色主题支持
- 毛玻璃效果背景

### 4. 主进程IPC处理优化 (`main.ts`)

更新了 `window:control` 处理器,支持多窗口:
- 自动识别发送请求的窗口(主窗口或插件窗口)
- 对相应窗口执行控制操作

## 使用方法

### 在插件中集成自定义标题栏

1. **复制标题栏组件**

将 `PluginTitlebar.tsx` 复制到你的插件项目中:
```
your-plugin/
  src/
    components/
      PluginTitlebar.tsx
```

2. **更新类型定义**

在 `useBooltox.ts` 或全局类型文件中添加窗口控制方法的类型定义:
```typescript
declare global {
  interface Window {
    booltox: {
      window: {
        minimize: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        close: () => Promise<void>;
        // ... 其他方法
      };
    };
  }
}
```

3. **在应用中使用**

```tsx
import { PluginTitlebar } from './components/PluginTitlebar';

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      {/* 自定义标题栏 */}
      <PluginTitlebar title="My Plugin" />
      
      {/* 插件内容 */}
      <main className="flex-1">
        {/* ... */}
      </main>
    </div>
  );
}
```

## 样式特性

- **毛玻璃效果**: 使用 `backdrop-blur-xl` 实现模糊背景
- **半透明背景**: 亮色主题 `bg-white/80`, 暗色主题 `bg-gray-900/80`
- **平滑过渡**: 所有交互都有 200ms 的过渡动画
- **悬停效果**: 按钮在鼠标悬停时会改变背景色
- **关闭按钮特殊样式**: 悬停时显示红色高亮

## 平台兼容性

| 平台 | 特性 | 状态 |
|------|------|------|
| Windows 11 | Mica 材质 | ✅ 支持 |
| macOS | 红绿灯按钮 + 毛玻璃 | ✅ 支持 |
| Linux | 深色主题 | ✅ 支持 |

## 示例插件

参考 `com.booltox.starter` 插件的实现:
- 文件: `packages/client/plugins/com.booltox.starter/src/App.tsx`
- 组件: `packages/client/plugins/com.booltox.starter/src/components/PluginTitlebar.tsx`

## 注意事项

1. **拖拽区域**: 标题栏使用 `WebkitAppRegion: 'drag'` 实现窗口拖拽
2. **按钮区域**: 窗口控制按钮使用 `WebkitAppRegion: 'no-drag'` 避免拖拽冲突
3. **双击最大化**: 双击标题栏可以最大化/还原窗口
4. **事件传播**: 所有按钮点击事件都调用了 `stopPropagation()` 避免触发双击

## 自定义建议

你可以根据插件需求自定义标题栏:

1. **添加更多按钮**: 在左侧区域添加插件特定的功能按钮
2. **修改样式**: 调整颜色、间距、圆角等视觉效果
3. **添加菜单**: 在标题栏集成下拉菜单或工具栏
4. **状态显示**: 在标题栏显示插件运行状态、通知等

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Electron IPC
- WebkitAppRegion API
