# 二进制工具架构 - 最终设计

> **基于 GitOps 的官方工具分发 + 用户本地工具管理**

---

## 核心架构

### 两种工具类型

| 类型 | 来源 | 安装方式 | 更新方式 |
|------|------|---------|---------|
| **官方工具** | Git 仓库 (`resources/tools/`) | 从插件市场安装（Git + jsDelivr CDN） | 手动检查 + 一键更新 |
| **本地工具** | 用户本地文件 | "添加本地工具"按钮 | 用户自己管理 |

---

## 官方工具发布流程

### 1. 目录结构

```
packages/client/
├── plugins/                    # 官方插件源码
│   ├── uiautodev/              # 源码插件
│   │   ├── manifest.json
│   │   ├── dist/
│   │   └── backend/
│   └── cc-switch/              # 二进制工具（待创建）
│       ├── manifest.json
│       └── bin/
│           ├── windows/
│           │   └── cc-switch.exe
│           ├── darwin/
│           │   └── cc-switch
│           └── linux/
│               └── cc-switch
│
└── resources/tools/            # 打包后的发布物
    ├── index.json              # 工具索引
    ├── uiautodev.zip           # 源码插件（打包）
    └── cc-switch.zip           # 二进制工具（打包）
```

### 2. ZIP 包结构

**源码插件（uiautodev.zip）**：
```
uiautodev.zip
├── manifest.json
├── index.html
├── dist/
├── backend/
└── requirements.txt
```

**二进制工具（cc-switch.zip）**：
```
cc-switch.zip
├── manifest.json
└── bin/
    ├── windows/
    │   └── cc-switch.exe
    ├── darwin/
    │   └── cc-switch
    └── linux/
        └── cc-switch
```

### 3. manifest.json（二进制工具）

```json
{
  "id": "com.booltox.cc-switch",
  "version": "3.0.0",
  "name": "CC Switch",
  "description": "API 配置切换工具",
  "runtime": {
    "type": "binary",
    "command": "bin/{{platform}}/cc-switch{{ext}}"
  }
}
```

**安装时替换**：
- Windows: `bin/windows/cc-switch.exe`
- macOS: `bin/darwin/cc-switch`
- Linux: `bin/linux/cc-switch`

---

## GitOps 下载流程

### URL 结构

**生产环境**（jsDelivr CDN）：
```
https://cdn.jsdelivr.net/gh/ByteTrue/BoolTox@main/packages/client/resources/tools/index.json
https://cdn.jsdelivr.net/gh/ByteTrue/BoolTox@main/packages/client/resources/tools/cc-switch.zip
```

**开发环境**（本地文件）：
```
E:\Code\TS\BoolTox\booltox-web\packages\client\resources\tools\index.json
```

### 安装流程

```
Client 启动
  ↓
1. 读取 resources/tools/index.json
   → 获取所有官方工具列表
  ↓
2. 用户在"插件市场" Tab 选择工具
  ↓
3. 点击"安装"
  ↓
4. 下载 ZIP（通过 jsDelivr CDN）
  ↓
5. 解压到 $userData/plugins/{id}/
  ↓
6. 替换 manifest 中的 {{platform}} 和 {{ext}}
  ↓
7. 完成安装
```

---

## 更新流程

### 检查更新

```
用户点击"检查更新"按钮
  ↓
1. 读取 resources/tools/index.json
  ↓
2. 对比：
   - 本地版本：$userData/plugins/{id}/manifest.json
   - 远程版本：index.json 中的 version
  ↓
3. 如果远程版本 > 本地版本
   → 显示"有新版本"徽章
```

### 一键更新

```
用户点击"更新"按钮
  ↓
1. 下载新版本 ZIP
  ↓
2. 停止旧版本（如果正在运行）
  ↓
3. 备份旧版本（可选）
  ↓
4. 删除旧版本
  ↓
5. 解压新版本
  ↓
6. 启动新版本
  ↓
7. 完成更新
```

---

## 待实现的功能

### Phase 1: 打包脚本（支持二进制）

创建：`scripts/package-tool.mjs`

功能：
- 支持源码插件（现有逻辑）
- 支持二进制工具（跨平台 ZIP）
- 输出到 `resources/tools/`
- 更新 `resources/tools/index.json`

### Phase 2: 检查更新

在 `PluginInstallerService` 中添加：
```typescript
async checkUpdate(pluginId: string): Promise<string | null>
```

### Phase 3: 一键更新

在 `PluginInstallerService` 中添加：
```typescript
async updatePlugin(pluginId: string): Promise<void>
```

### Phase 4: UI 集成

- 在插件卡片上显示"有新版本"徽章
- 添加"更新"按钮
- 添加"检查更新"全局按钮

---

## 今天完成的功能

✅ **本地工具添加**（完全可用）
- UI 按钮："添加本地工具"
- 文件选择对话框
- 自动生成 manifest
- 一键启动

✅ **架构清理**
- 统一 Monorepo
- GitOps 路径更新
- 5 个插件正常加载

---

## 下一步

1. **立即测试**：本地添加功能
2. **后续实现**：官方工具打包和更新系统

---

**维护者**: BoolTox Team
**更新时间**: 2025-12-11
