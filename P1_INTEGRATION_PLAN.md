# BoolTox P1 功能实施计划

> 更新时间：2025-12-13
> 状态：部分完成（基础组件已就绪，需集成）

---

## ✅ 已完成的组件（3/7）

### 1. 工具分类和截图预览 ✅

**新增组件**：
- `screenshot-carousel.tsx` - 截图轮播

**修改文件**：
- `module.ts` - 添加 screenshots 字段
- `module-detail-modal.tsx` - 集成截图显示
- `use-module-filter.ts` - 支持在线工具分类

**功能**：
- 详情页显示截图轮播
- 支持左右切换、指示器
- 分类筛选包含所有工具源

---

### 2. 拖拽添加本地工具 ✅

**新增组件**：
- `drop-zone.tsx` - 拖拽上传区域

**功能**：
- 支持拖拽文件夹或 ZIP
- 拖拽实时视觉反馈
- 点击浏览文件

**待集成**：
- ⚠️ 需要在 module-center 中显示 DropZone
- ⚠️ 需要添加文件处理逻辑

---

### 3. 批量操作 ⏳

**新增组件**：
- `batch-actions-bar.tsx` - 批量操作栏

**修改文件**：
- `module-card.tsx` - 添加复选框支持
- `module-toolbar.tsx` - 添加"选择模式"按钮

**待集成**：
- ⚠️ 需要在 module-center 中添加选择模式状态
- ⚠️ 需要实现批量操作逻辑（启动/停止/卸载）
- ⚠️ 需要在 ModuleGrid 中传递选择状态

---

## ⏳ 待实施功能（4/7）

### 4. manifest.json 验证优化

**需要实现**：
- JSON Schema 验证
- 友好的错误信息
- 修复建议和文档链接

**预计工作量**：1-2 天

**关键文件**：
- `manifest-infer.service.ts` - 添加详细验证
- `tool-manager.ts` - 集成验证逻辑

---

### 5. 安装重试机制

**需要实现**：
- 断点续传（Range 请求）
- 自动重试（指数退避）
- 重试按钮 UI

**预计工作量**：2-3 天

**关键文件**：
- `tool-installer.ts` - 下载和重试逻辑
- `module-center/index.tsx` - 重试 UI

---

### 6. 工具更新检查

**需要实现**：
- IPC handler：`tool:check-updates`
- 版本比较（semver）
- 更新徽章 UI
- 一键更新 / 批量更新

**预计工作量**：2-3 天

**关键文件**：
- `electron/services/tool/tool-updater.service.ts` (新增)
- `module-card.tsx` - 更新徽章
- `module-context.tsx` - 更新检查逻辑

---

### 7. 分离安装和依赖准备

**需要实现**：
- 安装时跳过依赖
- 启动时检查依赖
- 依赖准备进度对话框

**预计工作量**：3 天

**关键文件**：
- `tool-installer.ts` - 修改安装流程
- `tool-runner.ts` - 添加依赖检查
- `deps-prepare-dialog.tsx` (新增)

---

## 📋 集成工作清单

### 批量操作集成（必需）

```typescript
// module-center/index.tsx 需要添加：

const [isSelectionMode, setIsSelectionMode] = useState(false);
const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

// 切换选择
const handleSelect = (toolId: string) => {
  setSelectedToolIds(prev => {
    const next = new Set(prev);
    if (next.has(toolId)) {
      next.delete(toolId);
    } else {
      next.add(toolId);
    }
    return next;
  });
};

// 批量启动
const handleStartAll = async () => {
  for (const toolId of selectedToolIds) {
    await openModule(toolId);
  }
  setIsSelectionMode(false);
  setSelectedToolIds(new Set());
};

// 批量停止
const handleStopAll = async () => {
  for (const toolId of selectedToolIds) {
    await stopModule(toolId);
  }
};

// 批量卸载
const handleUninstallAll = async () => {
  if (confirm(`确定要卸载 ${selectedToolIds.size} 个工具吗？`)) {
    for (const toolId of selectedToolIds) {
      await uninstallModule(toolId);
    }
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }
};
```

然后在 JSX 中：
```tsx
<ModuleToolbar
  isSelectionMode={isSelectionMode}
  onToggleSelectionMode={() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedToolIds(new Set());
  }}
/>

<ModuleGrid
  isSelectionMode={isSelectionMode}
  selectedToolIds={selectedToolIds}
  onSelect={handleSelect}
/>

<BatchActionsBar
  selectedCount={selectedToolIds.size}
  onStartAll={handleStartAll}
  onStopAll={handleStopAll}
  onUninstallAll={handleUninstallAll}
  onCancel={() => {
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }}
  hasHttpService={检查是否有 http-service 工具}
/>
```

---

### 拖拽添加集成（必需）

```typescript
// module-center/index.tsx 需要添加：

const handleDropFiles = async (files: FileList) => {
  const file = files[0];
  if (!file) return;

  // 检查是文件还是文件夹
  // ... 处理逻辑
};

const handleBrowseFolder = async () => {
  const result = await window.ipc.invoke('dialog:openDirectory');
  // ... 处理选择的文件夹
};
```

然后在空状态时显示 DropZone：
```tsx
{sortedInstalled.length === 0 && (
  <DropZone
    onDrop={handleDropFiles}
    onBrowse={handleBrowseFolder}
  />
)}
```

---

## 🚀 实施建议

### 方案 A：快速集成当前组件（推荐）

**工作量**：0.5-1 天

1. 集成批量操作（0.5天）
2. 集成拖拽添加（0.5天）

完成后提交并测试。

---

### 方案 B：继续实施剩余功能

**工作量**：8-12 天

按顺序实施：
1. 集成当前组件（1天）
2. manifest 验证优化（1-2天）
3. 安装重试机制（2-3天）
4. 工具更新检查（2-3天）
5. 分离安装和依赖（3天）

---

### 方案 C：分阶段发布

**第一阶段**（当前）：
- ✅ P0 全部 + P1 部分组件

**第二阶段**（1周后）：
- 集成现有组件 + 验证优化

**第三阶段**（2周后）：
- 更新检查 + 安装重试

**第四阶段**（3周后）：
- 分离安装和依赖

---

## 💭 我的建议

**当前状态很好**：
- P0 核心体验已完成（命令面板 + 托盘）
- 简化配置已生效（降低门槛）
- 基础 UI 组件已就绪

**建议**：
1. **快速集成当前组件**（1天）
   - 让批量操作和拖拽添加功能可用
   - 提交并测试

2. **发布内部测试版**
   - 验证核心体验
   - 收集真实反馈

3. **根据反馈决定后续**
   - 如果用户强烈需要更新检查 → 优先实施
   - 如果稳定性问题多 → 转向 P2 技术优化
   - 如果体验满意 → 暂缓 P1，开始生态建设

---

**你的决定？**

A. 快速集成当前组件（1天）
B. 继续实施全部 P1（8-12天）
C. 暂停，先测试当前功能
