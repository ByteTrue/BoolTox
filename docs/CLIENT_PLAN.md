# BoolTox Client 开发计划

> 最后更新：2025-12-15
>
> 本文档整合产品定位分析、架构设计和实施计划
>
> **Linus 式简化原则**：消除过度设计，只解决真实问题

---

## 变更记录

**2025-12-15 - Linus 式简化**
1. ✅ **简化数据结构**：移除 `addedAt` 和 `lastSyncAt` 等"以防万一"的字段
2. ✅ **重新设计 ID 冲突**：允许同 ID 工具共存（通过 `repositoryId:toolId` 区分）
3. ✅ **简化 CLI 工具**：只做模板生成，不做复杂的语言检测和推断
4. ✅ **删除 Phase 4**：标记为"待定功能"，等用户真实反馈再做

**核心原则**：
> "Theory and practice sometimes clash. Theory loses. Every single time."
>
> 先做最简单能用的版本，用户反馈 > 理论假设

---

## 目录

- [1. 产品定位](#1-产品定位)
- [2. 核心价值](#2-核心价值)
- [3. 架构设计](#3-架构设计)
- [4. 当前实现分析](#4-当前实现分析)
- [5. 待实现功能](#5-待实现功能)
- [6. 实施路线图](#6-实施路线图)

---

## 1. 产品定位

### 1.1 产品本质

**BoolTox Client = Git-based 应用启动器 + 依赖管理器**

一句话描述：
> 让 Python/Node.js 工具像双击 exe 一样简单，支持任意 Git 仓库作为工具来源

### 1.2 合并 B2B 和 B2C

**核心洞察：**
内部工具（B2B）和开源工具（B2C）本质上没有区别，都是"Git 仓库 + manifest.json"。

```
工具 = Git 仓库 + manifest.json + 自动依赖安装
```

**统一的用户体验：**

```bash
# 公司内部工具（私有 GitLab）
booltox://install/git@company-gitlab.com:tools/image-compressor

# 开源工具（公开 GitHub）
booltox://install/github.com/yt-dlp/yt-dlp

# 朋友分享的工具
booltox://install/github.com/friend/cool-tool
```

### 1.3 目标用户

**主要用户（Phase 1）：**
- 公司内部员工（不懂技术，需要用内部工具）
- IT 管理员（需要快速分发工具，减少支持成本）

**次要用户（Phase 2）：**
- 非技术人员（想用开源工具，但不会安装环境）
- 开发者（懒得配置 Python/Node.js 环境）

### 1.4 竞品对比

| 产品 | 定位 | 优势 | 劣势 |
|------|------|------|------|
| **Homebrew** | macOS 包管理器 | 生态成熟 | 只支持二进制，不管理源码依赖 |
| **Docker** | 容器化平台 | 隔离性好 | 门槛高，体积大 |
| **BoolTox** | 源码工具启动器 | 去中心化，自动依赖管理 | 生态刚起步 |

**BoolTox 的差异化：**
1. ✅ **去中心化**：任何 Git 仓库都能作为工具源
2. ✅ **源码 + 依赖管理**：自动创建 venv/node_modules
3. ✅ **企业友好**：支持私有 GitLab，无需上传到中心服务器
4. ✅ **零配置**：用户不需要懂命令行

---

## 2. 核心价值

### 2.1 场景 1：公司内部工具分发（B2B）

**传统流程（痛点）：**

```
同事：能不能给我用一下那个图片压缩工具？
你：好的，文档在这里（发 Confluence 链接）
同事：装了 Python 但是报错...
你：你用的哪个版本？requirements.txt 装了吗？
同事：啥是 requirements.txt？
你：...（开始远程调试）

→ IT 支持时间浪费，效率低下
```

**用 BoolTox（解决方案）：**

```
你：点这个链接 booltox://install/git@company-gitlab.com:tools/image-compressor
同事：（点击）→ 自动下载 → 自动安装依赖 → 完成

→ 节省 IT 支持时间 = 企业愿意付费的理由
```

### 2.2 场景 2：推广开源工具（B2B + B2C）

**传统流程（痛点）：**

```
你：这个工具很好用：https://github.com/xxx/tool
同事：（打开 GitHub）→ 看到一堆命令 → 放弃

→ 好工具因为安装门槛高而无法推广
```

**用 BoolTox（解决方案）：**

```
你：booltox://install/github.com/xxx/tool
同事：（点击）→ 自动安装 → 立即可用

→ 降低开源工具的使用门槛
```

### 2.3 场景 3：开源作者维护减负（B2C）

**开源作者的痛点：**
- 用户不会安装（issue 全是"如何安装？""装不上怎么办？"）
- 需要为每个平台打包（Windows installer、macOS dmg、Linux AppImage）
- 维护成本高

**用 BoolTox（解决方案）：**

```markdown
## 安装

### 一键安装（推荐）
[![Install with BoolTox](badge)](booltox://install/github.com/xxx/tool)

### 传统方式（高级用户）
```bash
git clone ...
python -m venv venv
pip install -r requirements.txt
```

→ 开源作者愿意加这个链接 = 工具生态增长
```

---

## 3. 架构设计

### 3.1 核心理念：去中心化

**错误的架构（中心化）：**

```
BoolTox 服务器
  ├── 审核工具
  ├── 存储工具包
  └── 管理更新

→ 需要维护服务器
→ 需要审核流程
→ 存在单点故障
```

**正确的架构（去中心化）：**

```
BoolTox Client
  ├── 配置仓库列表（本地）
  ├── 从 Git 仓库下载（直连）
  └── 自动依赖管理（本地）

→ 不依赖 BoolTox 服务器
→ 不需要审核流程
→ 永久可用
```

### 3.2 数据结构：消除特殊情况

**好的架构应该消除"官方仓库"的特殊地位：**

```typescript
// 错误：官方仓库是特殊的
const OFFICIAL_REPO = { ... };  // 硬编码
const otherRepos = config.get('repos');  // 用户配置

// 正确：所有仓库平等
const allRepos = config.get('repositories');  // 包含官方和用户仓库
```

**仓库配置数据结构：**

```typescript
interface RepositoryConfig {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称（"官方""公司内部"）
  enabled: boolean;              // 是否启用
  provider: 'github' | 'gitlab'; // Git 平台
  owner: string;                 // 仓库所有者
  repo: string;                  // 仓库名
  branch: string;                // 分支名
  baseUrl?: string;              // 私有化 GitLab 地址
  token?: string;                // 访问 Token（私有仓库）
  priority: number;              // 优先级（仅用于 UI 排序，不影响安装）
}
```

### 3.3 工具下载机制

**当前实现（正确）：**

不是 `git clone`，而是下载 GitHub API tarball：

```typescript
// 1. 下载整个仓库的 tarball
const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`;
const tarballBuffer = await fetch(tarballUrl);

// 2. 解压 tarball
await tar.extract({ file: tempTarPath, cwd: tempDir });

// 3. 提取指定工具目录
const toolSourceDir = path.join(tempDir, topDir, toolPath);
await fs.rename(toolSourceDir, targetDir);
```

**为什么不用 git clone？**

| 方案 | 优点 | 缺点 |
|------|------|------|
| `git clone` | 完整 Git 历史 | 需要 Git 客户端，体积大，慢 |
| **下载 tarball** | 不需要 Git，体积小，快 | 无 Git 历史（工具不需要） |

**开发模式特殊处理（符号链接）：**

```typescript
// 开发模式：创建符号链接，修改源码立即生效
if (!app.isPackaged) {
  const localPluginPath = path.resolve(process.cwd(), '..', 'booltox-plugins', toolPath);
  if (fsSync.existsSync(localPluginPath)) {
    await fs.symlink(localPluginPath, targetDir, 'dir');
    return;
  }
}
```

### 3.4 工具类型

BoolTox 支持 4 种工具类型：

| 类型 | 描述 | 启动方式 | 示例 |
|------|------|----------|------|
| **http-service** | 后端服务 + 浏览器前端 | 启动进程 → 健康检查 → 打开浏览器 | 系统监控工具 |
| **standalone** | 独立 GUI 应用 | 启动进程（自带窗口） | 番茄钟计时器 |
| **cli** | 命令行工具 | 在终端中启动 | 文件转换工具 |
| **binary** | 二进制可执行文件 | 直接启动 | 系统工具 |

**启动器模式（重要特性）：**

```typescript
// 工具启动后，500ms 清理状态（允许重复启动）
setTimeout(() => {
  currentState.runtime.status = 'stopped';
  this.states.delete(toolId);
}, 500);
```

→ **BoolTox 不是"工具容器"，而是"启动器"**

---

## 4. 当前实现分析

### 4.1 功能完成度

| 功能 | 状态 | 说明 |
|------|------|------|
| 工具启动 | ✅ 完成 | 支持 4 种类型 |
| 依赖管理 | ✅ 完成 | Python venv + Node.js npm |
| 进程管理 | ✅ 完成 | 启动/停止/清理进程树 |
| 开发模式 | ✅ 完成 | 符号链接 + 热更新 |
| 单仓库支持 | ✅ 完成 | 硬编码官方仓库 |
| **多仓库支持** | ❌ 缺失 | 无法配置其他仓库 |
| **CLI 工具** | ❌ 缺失 | `booltox init` 未实现 |

### 4.2 架构优点

**✅ 好的设计：**

1. **启动器模式**（[tool-runner.ts:796-806](packages/client/electron/services/tool/tool-runner.ts#L796-L806)）
   - 启动后立即清理状态
   - 允许重复启动
   - 不阻塞用户操作

2. **依赖自动安装**（[tool-runner.ts:1030-1119](packages/client/electron/services/tool/tool-runner.ts#L1030-L1119)）
   - 首次启动检测依赖
   - 显示安装窗口
   - 后续启动跳过

3. **开发模式符号链接**（[git-ops.service.ts:468-486](packages/client/electron/services/git-ops.service.ts#L468-L486)）
   - 修改源码立即生效
   - 无需重新安装

### 4.3 架构问题

**❌ 需要改进：**

1. **硬编码仓库配置**（[git-ops.service.ts:62-67](packages/client/electron/services/git-ops.service.ts#L62-L67)）
   ```typescript
   const PLUGIN_REPO_CONFIG: GitOpsConfig = {
     provider: 'github',
     owner: 'ByteTrue',
     repo: 'booltox-plugins',
     branch: 'main',
   };
   ```
   → 无法添加公司 GitLab 仓库

2. **单一工具来源**（[git-ops.service.ts:343-412](packages/client/electron/services/git-ops.service.ts#L343-L412)）
   ```typescript
   async getPluginRegistry(): Promise<PluginRegistry> {
     // 只从官方仓库加载
     const indexUrl = this.getPluginRepoUrl('plugins/index.json', false);
   }
   ```
   → 无法合并多个仓库的工具

3. **缺少仓库管理 UI**
   → 用户无法可视化配置仓库

---

## 5. 待实现功能

### 5.1 多仓库支持（优先级：P0）

#### 5.1.1 扩展配置数据结构

**新增类型定义**（`packages/shared/src/types/repository.ts`）：

```typescript
export interface RepositoryConfig {
  id: string;              // 唯一标识（UUID）
  name: string;            // 显示名称
  enabled: boolean;        // 是否启用
  provider: 'github' | 'gitlab';
  owner: string;
  repo: string;
  branch: string;
  baseUrl?: string;        // 私有化 GitLab
  token?: string;          // 私有仓库 Token
  priority: number;        // 优先级（仅用于 UI 排序）
}

export interface RepositoriesConfig {
  repositories: RepositoryConfig[];
  version: string;         // 配置版本
}
```

#### 5.1.2 修改 ConfigService

**扩展配置 Schema**（`packages/client/electron/services/config.service.ts`）：

```typescript
interface AppConfig {
  settings: { ... };
  window: { ... };
  repositories: RepositoriesConfig;  // 新增
}

// 默认配置（包含官方仓库）
defaults: {
  settings: { ... },
  window: {},
  repositories: {
    version: '1.0.0',
    repositories: [
      {
        id: 'official',
        name: '官方工具库',
        enabled: true,
        provider: 'github',
        owner: 'ByteTrue',
        repo: 'booltox-plugins',
        branch: 'main',
        priority: 0,
      }
    ]
  }
}
```

#### 5.1.3 重构 GitOpsService

**关键修改点：**

1. **移除硬编码配置**：
   ```typescript
   // 删除
   const PLUGIN_REPO_CONFIG: GitOpsConfig = { ... };

   // 改为
   private getRepositories(): RepositoryConfig[] {
     return configService
       .get('repositories', 'repositories')
       .filter(repo => repo.enabled)
       .sort((a, b) => a.priority - b.priority);
   }
   ```

2. **多仓库加载与工具唯一标识**：
   ```typescript
   async getPluginRegistry(): Promise<PluginRegistry> {
     const repos = this.getRepositories();

     // 并发从所有仓库加载
     const allPlugins = await Promise.all(
       repos.map(repo => this.getPluginsFromRepo(repo))
     );

     // 展平并标记来源（不合并同 ID 工具）
     const plugins = allPlugins.flat().map(p => ({
       ...p,
       _uniqueKey: `${p.repositoryId}:${p.id}`,  // 真实唯一标识
     }));

     return { plugins };
   }
   ```

3. **工具来源标记**：
   ```typescript
   // 每个工具标记来源仓库
   async getPluginsFromRepo(repo: RepositoryConfig): Promise<ToolWithSource[]> {
     const registry = await this.fetchRegistry(repo);

     return registry.plugins.map(p => ({
       ...p,
       repositoryId: repo.id,
       repositoryName: repo.name,
     }));
   }
   ```

4. **UI 显示区分**：
   ```typescript
   // 用户看到的工具列表：
   // - "官方/图片压缩工具"
   // - "公司内部/图片压缩工具（定制版）"

   // 两个工具可以同时安装
   // 通过 repositoryId:toolId 区分
   ```

#### 5.1.4 IPC Handlers

**新增 IPC 方法**（`packages/client/electron/ipc-registry.ts`）：

```typescript
// 获取仓库列表
ipcMain.handle('repositories:list', async () => {
  return configService.get('repositories', 'repositories');
});

// 添加仓库
ipcMain.handle('repositories:add', async (event, repo: Omit<RepositoryConfig, 'id'>) => {
  const repos = configService.get('repositories', 'repositories');

  const newRepo: RepositoryConfig = {
    ...repo,
    id: crypto.randomUUID(),
  };

  repos.push(newRepo);
  configService.set('repositories', 'repositories', repos);

  return newRepo;
});

// 更新仓库
ipcMain.handle('repositories:update', async (event, id: string, updates: Partial<RepositoryConfig>) => {
  const repos = configService.get('repositories', 'repositories');
  const index = repos.findIndex(r => r.id === id);

  if (index >= 0) {
    repos[index] = { ...repos[index], ...updates };
    configService.set('repositories', 'repositories', repos);
    return repos[index];
  }

  throw new Error(`仓库 ${id} 不存在`);
});

// 删除仓库
ipcMain.handle('repositories:delete', async (event, id: string) => {
  const repos = configService.get('repositories', 'repositories');
  const filtered = repos.filter(r => r.id !== id);
  configService.set('repositories', 'repositories', filtered);
});

// 测试仓库连接
ipcMain.handle('repositories:test', async (event, repo: RepositoryConfig) => {
  try {
    const gitOps = new GitOpsService();
    gitOps.updateConfig(repo);

    const registry = await gitOps.getPluginRegistry();

    return {
      success: true,
      pluginCount: registry.plugins.length,
      plugins: registry.plugins.map(p => ({ id: p.id, name: p.name })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
```

#### 5.1.5 前端：仓库管理页面

**新增页面**（`packages/client/src/renderer/pages/settings/repositories.tsx`）：

```tsx
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';

export function RepositoriesPage() {
  const { theme } = useTheme();
  const [repos, setRepos] = useState<RepositoryConfig[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    const list = await window.api.getRepositories();
    setRepos(list);
  };

  const handleAdd = async () => {
    const newRepo: Omit<RepositoryConfig, 'id'> = {
      name: '新仓库',
      enabled: true,
      provider: 'github',
      owner: '',
      repo: '',
      branch: 'main',
      priority: repos.length,
    };

    const added = await window.api.addRepository(newRepo);
    setRepos([...repos, added]);
    toast.success('仓库已添加');
  };

  const handleTest = async (repo: RepositoryConfig) => {
    setLoading(true);
    const result = await window.api.testRepository(repo);
    setLoading(false);

    if (result.success) {
      toast.success(`✓ 连接成功，发现 ${result.pluginCount} 个工具`);
    } else {
      toast.error(`✗ 连接失败: ${result.error}`);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<RepositoryConfig>) => {
    const updated = await window.api.updateRepository(id, updates);
    setRepos(repos.map(r => r.id === id ? updated : r));
    toast.success('仓库已更新');
  };

  const handleDelete = async (id: string) => {
    if (id === 'official') {
      toast.error('官方仓库不能删除');
      return;
    }

    if (!confirm('确定要删除这个仓库吗？')) return;

    await window.api.deleteRepository(id);
    setRepos(repos.filter(r => r.id !== id));
    toast.success('仓库已删除');
  };

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">工具仓库管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            管理多个工具仓库，支持公司内部 GitLab 和个人 GitHub
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          + 添加仓库
        </button>
      </div>

      {/* 仓库列表 */}
      <div className="space-y-4">
        {repos.map(repo => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            onTest={() => handleTest(repo)}
            onUpdate={(updates) => handleUpdate(repo.id, updates)}
            onDelete={() => handleDelete(repo.id)}
          />
        ))}
      </div>
    </div>
  );
}

// 仓库卡片组件
function RepositoryCard({ repo, onTest, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card p-4">
      {/* 仓库信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">{repo.name}</h3>
          <p className="text-sm text-gray-500">
            {repo.provider}://{repo.owner}/{repo.repo}@{repo.branch}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onTest} className="btn-secondary">
            测试连接
          </button>
          <button onClick={() => setEditing(true)} className="btn-secondary">
            编辑
          </button>
          {repo.id !== 'official' && (
            <button onClick={onDelete} className="btn-danger">
              删除
            </button>
          )}
        </div>
      </div>

      {/* 编辑表单（折叠） */}
      {editing && (
        <RepositoryEditForm
          repo={repo}
          onSave={(updates) => {
            onUpdate(updates);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
```

### 5.2 CLI 工具（优先级：P0）

#### 5.2.1 设计原则

**Linus 式最简实现：**
- ❌ 不做"智能推断"（容易出错，用户还要手动修改）
- ❌ 不做语言检测（用户自己知道用什么语言）
- ✅ 只做模板生成（最笨但最清晰的方式）
- ✅ 交互式选择 + 生成模板 + 用户填空

**为什么这样设计？**
> "Theory and practice sometimes clash. Theory loses."
>
> 复杂的推断逻辑会出错，开发者最终还是要手动修改。
> 不如直接生成最基础的模板，让开发者填空 → 运行时验证 → 报错 → 修改。

#### 5.2.2 包结构

```bash
packages/client/cli/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── index.ts              # CLI 入口
  │   ├── commands/
  │   │   ├── init.ts           # init 命令（模板生成）
  │   │   └── validate.ts       # validate 命令
  │   ├── templates/
  │   │   ├── http-service.ts   # HTTP Service 模板
  │   │   ├── standalone.ts     # Standalone 模板
  │   │   ├── cli.ts            # CLI 模板
  │   │   └── binary.ts         # Binary 模板
  │   └── utils/
  │       └── validators.ts     # 验证工具
  └── bin/
      └── booltox.js            # 可执行文件
```

#### 5.2.3 CLI 入口

**`packages/client/cli/src/index.ts`：**

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';

const program = new Command();

program
  .name('booltox')
  .description('BoolTox CLI - 工具开发助手')
  .version('1.0.0');

program
  .command('init')
  .description('生成 manifest.json 模板')
  .option('-d, --dir <path>', '项目目录', process.cwd())
  .option('--force', '强制覆盖已有的 manifest.json')
  .action(initCommand);

program
  .command('validate')
  .description('验证 manifest.json 是否正确')
  .option('-f, --file <path>', 'manifest.json 路径', './manifest.json')
  .action(validateCommand);

program.parse();
```

#### 5.2.4 init 命令实现（简化版）

**`packages/client/cli/src/commands/init.ts`：**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import { getTemplate } from '../templates';

export async function initCommand(options: { dir: string; force?: boolean }) {
  const { dir, force } = options;

  console.log(chalk.blue('🚀 BoolTox 工具初始化\n'));

  // 检查是否已有 manifest.json
  const manifestPath = path.join(dir, 'manifest.json');
  const exists = await fs.access(manifestPath).then(() => true).catch(() => false);

  if (exists && !force) {
    console.log(chalk.yellow('⚠️  manifest.json 已存在，使用 --force 覆盖'));
    return;
  }

  // 交互式选择工具类型和语言
  const answers = await prompt<{
    id: string;
    name: string;
    description: string;
    runtimeType: 'http-service' | 'standalone' | 'cli' | 'binary';
    language?: 'python' | 'node';
    port?: number;
  }>([
    {
      type: 'input',
      name: 'id',
      message: '工具 ID（如 com.company.tool-name）:',
      initial: `com.mycompany.${path.basename(dir)}`,
      validate: (val) => /^[a-z0-9.-]+$/.test(val) || '只能包含小写字母、数字、点和横线',
    },
    {
      type: 'input',
      name: 'name',
      message: '工具名称:',
      initial: path.basename(dir),
    },
    {
      type: 'input',
      name: 'description',
      message: '简短描述:',
    },
    {
      type: 'select',
      name: 'runtimeType',
      message: '工具类型:',
      choices: [
        { name: 'http-service', message: 'HTTP 服务（后端 + 浏览器前端）' },
        { name: 'standalone', message: '独立应用（自带 GUI）' },
        { name: 'cli', message: '命令行工具' },
        { name: 'binary', message: '二进制工具' },
      ],
    },
  ]);

  // 根据类型补充问题
  if (answers.runtimeType !== 'binary') {
    const langAnswers = await prompt<{ language: 'python' | 'node' }>([
      {
        type: 'select',
        name: 'language',
        message: '编程语言:',
        choices: [
          { name: 'python', message: 'Python' },
          { name: 'node', message: 'Node.js' },
        ],
      },
    ]);
    answers.language = langAnswers.language;
  }

  if (answers.runtimeType === 'http-service') {
    const portAnswers = await prompt<{ port: number }>([
      {
        type: 'number',
        name: 'port',
        message: '服务端口:',
        initial: 8000,
      },
    ]);
    answers.port = portAnswers.port;
  }

  // 生成模板
  const manifest = getTemplate(answers);

  // 写入文件
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(chalk.green('\n✓ manifest.json 已生成'));
  console.log(chalk.gray(`  路径: ${manifestPath}`));

  console.log(chalk.blue('\n📋 下一步:'));
  console.log(chalk.gray('  1. 编辑 manifest.json，填写正确的入口文件等信息'));
  console.log(chalk.gray('  2. 运行 booltox validate 验证'));
  console.log(chalk.gray('  3. git commit && git push'));
  console.log(chalk.gray('  4. 在 BoolTox Client 中添加仓库地址'));
}
```

#### 5.2.5 模板生成器

**`packages/client/cli/src/templates/index.ts`：**

```typescript
import type { ToolManifest } from '@booltox/shared';

export function getTemplate(options: {
  id: string;
  name: string;
  description: string;
  runtimeType: 'http-service' | 'standalone' | 'cli' | 'binary';
  language?: 'python' | 'node';
  port?: number;
}): ToolManifest {
  const base = {
    id: options.id,
    version: '1.0.0',
    name: options.name,
    description: options.description,
    protocol: '^2.0.0',
    author: 'Your Name',
    keywords: [],
  };

  // HTTP Service
  if (options.runtimeType === 'http-service') {
    return {
      ...base,
      runtime: {
        type: 'http-service',
        backend: {
          type: options.language!,
          entry: options.language === 'python' ? 'main.py' : 'index.js',
          requirements: options.language === 'python' ? 'requirements.txt' : undefined,
          port: options.port || 8000,
          host: '127.0.0.1',
        },
        path: '/',
        readyTimeout: 30000,
      },
    };
  }

  // Standalone
  if (options.runtimeType === 'standalone') {
    return {
      ...base,
      runtime: {
        type: 'standalone',
        entry: options.language === 'python' ? 'main.py' : 'index.js',
        requirements: options.language === 'python' ? 'requirements.txt' : undefined,
      },
    };
  }

  // CLI
  if (options.runtimeType === 'cli') {
    return {
      ...base,
      runtime: {
        type: 'cli',
        backend: {
          type: options.language!,
          entry: options.language === 'python' ? 'main.py' : 'index.js',
          requirements: options.language === 'python' ? 'requirements.txt' : undefined,
        },
        title: options.name,
        keepOpen: true,
      },
    };
  }

  // Binary
  return {
    ...base,
    runtime: {
      type: 'binary',
      command: 'tool',  // 用户需要手动修改为实际的可执行文件名
    },
  };
}
```

#### 5.2.6 打包和发布

**`packages/client/cli/package.json`：**

```json
{
  "name": "@booltox/cli",
  "version": "1.0.0",
  "description": "BoolTox CLI - 工具开发助手",
  "bin": {
    "booltox": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "prepublishOnly": "pnpm build"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "enquirer": "^2.4.1",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

**使用方式：**

```bash
# 全局安装
npm install -g @booltox/cli

# 在工具目录运行
cd my-tool
booltox init

# 验证 manifest
booltox validate
```

---

## 6. 实施路线图

### Phase 1：基础功能（Week 1-2）

**目标：让公司内部能用**

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 扩展配置数据结构 | 0.5 天 | P0 |
| 修改 ConfigService | 0.5 天 | P0 |
| 重构 GitOpsService（多仓库） | 2 天 | P0 |
| 实现 IPC handlers | 1 天 | P0 |
| 前端：仓库管理页面 | 2 天 | P0 |
| 测试：添加公司 GitLab 仓库 | 1 天 | P0 |

**验收标准：**
- ✅ 能添加公司 GitLab 仓库
- ✅ 工具列表显示多个仓库的工具
- ✅ ID 冲突按优先级处理
- ✅ 测试连接功能正常

### Phase 2：开发者工具（Week 3）

**目标：简化工具开发流程**

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 创建 CLI 包结构 | 0.5 天 | P0 |
| 实现语言检测 | 1 天 | P0 |
| 实现 manifest 推断 | 1 天 | P0 |
| 实现 init 命令 | 1 天 | P0 |
| 实现 validate 命令 | 0.5 天 | P1 |
| 编写 CLI 文档 | 0.5 天 | P1 |

**验收标准：**
- ✅ `booltox init` 能生成正确的 manifest.json
- ✅ 支持 Python 和 Node.js 项目
- ✅ 交互式问答体验良好

### Phase 3：生态建设（Week 4-6）

**目标：内部推广 + 外部试点**

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 为现有内部工具加 manifest.json | 2 天 | P0 |
| 培训同事使用 BoolTox | 1 天 | P0 |
| 收集反馈并迭代 | 持续 | P0 |
| 适配 3 个开源工具 | 3 天 | P1 |
| 发布到 Reddit/HackerNews 测试 | 1 天 | P1 |
| 分析下载数据，决定 B2C 方向 | 1 天 | P1 |

**验收标准：**
- ✅ 10 个同事日常使用
- ✅ IT 支持时间减少 > 50%
- ✅ B2C 下载量 > 100（如果做）

### Phase 4：待定功能（等用户反馈）

**Linus 的判断：**
> "这是在解决不存在的问题。真正的问题会在 Phase 1-3 中暴露出来。"

**不要过早优化：**
- ❌ 没有用户抱怨"我需要使用统计"
- ❌ 没有用户抱怨"我需要权限控制"
- ❌ 这是臆想的企业需求

**正确做法：**
1. 先完成 Phase 1-3
2. 真正在公司内部用起来
3. 收集真实用户反馈
4. 用户明确要求时再做

**可能的功能清单（仅供参考）：**

| 功能 | 状态 | 说明 |
|------|------|------|
| 使用统计 | ⏸️  等用户要求 | IT 部门查看工具使用情况 |
| 权限控制 | ⏸️  等用户要求 | 不同员工看到不同工具 |
| SSO 登录 | ⏸️  等用户要求 | 企业单点登录 |
| 私有部署文档 | ⏸️  等用户要求 | 企业自建工具仓库指南 |

**备注：**
这些功能可能永远不需要。先把基础功能做好，让用户真正用起来，再根据反馈决定。

---

## 附录

### A. 相关文件清单

**核心文件：**

| 文件 | 职责 |
|------|------|
| [git-ops.service.ts](packages/client/electron/services/git-ops.service.ts) | 工具仓库管理 |
| [tool-installer.ts](packages/client/electron/services/tool/tool-installer.ts) | 工具下载和安装 |
| [tool-manager.ts](packages/client/electron/services/tool/tool-manager.ts) | 工具加载和管理 |
| [tool-runner.ts](packages/client/electron/services/tool/tool-runner.ts) | 工具启动和进程管理 |
| [config.service.ts](packages/client/electron/services/config.service.ts) | 配置管理 |

**待创建文件：**

- `packages/shared/src/types/repository.ts`（新类型）
- `packages/client/src/renderer/pages/settings/repositories.tsx`（仓库管理页面）
- `packages/client/cli/src/index.ts`（CLI 入口）
- `packages/client/cli/src/commands/init.ts`（init 命令）
- `packages/client/cli/src/templates/index.ts`（模板生成器）

### B. 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 38 |
| 前端 | React 19 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Zustand（部分）+ Context API |
| 样式 | TailwindCSS |
| 进程管理 | Node.js child_process |
| 依赖管理 | Python venv + pip, Node.js npm |
| CLI | Commander.js + Enquirer |

### C. 关键决策记录

| 决策 | 理由 |
|------|------|
| 使用 tarball 下载而非 git clone | 不需要 Git 客户端，体积小，速度快 |
| 启动器模式（不管理工具生命周期） | 简化架构，允许重复启动 |
| 去中心化仓库配置 | 无需中心服务器，企业友好 |
| 允许同 ID 工具共存 | 通过 repositoryId:toolId 区分，用户可安装多个版本 |
| CLI 只做模板生成 | 不做智能推断，最简单最清晰，开发者自己填空 |
| Phase 4 标记为待定 | 不解决不存在的问题，等用户真实反馈 |

---

**文档维护者：**
根据讨论整理，最后更新 2025-12-15

**下一步行动：**
1. Review 本文档，确认方向
2. 开始实施 Phase 1（多仓库支持）
3. 同步更新代码和文档
