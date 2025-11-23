# 插件窗口自定义标题栏功能实现总结

## 需求描述

让插件独立窗口使用与client主窗口一样的自定义窗口栏,而不是系统默认的窗口栏。

## 实现方案

### 修改的文件

1. **`electron/services/plugin/plugin-runner.ts`** - 插件窗口创建逻辑
   - 添加 `frame: false` 移除系统窗口栏
   - 应用平台特定的窗口样式(Windows/macOS/Linux)
   - 设置窗口菜单栏可见性

2. **`electron/preload-plugin.ts`** - 插件预加载脚本
   - 扩展 `window.booltox.window` API
   - 新增 `minimize()`, `toggleMaximize()` 方法
   - 更新 `close()` 方法使用统一的IPC channel

3. **`electron/main.ts`** - 主进程IPC处理
   - 修改 `window:control` 处理器支持多窗口
   - 自动识别发送请求的窗口并执行相应操作

### 新增的文件

4. **`plugins/com.booltox.starter/src/components/PluginTitlebar.tsx`** - 自定义标题栏组件
   - 提供可拖拽的标题栏区域
   - 实现窗口控制按钮(最小化/最大化/关闭)
   - 支持亮色/暗色主题
   - 应用毛玻璃效果

5. **`plugins/com.booltox.starter/src/hooks/useBooltox.ts`** - 类型定义更新
   - 添加 `minimize` 和 `toggleMaximize` 方法的类型声明

6. **`docs/plugin-custom-titlebar.md`** - 功能说明文档
   - 详细的使用指南
   - 代码示例
   - 平台兼容性说明

## 技术细节

### 窗口配置

根据操作系统应用不同的窗口样式:

```typescript
// Windows
{
  backgroundMaterial: 'mica',
  titleBarStyle: 'hidden',
}

// macOS
{
  titleBarStyle: 'hiddenInset',
  trafficLightPosition: { x: 16, y: 16 },
  vibrancy: 'under-window',
  visualEffectState: 'active',
}

// Linux
{
  transparent: false,
  backgroundColor: '#1c1e23',
}
```

### API设计

插件通过 `window.booltox` 访问窗口控制API:

```typescript
window.booltox.window.minimize()      // 最小化
window.booltox.window.toggleMaximize() // 最大化/还原
window.booltox.window.close()          // 关闭
```

### 组件特性

- **WebkitAppRegion**: 实现窗口拖拽
- **双击最大化**: 双击标题栏切换窗口状态
- **事件隔离**: 按钮阻止事件冒泡避免误触
- **响应式样式**: 支持亮色/暗色主题自动切换

## 使用方式

1. 复制 `PluginTitlebar.tsx` 到插件项目
2. 更新类型定义添加窗口控制方法
3. 在应用顶部引入标题栏组件

```tsx
import { PluginTitlebar } from './components/PluginTitlebar';

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <PluginTitlebar title="My Plugin" />
      <main className="flex-1">
        {/* 插件内容 */}
      </main>
    </div>
  );
}
```

## 测试验证

已在示例插件 `com.booltox.starter` 中完成集成和测试:
- ✅ 窗口可正常拖拽
- ✅ 最小化按钮功能正常
- ✅ 最大化/还原功能正常
- ✅ 关闭按钮功能正常
- ✅ 双击标题栏最大化功能正常
- ✅ 亮色/暗色主题显示正常

## 平台支持

| 平台 | 状态 | 特性 |
|------|------|------|
| Windows 11 | ✅ 完全支持 | Mica材质 + 自定义标题栏 |
| macOS | ✅ 完全支持 | 红绿灯按钮 + 毛玻璃效果 |
| Linux | ✅ 完全支持 | 深色主题 |

## 后续优化建议

1. **标题栏模板**: 提供多种预设样式供插件选择
2. **主题集成**: 与系统主题更深度集成
3. **动画优化**: 添加窗口状态切换动画
4. **快捷键支持**: 支持键盘快捷键控制窗口
5. **自定义按钮**: 允许插件在标题栏添加自定义按钮
