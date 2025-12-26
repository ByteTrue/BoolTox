# 品牌定制指南

BoolTox 采用 Fork 友好设计，支持团队和组织基于源码创建自有品牌版本。本指南详细介绍如何定制应用名称、图标、配色、默认工具源等，打造专属的工具平台。

---

## 使用场景

### 适合 Fork 定制的场景

- ✅ 企业内部工具平台（私有化部署）
- ✅ 团队工具集中管理（统一品牌）
- ✅ 教育机构工具分发（课程配套）
- ✅ 开源社区定制版本（特定领域）

### 不需要 Fork 的场景

- ❌ 仅使用现有功能（直接使用官方版本）
- ❌ 添加自定义工具（使用工具源机制）
- ❌ 修改 UI 主题（通过配置文件实现）

---

## 快速开始

### 1. Fork 仓库

```bash
# 在 GitHub 上 Fork ByteTrue/BoolTox 到你的组织

# 克隆到本地
git clone https://github.com/your-org/BoolTox.git
cd BoolTox
git remote add upstream https://github.com/ByteTrue/BoolTox.git
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 测试构建

```bash
pnpm dev:client
```

---

## 品牌元素定制

### 1. 应用名称和描述

**配置文件**：`packages/client/src/shared/brand-config.ts`

创建或修改：
```typescript
/**
 * 品牌配置
 * Fork 定制时修改此文件
 */
export const brandConfig = {
  // ==================== 基本信息 ====================
  /** 应用内部名称（英文，无空格） */
  appName: 'MyCompanyTools',

  /** 应用显示名称（中文） */
  displayName: '公司工具平台',

  /** 应用 ID（反向域名） */
  appId: 'com.mycompany.tools',

  /** 组织/作者 */
  author: 'MyCompany',

  /** 应用描述 */
  description: '企业内部开发工具统一管理平台',

  /** 主页 URL */
  homepage: 'https://tools.mycompany.com',

  /** 仓库 URL */
  repository: 'https://github.com/mycompany/tools',

  // ==================== 视觉样式 ====================
  /** 主题色 */
  colors: {
    primary: '#1E88E5',    // 主色调
    secondary: '#43A047',  // 辅助色
    accent: '#FF6F00',     // 强调色
  },

  // ==================== 功能开关 ====================
  features: {
    /** 是否启用自动更新 */
    autoUpdate: true,

    /** 是否启用遥测（匿名使用统计） */
    telemetry: false,

    /** 是否显示官方工具源 */
    showOfficialSource: false,
  },
};
```

### 2. 更新 package.json

**文件**：`packages/client/package.json`

```json
{
  "name": "@mycompany/tools",
  "productName": "MyCompanyTools",
  "version": "1.0.0",
  "description": "企业工具管理平台",
  "author": {
    "name": "MyCompany",
    "email": "dev@mycompany.com",
    "url": "https://mycompany.com"
  },
  "homepage": "https://tools.mycompany.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/mycompany/tools"
  },
  "bugs": {
    "url": "https://github.com/mycompany/tools/issues"
  }
}
```

### 3. 修改应用图标

**图标位置**：
```
packages/client/build/
├── icon.icns          # macOS 图标
├── icon.ico           # Windows 图标
└── icon.png           # Linux 图标
```

**图标尺寸要求**：

| 平台 | 格式 | 尺寸 |
|------|------|------|
| macOS | `.icns` | 512x512 (推荐 1024x1024 Retina) |
| Windows | `.ico` | 256x256 |
| Linux | `.png` | 512x512 |

**生成图标**：

```bash
# 使用 electron-icon-maker
npm install -g electron-icon-maker

# 从单个 PNG 生成所有平台图标
electron-icon-maker --input=logo.png --output=packages/client/build
```

**手动生成 macOS 图标（iconutil）**：
```bash
# 1. 创建 iconset 目录
mkdir MyIcon.iconset

# 2. 准备不同尺寸的图片
sips -z 16 16     logo.png --out MyIcon.iconset/icon_16x16.png
sips -z 32 32     logo.png --out MyIcon.iconset/icon_16x16@2x.png
sips -z 32 32     logo.png --out MyIcon.iconset/icon_32x32.png
sips -z 64 64     logo.png --out MyIcon.iconset/icon_32x32@2x.png
sips -z 128 128   logo.png --out MyIcon.iconset/icon_128x128.png
sips -z 256 256   logo.png --out MyIcon.iconset/icon_128x128@2x.png
sips -z 256 256   logo.png --out MyIcon.iconset/icon_256x256.png
sips -z 512 512   logo.png --out MyIcon.iconset/icon_256x256@2x.png
sips -z 512 512   logo.png --out MyIcon.iconset/icon_512x512.png
sips -z 1024 1024 logo.png --out MyIcon.iconset/icon_512x512@2x.png

# 3. 转换为 icns
iconutil -c icns MyIcon.iconset -o packages/client/build/icon.icns
```

### 4. 定制主题色

**文件**：`packages/client/src/theme/theme.ts`

```typescript
import { brandConfig } from '@/shared/brand-config';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandConfig.colors.primary,  // 使用品牌主色
    },
    secondary: {
      main: brandConfig.colors.secondary,
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brandConfig.colors.primary,
    },
    secondary: {
      main: brandConfig.colors.secondary,
    },
  },
});
```

---

## 默认配置定制

### 1. 默认工具源

**文件**：`packages/client/electron/services/config.service.ts`

```typescript
const defaultToolSources: ToolSourceConfig[] = [
  {
    id: 'official',
    name: '公司官方工具源',
    type: 'github',
    enabled: true,
    owner: 'mycompany',
    repo: 'internal-tools',
    branch: 'main',
  },
  {
    id: 'team-frontend',
    name: '前端团队工具',
    type: 'gitlab',
    enabled: true,
    baseUrl: 'https://gitlab.mycompany.com',
    owner: 'frontend',
    repo: 'tools',
    branch: 'master',
  },
];
```

### 2. 默认应用设置

**文件**：`packages/client/electron/services/config.service.ts`

```typescript
const defaultSettings = {
  // 启动设置
  autoLaunch: false,           // 开机自启动
  closeToTray: true,           // 关闭到托盘

  // 工具设置
  autoUpdate: true,            // 自动检查工具更新
  parallelInstall: true,       // 并行安装依赖

  // 隐私设置
  telemetry: false,            // 匿名使用统计（Fork 版本建议关闭）
  crashReporting: false,       // 崩溃报告

  // 开发者设置
  devToolsEnabled: false,      // 默认启用开发者工具
  logLevel: 'info',            // 日志级别
};
```

### 3. 窗口默认尺寸

**文件**：`packages/client/electron/main.ts`

```typescript
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,                // 默认宽度
    height: 900,                // 默认高度
    minWidth: 1200,             // 最小宽度
    minHeight: 700,             // 最小高度
    title: brandConfig.displayName,
    titleBarStyle: 'hiddenInset',
    // ...
  });
}
```

---

## electron-builder 配置

**文件**：`packages/client/electron-builder.json5`

```json5
{
  appId: 'com.mycompany.tools',
  productName: 'MyCompanyTools',
  copyright: 'Copyright © 2025 MyCompany',

  directories: {
    output: 'release/${version}',
    buildResources: 'build',
  },

  files: [
    'dist/**/*',
    'package.json',
  ],

  // macOS
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.developer-tools',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    icon: 'build/icon.icns',
    identity: 'Developer ID Application: MyCompany (TEAMID)',
  },

  // Windows
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icon.ico',
    publisherName: 'MyCompany, Inc.',
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
  },

  // Linux
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Development',
    icon: 'build/icon.png',
    maintainer: 'MyCompany <dev@mycompany.com>',
  },

  // 自动更新
  publish: [
    {
      provider: 'github',
      owner: 'mycompany',
      repo: 'tools',
      private: true,  // 私有仓库
    },
  ],
}
```

---

## 功能定制

### 1. 移除官方工具源

如果希望完全使用内部工具源：

**文件**：`packages/client/electron/services/config.service.ts`

```typescript
// 移除官方工具源
const defaultToolSources: ToolSourceConfig[] = [
  // 不包含官方源
];

// 或者禁用官方源
export const brandConfig = {
  features: {
    showOfficialSource: false,  // 隐藏官方源入口
  },
};
```

### 2. 禁用遥测

**文件**：`packages/client/src/shared/brand-config.ts`

```typescript
export const brandConfig = {
  features: {
    telemetry: false,         // 关闭匿名统计
    crashReporting: false,    // 关闭崩溃报告
  },
};
```

### 3. 自定义欢迎页面

**文件**：`packages/client/src/renderer/pages/home-page.tsx`

```typescript
function HomePage() {
  return (
    <Box>
      <Typography variant="h4">
        欢迎使用 {brandConfig.displayName}
      </Typography>
      <Typography variant="body1">
        {brandConfig.description}
      </Typography>
      {/* 自定义内容 */}
    </Box>
  );
}
```

### 4. 添加自定义帮助链接

**文件**：`packages/client/src/shared/brand-config.ts`

```typescript
export const brandConfig = {
  support: {
    documentation: 'https://docs.mycompany.com/tools',
    feedback: 'https://feedback.mycompany.com',
    contact: 'support@mycompany.com',
  },
};
```

---

## 构建和发布

### 1. 构建测试版本

```bash
# 构建所有包
pnpm build

# 打包应用
pnpm release
```

**输出**：
```
packages/client/release/1.0.0/
├── MyCompanyTools-1.0.0.dmg
├── MyCompanyTools-Setup-1.0.0.exe
└── MyCompanyTools-1.0.0.AppImage
```

### 2. 代码签名（生产环境）

**macOS**：
```bash
export APPLE_ID="your-email@mycompany.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

pnpm release:mac
```

**Windows**：
```bash
export WIN_CSC_LINK="path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="your-password"

pnpm release:win
```

### 3. 发布到 GitHub Releases

**步骤**：
1. 创建 Release（如 `v1.0.0`）
2. 上传安装包
3. 配置自动更新（electron-updater）

**GitHub Actions 配置**（`.github/workflows/release.yml`）：
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: pnpm install
      - name: Build
        run: pnpm build
      - name: Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm release
```

---

## 许可证和版权

### 1. 更新许可证

**文件**：`LICENSE`

```
Copyright (c) 2025 MyCompany

[您的许可证条款]
```

**BoolTox 原始许可证**：
- BoolTox 使用 CC-BY-NC-4.0（非商业许可）
- Fork 版本需遵守原始许可条款
- 商业使用需联系原作者获取授权

### 2. 添加 Fork 声明

**文件**：`README.md`

```markdown
# MyCompanyTools

基于 [BoolTox](https://github.com/ByteTrue/BoolTox) 定制的企业工具平台。

## 声明

本项目 Fork 自 BoolTox，遵循 CC-BY-NC-4.0 许可证。
```

---

## 同步上游更新

### 1. 配置 upstream

```bash
git remote add upstream https://github.com/ByteTrue/BoolTox.git
git fetch upstream
```

### 2. 合并上游更新

```bash
# 切换到主分支
git checkout main

# 拉取上游更新
git fetch upstream

# 合并上游 main 分支
git merge upstream/main

# 解决冲突（如果有）
# ...

# 推送到你的仓库
git push origin main
```

### 3. 保持品牌配置不变

在合并时，确保以下文件保留你的定制：
- `packages/client/src/shared/brand-config.ts`
- `packages/client/build/icon.*`
- `packages/client/electron-builder.json5`
- `packages/client/package.json`

**建议**：
使用 `.gitattributes` 标记品牌文件：
```
# .gitattributes
packages/client/src/shared/brand-config.ts merge=ours
packages/client/electron-builder.json5 merge=ours
```

---

## 内部分发

### 1. 企业内网分发

**方案一：文件服务器**
```bash
# 上传到内网文件服务器
scp packages/client/release/*/MyCompanyTools-* file-server:/downloads/
```

**方案二：内部 GitLab/GitHub**
```bash
# 配置 electron-updater
{
  "publish": {
    "provider": "generic",
    "url": "https://gitlab.mycompany.com/tools/releases"
  }
}
```

### 2. 自动更新服务器

**Nginx 配置**（`/etc/nginx/sites-available/tools-updates`）：
```nginx
server {
  listen 80;
  server_name tools-updates.mycompany.com;

  location / {
    root /var/www/tools-updates;
    autoindex on;
  }

  # 跨域支持
  add_header Access-Control-Allow-Origin *;
}
```

**目录结构**：
```
/var/www/tools-updates/
├── latest.yml              # Windows 更新配置
├── latest-mac.yml          # macOS 更新配置
├── latest-linux.yml        # Linux 更新配置
└── releases/
    ├── v1.0.0/
    │   ├── MyCompanyTools-Setup-1.0.0.exe
    │   ├── MyCompanyTools-1.0.0.dmg
    │   └── MyCompanyTools-1.0.0.AppImage
    └── v1.1.0/
        └── ...
```

---

## 检查清单

### Fork 定制清单

- [ ] 修改品牌配置（`brand-config.ts`）
- [ ] 更新 `package.json`（名称、作者、URL）
- [ ] 替换应用图标（macOS/Windows/Linux）
- [ ] 定制主题色（`theme.ts`）
- [ ] 配置默认工具源（`config.service.ts`）
- [ ] 更新 `electron-builder.json5`（appId, productName）
- [ ] 修改许可证（`LICENSE`）
- [ ] 添加 Fork 声明（`README.md`）
- [ ] 测试构建（`pnpm build && pnpm release`）
- [ ] 配置代码签名证书
- [ ] 设置自动更新服务器
- [ ] 配置 CI/CD 流水线

### 测试清单

- [ ] 应用正常启动
- [ ] 应用名称和图标正确显示
- [ ] 主题色生效
- [ ] 默认工具源加载成功
- [ ] 工具安装、启动、停止功能正常
- [ ] 自动更新功能正常
- [ ] 所有平台（macOS/Windows/Linux）均可用

---

## 常见问题

### 1. 修改配置后未生效

**原因**：缓存未清除

**解决方案**：
```bash
# 清理构建缓存
pnpm clean

# 重新构建
pnpm build
```

### 2. 图标未更新

**原因**：electron-builder 缓存

**解决方案**：
```bash
# 删除缓存
rm -rf packages/client/release

# 重新打包
pnpm release
```

### 3. 代码签名失败

**原因**：证书配置错误或过期

**解决方案**：
```bash
# macOS: 检查证书
security find-identity -v -p codesigning

# Windows: 验证证书
signtool.exe sign /v /f certificate.pfx /p password test.exe
```

---

## 参考资料

- **部署指南**：[docs/deployment-guide.md](deployment-guide.md)
- **electron-builder 文档**：https://www.electron.build/
- **Material-UI 主题定制**：https://mui.com/material-ui/customization/theming/

---

## 技术支持

如有问题，欢迎提交 Issue 或联系原项目维护者：
- **原项目**：https://github.com/ByteTrue/BoolTox
- **商业授权**：联系 ByteTrue 获取商业许可
