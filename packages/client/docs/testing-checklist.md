# 功能测试清单

## 阶段 1-4: 快速访问功能 ✅ (已测试通过)

- [x] Pin 按钮可点击
- [x] 模块添加到快速访问后出现在导航栏
- [x] 导航标题显示为"快速访问"
- [x] 拖拽排序功能实现

## 阶段 5: 统一阴影系统 ⏳ (待测试)

### 5.1 Tailwind 配置验证

- [ ] 确认 `tailwind.config.js` 包含 12 个自定义阴影类
- [ ] 检查深色/浅色主题变体都已定义

### 5.2 组件阴影更新

| 组件 | 原阴影 | 新阴影 | 测试结果 |
|------|--------|--------|----------|
| 模块卡片安装按钮 | `shadow-lg/md` | `shadow-unified-md-dark/md` | ⏳ |
| 导航按钮 | `shadow-lg` | `shadow-unified-md-dark/md` | ⏳ |
| 导航按钮 hover | `shadow-xl` | `shadow-unified-xl-dark/xl` | ⏳ |
| 导航图标 (激活) | `shadow-xl shadow-[#65BBE9]/40` | `shadow-unified-lg-dark/lg` | ⏳ |
| 导航图标 (非激活) | `shadow-md` | `shadow-unified-sm-dark/sm` | ⏳ |
| 徽章 | `shadow-lg` | `shadow-unified-sm-dark/sm` | ⏳ |
| 空状态卡片 | `shadow-lg` | `shadow-unified-md-dark/md` | ⏳ |
| Logo 卡片 | `shadow-2xl/xl + shadow-[#65BBE9]` | `shadow-unified-xl-dark/xl` | ⏳ |
| Logo 图标 | `shadow-lg` | `shadow-unified-md-dark/md` | ⏳ |
| 窗口标题栏 | `shadow-xl/md` | `shadow-unified-lg-dark/lg` | ⏳ |
| 窗口控制按钮 | `shadow-lg` | `shadow-unified-sm-dark/sm` | ⏳ |
| 窗口控制按钮 hover | `shadow-xl` | `shadow-unified-md-dark/md` | ⏳ |
| 确认对话框 | `shadow-[0_18px_48px...]` | `shadow-unified-2xl-dark/2xl` | ⏳ |

### 5.3 视觉回归测试

**深色主题:**
- [ ] 所有阴影呈现右下角方向
- [ ] 阴影柔和过渡，无锐角截断
- [ ] 阴影透明度适中 (0.3-0.7)
- [ ] hover 时阴影增强效果自然

**浅色主题:**
- [ ] 所有阴影呈现右下角方向
- [ ] 阴影柔和过渡，无锐角截断
- [ ] 阴影透明度较低 (0.1-0.3)
- [ ] hover 时阴影增强效果自然

**特殊检查:**
- [ ] 模块中心卡片下侧无直角截断
- [ ] 已安装卡片左侧无不自然蓝色阴影
- [ ] 导航按钮激活状态阴影不过于强烈
- [ ] 浮动元素（对话框）阴影明显但不突兀

## 阶段 6: 玻璃按钮组件 ⏳ (待测试)

### 6.1 组件功能测试

- [ ] GlassButton 组件可成功导入
- [ ] 5 种变体全部渲染正常 (primary/secondary/success/danger/ghost)
- [ ] 3 种尺寸渲染正常 (sm/md/lg)
- [ ] `fullRounded` 属性生效
- [ ] `icon` 和 `iconRight` 正确显示
- [ ] `disabled` 状态正确阻止交互

### 6.2 交互测试

- [ ] hover 时按钮缩放至 105%
- [ ] hover 时图标旋转 12°
- [ ] 点击事件正确触发
- [ ] 键盘焦点高亮可见
- [ ] disabled 状态下无 hover 效果

### 6.3 视觉测试

**深色主题:**
- [ ] primary 变体显示蓝色主题色
- [ ] secondary 变体显示白色/中性色
- [ ] success 变体显示绿色
- [ ] danger 变体显示红色
- [ ] ghost 变体透明度适中

**浅色主题:**
- [ ] primary 变体显示蓝色主题色
- [ ] secondary 变体显示灰色
- [ ] success 变体显示绿色
- [ ] danger 变体显示红色
- [ ] ghost 变体透明度适中

### 6.4 集成测试

- [ ] 空状态"前往安装 →"按钮使用 GlassButton
- [ ] 按钮样式与周围元素协调
- [ ] 点击跳转到模块中心功能正常

## 阶段 7: 综合测试

### 7.1 性能测试

- [ ] 10+ 模块拖拽排序帧率保持 60fps
- [ ] 快速切换主题无卡顿
- [ ] 模块加载/卸载流畅

### 7.2 数据持久化

- [ ] 重启应用后快速访问模块顺序保持
- [ ] 重启应用后 pin 状态保持
- [ ] 添加/移除模块后持久化正确

### 7.3 边界情况

- [ ] 快速访问空时显示引导卡片
- [ ] 所有模块都 pin 时列表正常
- [ ] 快速添加/移除多个模块无异常
- [ ] 拖拽到相同位置无变化

### 7.4 跨主题一致性

- [ ] 深色 ↔ 浅色切换时所有阴影正确更新
- [ ] 深色 ↔ 浅色切换时按钮样式正确更新
- [ ] 无颜色闪烁或样式残留

## 测试环境

- **操作系统**: Windows (主要), macOS (次要), Linux (次要)
- **Electron 版本**: 38.1.2
- **Node.js 版本**: ≥ 18.0.0
- **屏幕分辨率**: 1920x1080 (主要), 3840x2160 (4K 测试)

## 已知问题

1. **window-titlebar.tsx TypeScript 错误** (既有问题，非本次引入)
   - `WebkitAppRegion` 类型定义缺失
   - 不影响运行时功能
   - 解决方案: 添加类型声明文件 `electron.d.ts`

2. **Markdown Lint 警告** (文档格式)
   - 不影响功能
   - 可选修复: 添加空行符合 MD022/MD031/MD032 规则

## 回归测试

- [ ] 现有模块安装/卸载功能正常
- [ ] 模块商店搜索/过滤正常
- [ ] 模块设置页面正常
- [ ] 主题切换功能正常
- [ ] 窗口控制按钮功能正常

## 通过标准

- ✅ 所有 TypeScript 编译错误已解决（既有问题除外）
- ✅ 所有新增功能交互正常
- ✅ 视觉效果符合设计要求（右下角柔和阴影）
- ✅ 性能无明显下降（拖拽 60fps）
- ✅ 数据持久化正确
- ✅ 跨主题表现一致
