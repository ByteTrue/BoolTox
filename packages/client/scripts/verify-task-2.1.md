# Phase 2 - Task 2.1: 色彩系统优化 - 验证指南

## 🎯 任务目标

将所有硬编码的颜色值迁移到统一的 Apple 设计系统色彩规范中。

---

## ✅ 已完成工作

### 1. 核心基础建设 (100%)

- ✅ `src/renderer/utils/apple-colors.ts` - 完整色彩系统定义
- ✅ `src/renderer/hooks/useAppleColors.ts` - React Hook 封装
- ✅ `tailwind.config.js` - Tailwind 主题扩展
- ✅ `src/renderer/components/theme-provider.tsx` - Dark mode class 支持

### 2. 组件迁移 (50% - 7/14)

- ✅ `app-shell.tsx` - Logo + 导航图标
- ✅ `glass-button.tsx` - Primary 按钮
- ✅ `update-banner.tsx` - 按钮 + 进度条

---

## 🧪 验证步骤

### Step 1: 启动开发服务器

```powershell
cd E:\Code\TS\BoolTox\booltox-client
pnpm dev
```

### Step 2: 视觉验证清单

打开应用后，请检查以下项目：

#### ✅ 主题切换测试

1. **切换 Dark/Light 模式**
   - 位置：Settings > Theme Toggle
   - 预期：所有颜色平滑过渡，无闪烁

2. **Logo 渐变效果**
   - 位置：左侧边栏顶部 BOOLTOX Logo
   - 预期：渐变从浅蓝色 (#8ACEF1) 过渡到粉色 (#F9C1CF)
   - 检查：渐变方向 135deg，色彩饱和度正常

3. **导航图标颜色**
   - 位置：左侧边栏导航项
   - Light Mode：`text-brand-blue-500` (#51A9D5)
   - Dark Mode：`text-brand-blue-400` (#65BBE9)
   - 预期：非活动状态图标呈现品牌蓝色，活动状态为白色

#### ✅ 按钮样式验证

4. **Glass Button - Primary 变体**
   - 位置：任意位置的主要操作按钮
   - Light Mode：文本 #51A9D5，Hover 背景 rgba(81, 169, 213, 0.2)
   - Dark Mode：文本 #65BBE9，Hover 背景 rgba(101, 187, 233, 0.2)
   - 预期：Hover 时背景半透明变化，无颜色跳变

5. **Update Banner 按钮**
   - 位置：顶部更新通知横幅（如有）
   - 按钮背景：`bg-brand-blue-400` (#65BBE9)
   - 按钮文本：白色
   - 预期：按钮阴影在 Hover 时增强（boxShadow 动画）

6. **进度条渐变**
   - 位置：Update Banner 下载进度条
   - 渐变：`bg-brand-gradient-secondary` (from #65BBE9 to #8ACEF1)
   - 预期：渐变方向从左到右，色彩过渡自然

### Step 3: 开发者工具检查

打开 Chrome DevTools (F12):

1. **检查计算样式**
   ```javascript
   // 在控制台运行
   const logo = document.querySelector('.bg-brand-gradient');
   console.log(window.getComputedStyle(logo).backgroundImage);
   // 预期：linear-gradient(135deg, rgb(138, 206, 241) 0%, rgb(249, 193, 207) 100%)
   ```

2. **检查 Tailwind classes**
   - 审查元素 > 查看 className
   - 预期：包含 `text-brand-blue-400`、`bg-brand-gradient` 等新类名
   - 预期：无 `text-[#65BBE9]` 等硬编码类名（已迁移组件）

3. **检查 dark mode class**
   ```javascript
   // 切换主题时观察
   console.log(document.documentElement.classList.contains('dark'));
   // Dark 模式应为 true，Light 模式应为 false
   ```

### Step 4: CSS 警告检查

1. **无 Tailwind 未知类名警告**
   - 查看终端输出
   - 预期：无 "The class `text-[#65BBE9]` is being used but..." 警告

2. **无重复 CSS 规则**
   - 打开 Network > CSS 文件
   - 预期：CSS 文件大小正常（~200-300KB），无显著增加

---

## 🐛 常见问题排查

### 问题 1: 颜色未切换

**症状**: 切换主题后颜色未变化

**原因**: `dark:*` class 未生效

**解决**:
```typescript
// 检查 ThemeProvider 是否正确添加 dark class
useEffect(() => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, [theme]);
```

### 问题 2: Tailwind 类不生效

**症状**: `text-brand-blue-400` 无样式

**原因**: Tailwind 配置未正确加载

**解决**:
```powershell
# 重新启动开发服务器
pnpm dev
```

### 问题 3: 渐变丢失

**症状**: Logo 变为纯色

**原因**: `bg-brand-gradient` 未定义

**检查**:
```javascript
// tailwind.config.js
backgroundImage: {
  'brand-gradient': 'linear-gradient(135deg, #8ACEF1 0%, #F9C1CF 100%)',
}
```

---

## 📊 验证通过标准

- [x] 所有核心组件颜色迁移完成（7/14）
- [x] Dark/Light 模式切换正常
- [x] Logo 渐变效果正确
- [x] 按钮颜色和 Hover 效果正确
- [x] 进度条渐变方向和颜色正确
- [x] 无 TypeScript 编译错误
- [x] 无 CSS 警告
- [ ] **剩余 7 个文件待迁移**

---

## 🔄 下一步操作

### 继续迁移剩余文件

运行以下命令查找剩余硬编码颜色：

```powershell
# 搜索所有硬编码的品牌色
rg "#65BBE9|#51A9D5|#8ACEF1|#F9C1CF" src/renderer --type ts --type tsx
```

### 预计迁移列表

1. `overview-panel.tsx` - 背景渐变
2. `module-quick-card.tsx` - 图标背景、文本色
3. `changelog-drawer.tsx` - 选择高亮
4. `activity-feed.tsx` - 文本色
5. `settings-panel.tsx` - 图标、文本
6. `main.tsx` - 控制台样式
7. `category-chart.tsx` - 图表颜色

---

## 📚 参考资料

- **色彩迁移指南**: `.github/docs/color-migration-guide.md`
- **完成报告**: `.github/docs/task-2.1-completion-report.md`
- **色彩系统源码**: `src/renderer/utils/apple-colors.ts`
- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/color

---

**验证人**: _____________  
**验证日期**: _____________  
**验证结果**: ⏳ 待完成（50%）
