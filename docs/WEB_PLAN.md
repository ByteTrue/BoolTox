# BoolTox Web 开发计划

> 最后更新：2025-12-15
>
> Web 端定位和实施计划

---

## 目录

- [1. 产品定位](#1-产品定位)
- [2. 架构设计](#2-架构设计)
- [3. 当前实现分析](#3-当前实现分析)
- [4. 待实现功能](#4-待实现功能)
- [5. 实施路线图](#5-实施路线图)

---

## 1. 产品定位

### 1.1 核心定位

**BoolTox Web ≠ 主产品**

```
Client = 核心产品（80% 精力）
Web = 营销页面（20% 精力）
```

**Web 的唯一职责：**

1. **工具展示**（Showcase）- 让潜在用户看到有哪些工具
2. **SEO 优化** - 用户搜索"yt-dlp GUI"能找到 BoolTox
3. **开发者文档** - 教开发者如何适配 BoolTox

**Web 不做：**
- ❌ 在线运行工具（浏览器沙箱限制太多）
- ❌ 复杂的 SaaS 平台（用户系统、订阅计费）
- ❌ 工具开发 IDE（过度设计）

### 1.2 战略意义

**当前阶段（Phase 1-2）：Web 不是优先级**

理由：
- 产品面向内部（公司同事），不需要对外宣传
- Client 功能还在完善，没有足够的工具生态
- 开发资源有限，应集中在核心产品

**未来阶段（Phase 3-4）：Web 是增长引擎**

当满足以下条件时，Web 才值得投入：
- ✅ Client 功能稳定（多仓库支持、CLI 工具完成）
- ✅ 工具生态初具规模（至少 20 个官方工具）
- ✅ B2C 需求验证成功（有外部用户下载）

### 1.3 和 Client 的关系

**用户旅程：**

```
1. 用户搜索"Python 工具一键安装"
   ↓
2. 进入 booltox.com（Web）
   ↓
3. 浏览工具目录
   ↓
4. 点击"Install with BoolTox"
   ↓
5. 下载 Client
   ↓
6. 自动安装工具
```

→ **Web 是引流入口，Client 是核心产品**

---

## 2. 架构设计

### 2.1 技术栈

| 层级 | 技术 | 理由 |
|------|------|------|
| 框架 | Next.js 15 | SSR + SSG，SEO 友好 |
| 渲染模式 | SSG（静态生成） | 性能最优，部署简单 |
| 样式 | TailwindCSS | 快速开发 |
| 部署 | Vercel / Cloudflare Pages | 免费，全球 CDN |
| 数据源 | GitHub API | 直接读取工具仓库 |

**为什么选择 SSG（静态生成）？**

```typescript
// 构建时生成所有页面
export async function generateStaticParams() {
  const tools = await fetchAllTools();
  return tools.map(tool => ({ id: tool.id }));
}

// 无需数据库，无需服务器
```

优势：
- ✅ 构建后纯静态文件，部署简单
- ✅ 性能极佳（CDN 缓存）
- ✅ 无服务器成本
- ✅ SEO 优化

### 2.2 页面结构

```
booltox.com
  ├── /                         # 首页（产品介绍）
  ├── /tools                    # 工具目录
  │   ├── /tools/[id]           # 工具详情页
  │   └── /tools/category/[name]# 分类页
  ├── /docs                     # 文档
  │   ├── /docs/getting-started # 快速开始
  │   ├── /docs/developer-guide # 开发者指南
  │   └── /docs/manifest-spec   # Manifest 规范
  ├── /download                 # 下载 Client
  └── /blog                     # 博客（可选）
```

### 2.3 数据流

**工具数据来源：**

```
GitHub API
  ↓
获取工具仓库索引（index.json）
  ↓
并发获取每个工具的 metadata.json
  ↓
构建时生成静态页面
  ↓
部署到 CDN
```

**无需数据库：**
- 所有数据来自 Git 仓库
- 构建时抓取，生成静态文件
- 定时触发重新构建（GitHub Actions）

---

## 3. 当前实现分析

### 3.1 功能完成度

| 功能 | 状态 | 说明 |
|------|------|------|
| 基础页面结构 | ✅ 完成 | Next.js 项目已初始化 |
| 首页 | ⚠️ 占位 | 只有简单的介绍 |
| 工具目录 | ❌ 缺失 | 核心功能未实现 |
| 工具详情页 | ❌ 缺失 | 需要展示 manifest 信息 |
| 开发者文档 | ❌ 缺失 | 如何适配 BoolTox |
| 下载页面 | ⚠️ 简单 | 只有下载链接 |

### 3.2 现有代码

**位置：**`packages/web/`

**当前问题：**
- 页面内容空洞，缺少实际功能
- 没有从 Git 仓库读取工具数据
- 没有 SEO 优化
- 没有开发者文档

---

## 4. 待实现功能

### 4.1 工具目录页面（核心功能）

#### 4.1.1 数据获取

**在构建时获取工具列表：**

```typescript
// app/tools/page.tsx
export async function generateStaticParams() {
  // 从 GitHub API 获取工具列表
  const response = await fetch(
    'https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/resources/tools/index.json'
  );
  const index = await response.json();

  // 获取每个工具的 metadata
  const tools = await Promise.all(
    index.plugins.map(async (item) => {
      const metadataUrl = `https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/resources/tools/${item.metadataFile}`;
      const res = await fetch(metadataUrl);
      return res.json();
    })
  );

  return tools;
}
```

#### 4.1.2 工具卡片

**设计要点：**

```tsx
function ToolCard({ tool }: { tool: ToolRegistryEntry }) {
  return (
    <div className="card">
      {/* 工具图标 */}
      <img src={tool.icon || '/default-icon.png'} alt={tool.name} />

      {/* 工具信息 */}
      <h3>{tool.name}</h3>
      <p className="text-sm text-gray-500">{tool.description}</p>

      {/* 标签 */}
      <div className="tags">
        {tool.keywords.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {/* 安装按钮 */}
      <a
        href={`booltox://install/${tool.gitPath}`}
        className="btn-primary"
      >
        Install with BoolTox
      </a>

      {/* 备用：下载 Client */}
      {!hasClient && (
        <a href="/download" className="btn-secondary">
          Download BoolTox Client
        </a>
      )}
    </div>
  );
}
```

#### 4.1.3 筛选和搜索

```tsx
function ToolsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || tool.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* 搜索框 */}
      <input
        type="search"
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 分类筛选 */}
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="media">Media Tools</option>
        <option value="dev">Developer Tools</option>
        <option value="system">System Tools</option>
      </select>

      {/* 工具网格 */}
      <div className="grid grid-cols-3 gap-4">
        {filteredTools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
```

### 4.2 工具详情页

**URL 结构：**`/tools/[id]`

**页面内容：**

```tsx
// app/tools/[id]/page.tsx
export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const tool = getToolById(params.id);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="header">
        <img src={tool.icon} alt={tool.name} className="w-16 h-16" />
        <h1>{tool.name}</h1>
        <p className="text-gray-500">{tool.description}</p>
      </div>

      {/* 安装按钮 */}
      <div className="actions">
        <a href={`booltox://install/${tool.gitPath}`} className="btn-primary">
          Install with BoolTox
        </a>
        <a href={tool.homepage} className="btn-secondary">
          View on GitHub
        </a>
      </div>

      {/* 截图轮播 */}
      {tool.screenshots && (
        <div className="screenshots">
          {tool.screenshots.map(url => (
            <img key={url} src={url} alt="Screenshot" />
          ))}
        </div>
      )}

      {/* 详细信息 */}
      <div className="info">
        <h2>Information</h2>
        <dl>
          <dt>Version</dt>
          <dd>{tool.version}</dd>

          <dt>Author</dt>
          <dd>{tool.author}</dd>

          <dt>Category</dt>
          <dd>{tool.category}</dd>

          <dt>Runtime Type</dt>
          <dd>{tool.runtime.type}</dd>
        </dl>
      </div>

      {/* README（可选） */}
      {tool.readme && (
        <div className="readme">
          <h2>About</h2>
          <Markdown>{tool.readme}</Markdown>
        </div>
      )}
    </div>
  );
}
```

### 4.3 开发者文档

**结构：**

```
/docs
  ├── getting-started.md        # 快速开始
  ├── developer-guide.md        # 开发者指南
  │   ├── 1. 创建工具
  │   ├── 2. 编写 manifest.json
  │   ├── 3. 使用 CLI 工具
  │   └── 4. 发布到仓库
  ├── manifest-spec.md          # Manifest 规范
  │   ├── 基础字段
  │   ├── runtime 配置
  │   └── 示例
  └── repository-setup.md       # 搭建工具仓库
      ├── 公司内部 GitLab
      └── 个人 GitHub
```

**核心文档：`developer-guide.md`**

```markdown
# 开发者指南

## 快速开始

### 1. 安装 CLI 工具

```bash
npm install -g @booltox/cli
```

### 2. 为现有项目生成 manifest.json

```bash
cd your-project
booltox init
```

### 3. 推送到 Git 仓库

```bash
git add manifest.json
git commit -m "feat: 添加 BoolTox 支持"
git push
```

### 4. 在 BoolTox Client 中添加仓库

打开 BoolTox Client → 设置 → 仓库管理 → 添加仓库

## Manifest 规范

详见 [Manifest Spec](./manifest-spec.md)

## 示例工具

查看官方仓库的示例：
- [Python HTTP Service](https://github.com/ByteTrue/booltox-plugins/tree/main/backend-demo)
- [Python Standalone](https://github.com/ByteTrue/booltox-plugins/tree/main/python-standalone-demo)
- [Node.js HTTP Service](https://github.com/ByteTrue/booltox-plugins/tree/main/backend-node-demo)
```

### 4.4 首页优化

**核心信息（首屏）：**

1. **Hero Section**：一句话说清楚产品价值
   ```
   让 Python/Node.js 工具像双击 exe 一样简单
   支持任意 Git 仓库作为工具来源
   ```

2. **核心功能展示**（3 个卡片）：
   - 🚀 一键安装：自动配置依赖环境
   - 🔗 去中心化：支持任意 Git 仓库
   - 🏢 企业友好：私有 GitLab 支持

3. **使用场景**（2 列）：
   - 公司内部：快速分发内部工具
   - 开源工具：降低安装门槛

4. **CTA（Call to Action）**：
   - 主按钮：Download for Windows/macOS/Linux
   - 次按钮：Browse Tools

### 4.5 SEO 优化

**关键措施：**

1. **Meta 标签**：
   ```tsx
   export const metadata = {
     title: 'BoolTox - One-Click Installer for Python/Node.js Tools',
     description: 'Install Python and Node.js tools with one click. No need to configure environments. Supports any Git repository.',
     keywords: ['python tools', 'nodejs tools', 'one-click installer', 'developer tools'],
     openGraph: {
       title: 'BoolTox - One-Click Installer',
       description: 'Install Python/Node.js tools with one click',
       images: ['/og-image.png'],
     },
   };
   ```

2. **结构化数据**（Schema.org）：
   ```tsx
   <script type="application/ld+json">
   {JSON.stringify({
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "BoolTox",
     "applicationCategory": "DeveloperApplication",
     "operatingSystem": "Windows, macOS, Linux",
     "offers": {
       "@type": "Offer",
       "price": "0",
       "priceCurrency": "USD"
     }
   })}
   </script>
   ```

3. **sitemap.xml**：自动生成所有工具页面的 sitemap

4. **robots.txt**：允许所有搜索引擎抓取

---

## 5. 实施路线图

### Phase 0：暂缓 Web 开发（当前阶段）

**理由：**
- Client 功能还在完善（多仓库支持、CLI 工具）
- 工具生态尚未建立（官方工具 < 10 个）
- 面向内部，暂不需要对外宣传

**何时启动 Web 开发？**

满足以下条件之一：
1. Client 功能稳定，开始对外推广
2. 工具生态初具规模（至少 20 个官方工具）
3. 决定做 B2C，需要引流

### Phase 1：最小化 MVP（Week 1-2，未来）

**目标：上线一个能用的展示页面**

| 任务 | 工作量 |
|------|--------|
| 首页优化 | 1 天 |
| 工具目录页（基础版） | 2 天 |
| 工具详情页 | 1 天 |
| 下载页面优化 | 0.5 天 |
| SEO 基础优化 | 0.5 天 |

**验收标准：**
- ✅ 首页能清晰传达产品价值
- ✅ 工具目录能展示所有官方工具
- ✅ 搜索引擎能正常抓取
- ✅ 用户能下载 Client

### Phase 2：功能完善（Week 3-4，未来）

**目标：提升用户体验**

| 任务 | 工作量 |
|------|--------|
| 搜索和筛选功能 | 1 天 |
| 分类页面 | 1 天 |
| 开发者文档（核心） | 2 天 |
| Manifest 规范文档 | 1 天 |
| Blog 系统（可选） | 2 天 |

**验收标准：**
- ✅ 用户能快速找到需要的工具
- ✅ 开发者能看懂如何适配 BoolTox
- ✅ 搜索流量增长

### Phase 3：生态建设（持续）

**目标：内容营销 + SEO**

| 任务 | 频率 |
|------|------|
| 发布新工具介绍 | 每周 1-2 个 |
| 写技术博客 | 每月 2-3 篇 |
| 优化 SEO | 持续 |
| 收集用户反馈 | 持续 |

---

## 附录

### A. 技术栈详细说明

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.x | 框架 |
| React | 19.x | UI 库 |
| TypeScript | 5.x | 类型安全 |
| TailwindCSS | 3.x | 样式 |
| MDX | 3.x | 文档渲染 |
| Sharp | 0.33.x | 图片优化 |

### B. 部署方案

**推荐：Vercel（免费版足够）**

优势：
- ✅ Next.js 官方支持，零配置
- ✅ 全球 CDN，速度快
- ✅ 自动 HTTPS
- ✅ 免费版额度充足

**备选：Cloudflare Pages**

优势：
- ✅ 免费无限带宽
- ✅ 构建速度快
- ✅ 国内访问友好

**自动部署流程：**

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - 'packages/web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm --filter @booltox/web build
      - uses: vercel/action@v1
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
```

### C. 内容更新策略

**工具列表更新：**

- 构建时从 GitHub API 抓取
- 每次 Git push 到工具仓库时触发重新构建（GitHub Webhook）
- 或定时构建（每天一次）

**手动触发构建：**

```bash
# Vercel CLI
vercel deploy --prod

# 或通过 Vercel 后台触发
```

### D. 分析和监控

**推荐工具：**

1. **Google Analytics 4**（免费）
   - 页面访问量
   - 用户行为分析
   - 转化率（下载 Client）

2. **Vercel Analytics**（免费）
   - Web Vitals（性能指标）
   - 真实用户数据

3. **Google Search Console**（免费）
   - SEO 表现
   - 搜索关键词
   - 索引状态

### E. 关键指标（KPI）

**Phase 1：**
- 页面访问量（PV）
- 独立访客（UV）
- Client 下载量

**Phase 2：**
- 搜索流量占比
- 平均停留时间
- 跳出率

**Phase 3：**
- 自然搜索排名（目标关键词 Top 10）
- 回访率
- 转化率（访问 → 下载）

---

## 总结

### 当前状态

- ⏸️ **Web 开发暂缓**，优先完善 Client
- 📋 **计划已制定**，等待时机启动

### 何时启动？

当满足以下条件之一：
1. ✅ Client 功能稳定（多仓库 + CLI 完成）
2. ✅ 工具生态初具规模（20+ 工具）
3. ✅ 决定做 B2C，需要对外推广

### 启动信号

- 公司内部推广成功（10+ 同事使用）
- 开始适配开源工具（B2C 验证）
- 收到外部用户询问

### 开发优先级

```
1. Client 多仓库支持（P0）
2. CLI 工具（P0）
3. 内部推广和迭代（P0）
4. Web MVP（P1，未来）
5. Web 功能完善（P2，未来）
```

---

**文档维护者：**
根据讨论整理，最后更新 2025-12-15

**相关文档：**
- [Client 开发计划](./CLIENT_PLAN.md)
- [项目架构文档](./CLAUDE.md)
