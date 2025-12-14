# GitOps 工具安装方案实施文档

> 创建时间：2025-12-15

---

## 🎯 目标

实现"git push 即发布"的工具安装流程：
- 开发者：推送代码到 booltox-plugins → 自动生成 index.json → 完成
- 用户：点击安装 → 从 Git 仓库下载源码 → 解压 → 运行

---

## 📦 实施步骤

### 步骤 1：扩展 GitOpsService ✅

添加方法：
```typescript
/**
 * 下载工具源码（从 Git tarball）
 * @param toolPath - 工具在仓库中的路径（如 'uiautodev'）
 * @param targetDir - 目标目录（如 '~/.booltox/tools/com.booltox.uiautodev'）
 */
async downloadToolSource(toolPath: string, targetDir: string): Promise<void>
```

支持：
- ✅ GitHub 公开/私有仓库
- ✅ GitLab 公开/私有仓库
- ✅ 私有化 GitLab（自定义 baseUrl）

### 步骤 2：修改 ToolInstaller

```typescript
async installTool(entry: ToolRegistryEntry, ...): Promise<string> {
  // 优先使用 GitOps 下载（如果有 gitPath）
  if (entry.gitPath && !entry.downloadUrl) {
    return await this.installFromGitOps(entry, onProgress, window);
  }

  // 降级到 .zip 下载（兼容旧工具）
  if (entry.downloadUrl) {
    return await this.installFromZip(entry, onProgress, window);
  }

  throw new Error('工具缺少安装源');
}
```

### 步骤 3：更新 index.json 格式

**新格式**：
```json
{
  "tools": [
    {
      "id": "com.booltox.uiautodev",
      "name": "UI Auto Dev",
      "version": "0.1.0",
      "gitPath": "uiautodev",  // 工具在仓库中的路径
      "gitRepo": {             // Git 仓库信息（可选，默认使用配置）
        "owner": "ByteTrue",
        "repo": "booltox-plugins",
        "branch": "main"
      }
    }
  ]
}
```

**兼容性**：
- 如果有 `downloadUrl`，使用 .zip 下载（兼容旧工具）
- 如果没有 `downloadUrl` 但有 `gitPath`，使用 GitOps 下载

### 步骤 4：私有化 GitLab 配置

用户可以在设置页配置私有仓库：

```typescript
// 设置页
const pluginRepoConfig = {
  provider: 'gitlab',
  baseUrl: 'https://gitlab.company.com',
  owner: 'my-team',
  repo: 'internal-tools',
  branch: 'main',
  token: 'glpat-xxxxxxxxxxxx',
};

// 保存到配置
await window.gitOps.updateConfig(pluginRepoConfig);
```

---

## 🔧 技术细节

### GitHub Tarball API

```bash
# 请求
GET https://api.github.com/repos/ByteTrue/booltox-plugins/tarball/main
Authorization: token ghp_xxx (可选)

# 返回
Content-Type: application/x-gzip
<tarball data>

# Tarball 内部结构
ByteTrue-booltox-plugins-{commit}/
├── uiautodev/
│   ├── manifest.json
│   ├── main.py
│   └── ...
└── README.md
```

### GitLab Archive API

```bash
# 请求
GET https://gitlab.com/api/v4/projects/ByteTrue%2Fbooltox-plugins/repository/archive.tar.gz?sha=main
PRIVATE-TOKEN: glpat-xxx (可选)

# 返回
Content-Type: application/x-tar
<tarball data>

# Tarball 内部结构
booltox-plugins-main-{commit}/
├── uiautodev/
│   ├── manifest.json
│   ├── main.py
│   └── ...
└── README.md
```

### 解压策略

```typescript
import tar from 'tar';

// 只提取 uiautodev/ 目录
await tar.extract({
  buffer: tarballBuffer,
  cwd: tempDir,
  filter: (path) => {
    // path 格式：'ByteTrue-booltox-plugins-abc123/uiautodev/main.py'
    const parts = path.split('/');
    return parts[1] === 'uiautodev'; // 只提取 uiautodev/
  },
  strip: 2, // 去掉前两层：'ByteTrue-booltox-plugins-abc123/uiautodev/' → './'
});

// 现在 tempDir/ 下直接是 main.py, manifest.json 等
// 移动到目标目录
await fs.rename(tempDir, targetDir);
```

---

## 🧪 测试清单

- [ ] GitHub 公开仓库下载（booltox-plugins）
- [ ] GitLab 公开仓库下载（模拟）
- [ ] 私有化 GitLab 下载（需要真实环境）
- [ ] 下载进度显示
- [ ] 错误处理（网络失败、认证失败）
- [ ] 工具安装后能正常启动

---

## 📝 迁移指南

### 现有 .zip 工具迁移

如果某个工具已经发布为 .zip（有 Release），可以保留 `downloadUrl`：

```json
{
  "id": "com.booltox.legacy-tool",
  "downloadUrl": "https://github.com/xxx/releases/download/v1.0.0/tool.zip", // 保留
  "gitPath": "legacy-tool" // 可选，用于未来更新
}
```

客户端会优先使用 `downloadUrl`（兼容）。

---

## 🎯 最终效果

**开发者**：
```bash
cd booltox-plugins
# 开发新工具
mkdir my-tool && cd my-tool
# ... 写代码

# 发布
git add .
git commit -m "feat: 添加新工具 my-tool"
git push

# 更新注册表
node scripts/generate-index.js
git add index.json
git commit -m "chore: 更新工具注册表"
git push

# 完成！用户立即能在工具商店看到新工具
```

**用户**：
```
打开 BoolTox 工具商店 →
看到 "My Tool" →
点击"安装" →
（后台）从 GitHub 下载源码 tarball →
（后台）解压到 ~/.booltox/tools/com.booltox.my-tool/ →
点击"启动" →
工具运行！
```

---

**现在开始实施代码！**
