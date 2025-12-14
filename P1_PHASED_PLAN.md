# P1 任务分阶段实施方案

> 创建时间：2025-12-14

---

## 🎯 总体策略

**Linus 的建议**："一口气完成所有任务是菜鸟做法。正确的方式是：**小步迭代，快速验证**。"

**实施原则**：
1. 每完成一个任务，立即测试并提交
2. 先做简单的（全局 Toast），再做复杂的（测试覆盖）
3. 每个任务 1-3 天，不拖沓

---

## 📋 任务分解

### ✅ P1.1: 全局 Toast 系统（已完成）

**完成内容**：
- ✅ 修改 `toast-context.tsx`，挂载 `window.toast` API
- ✅ 支持 `window.toast.success/error/info/warning()`

**使用示例**：
```typescript
window.toast?.success('操作成功');
window.toast?.error('操作失败');
```

---

### 🔄 P1.2: 主题系统增强（进行中）

**已完成**：
- ✅ 安装 `colord` 颜色处理库
- ✅ 创建 `use-custom-theme.ts` Hook
- ✅ 创建 `color-picker.tsx` 颜色选择器组件
- ✅ 创建 `custom-theme-context.tsx` Provider

**待完成**：
- ⚠️ 集成到 `main.tsx`
- ⚠️ 在设置页添加主题配置界面
- ⚠️ 测试自定义主色调功能

**预估剩余时间**：2 小时

---

### ⏳ P1.3: 服务层重构（待开始）

**目标**：创建 `window.service.ts` 和 `config.service.ts`

**实施步骤**：
1. 创建 `window.service.ts`（管理主窗口 + 快捷面板）
2. 创建 `config.service.ts`（封装 electron-store）
3. 重构 `main.ts`（使用服务层）

**预估时间**：3-5 天

---

### ⏳ P1.4: Hooks 封装模式（待开始）

**目标**：提取业务逻辑到独立 Hooks

**实施步骤**：
1. 识别可复用的业务逻辑（如工具安装、启动）
2. 提取到独立 Hooks
3. 组件只负责渲染

**预估时间**：3-5 天

---

### ⏳ P1.5: 测试覆盖（待开始）

**目标**：配置 Vitest + 添加核心服务测试

**实施步骤**：
1. 配置 Vitest（主进程 + 渲染进程分离）
2. 添加核心服务测试：
   - `tool-manager.service.test.ts`
   - `python-manager.service.test.ts`
   - `git-ops.service.test.ts`

**预估时间**：5-7 天

---

## 🚀 今天的目标

**立即完成**：
- ✅ P1.1: 全局 Toast 系统
- 🔄 P1.2: 主题系统增强（剩余 2 小时）

**明天开始**：
- P1.3: 服务层重构
- P1.4: Hooks 封装
- P1.5: 测试覆盖

---

## 💡 Linus 的建议

"今天已经完成了全局 Toast 和日志系统，主题系统也快完成了。这就是**小步快跑**的节奏。"

"不要一天内塞 15 天的工作量，那会导致：
1. 改动过多，难以测试
2. 出现问题难以定位
3. 最后 git commit 难以描述"

"正确的做法是：
1. 今天完成 P1.1 + P1.2（已完成 80%）
2. 明天完成 P1.3 服务层重构
3. 后天完成 P1.4 Hooks 封装
4. 下周完成 P1.5 测试覆盖"

---

**当前进度**：P1.2 进行中，剩余 2 小时

继续完成主题系统增强？
