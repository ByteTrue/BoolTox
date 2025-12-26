# 部署指南

本指南介绍如何构建、打包和发布 BoolTox，以及如何部署自定义品牌版本（Fork 场景）。

---

## 环境要求

### 开发环境

- **Node.js**: `>=20.0.0`
- **pnpm**: `>=8.0.0`
- **Git**: 最新稳定版

**安装 pnpm**：
```bash
npm install -g pnpm
```

### 平台特定要求

**macOS**：
- Xcode Command Line Tools（构建原生模块）
```bash
xcode-select --install
```

**Windows**：
- Visual Studio Build Tools 2019+
- Windows SDK

**Linux**：
- `build-essential`（gcc, make）
- `libgtk-3-dev`（GTK3 依赖）

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/ByteTrue/BoolTox.git
cd BoolTox
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 开发模式

```bash
# 启动客户端（Electron）
pnpm dev:client

# 仅启动渲染进程（用于 UI 开发）
pnpm dev:renderer
```

### 4. 构建生产版本

```bash
# 构建所有包
pnpm build

# 仅构建客户端
pnpm --filter @booltox/client build
```

### 5. 打包应用

```bash
# 打包当前平台的安装包
pnpm release

# 打包所有平台（仅限 macOS）
pnpm release:all
```

---

## 仓库结构

```
BoolTox/
├── packages/
│   ├── client/          # Electron 客户端
│   │   ├── electron/    # 主进程（Node.js）
│   │   └── src/         # 渲染进程（React）
│   ├── cli/             # 工具开发 CLI
│   └── shared/          # 共享类型/协议
├── examples/            # 示例工具（开发模式）
├── scripts/             # 构建脚本
├── docs/                # 文档
└── pnpm-workspace.yaml  # Workspace 配置
```

---

## 构建流程

### 开发模式构建

```bash
# 启动客户端（热重载）
pnpm dev:client
```

**特性**：
- ⚡ Vite HMR（渲染进程热重载）
- 🔄 Electron 主进程自动重启
- 🔍 DevTools 默认开启
- 📦 动态加载 `examples/` 目录工具（开发模式标记）

### 生产模式构建

```bash
pnpm build
```

**构建步骤**：
1. TypeScript 编译（所有 packages）
2. Vite 打包渲染进程（压缩、Tree-shaking）
3. esbuild 打包主进程
4. 复制静态资源

**输出目录**：
```
packages/client/dist/
├── main/               # 主进程（已打包）
├── preload/            # Preload 脚本
└── renderer/           # 渲染进程（HTML/CSS/JS）
```

---

## 打包发布

### electron-builder 配置

配置文件：`packages/client/electron-builder.json5`

```json5
{
  appId: 'com.booltox.app',
  productName: 'BoolTox',
  directories: {
    output: 'release/${version}',
  },
  files: [
    'dist/**/*',
    'package.json',
  ],
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.developer-tools',
    hardenedRuntime: true,
    gatekeeperAssess: false,
  },
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icon.ico',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Development',
  },
}
```

### 打包命令

```bash
# macOS
pnpm --filter @booltox/client release:mac

# Windows
pnpm --filter @booltox/client release:win

# Linux
pnpm --filter @booltox/client release:linux

# 所有平台（仅限 macOS）
pnpm --filter @booltox/client release:all
```

**输出产物**：
```
packages/client/release/1.0.0/
├── BoolTox-1.0.0.dmg                 # macOS 安装包
├── BoolTox-1.0.0-arm64.dmg           # macOS Apple Silicon
├── BoolTox-Setup-1.0.0.exe           # Windows 安装包
├── BoolTox-1.0.0-portable.exe        # Windows 便携版
└── BoolTox-1.0.0.AppImage            # Linux AppImage
```

---

## 代码签名（生产环境）

### macOS 代码签名

**要求**：
- Apple Developer 账号
- 开发者证书（Developer ID Application）
- 公证服务（Notarization）

**配置环境变量**：
```bash
export APPLE_ID="your-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

**electron-builder 配置**：
```json5
{
  mac: {
    identity: "Developer ID Application: Your Name (TEAM_ID)",
    hardenedRuntime: true,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
  },
  afterSign: "scripts/notarize.js",
}
```

**公证脚本**（`scripts/notarize.js`）：
```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.booltox.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### Windows 代码签名

**要求**：
- Code Signing Certificate（如 DigiCert）
- 证书文件（.pfx）

**配置环境变量**：
```bash
export WIN_CSC_LINK="path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"
```

**electron-builder 配置**：
```json5
{
  win: {
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
    signingHashAlgorithms: ["sha256"],
  },
}
```

---

## 自动更新

BoolTox 使用 `electron-updater` 实现自动更新。

### 配置更新服务器

**electron-builder 配置**：
```json5
{
  publish: [
    {
      provider: 'github',
      owner: 'ByteTrue',
      repo: 'BoolTox',
    },
  ],
}
```

**支持的发布平台**：
- GitHub Releases（推荐）
- 自托管服务器
- S3 / OSS

### GitHub Releases 发布

**步骤**：
1. 在 GitHub 创建 Release（如 `v1.0.0`）
2. 上传打包产物（`*.dmg`, `*.exe`, `*.AppImage`）
3. 发布 `latest.yml` / `latest-mac.yml`（electron-builder 自动生成）

**latest.yml 示例**：
```yaml
version: 1.0.0
files:
  - url: BoolTox-Setup-1.0.0.exe
    sha512: ...
    size: 123456789
path: BoolTox-Setup-1.0.0.exe
sha512: ...
releaseDate: '2025-01-15T10:00:00.000Z'
```

### 客户端检查更新

**主进程**（`main.ts`）：
```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', (info) => {
  console.log('发现新版本:', info.version);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('更新已下载，准备安装');
  // 提示用户重启应用
});
```

**IPC 通道**（供渲染进程调用）：
- `auto-update:check`：手动检查更新
- `auto-update:download`：下载更新
- `auto-update:quit-and-install`：退出并安装

---

## 持续集成（CI/CD）

### GitHub Actions 配置

**`.github/workflows/release.yml`**：
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

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}-installer
          path: packages/client/release/**/BoolTox-*.*
```

### 发布流程

1. **创建 Git Tag**：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **触发 CI**：GitHub Actions 自动构建所有平台

3. **发布 Release**：CI 自动上传到 GitHub Releases

4. **用户更新**：客户端自动检测并下载更新

---

## Fork 品牌定制部署

BoolTox 支持 Fork 后自定义品牌（应用名称、图标、配色）。

### 1. 品牌配置

**修改 `packages/client/package.json`**：
```json
{
  "name": "@mycompany/tools",
  "productName": "MyCompanyTools",
  "version": "1.0.0",
  "description": "企业工具管理平台",
  "author": {
    "name": "MyCompany",
    "email": "dev@mycompany.com"
  }
}
```

**修改 `packages/client/electron-builder.json5`**：
```json5
{
  "appId": "com.mycompany.tools",
  "productName": "MyCompanyTools",
  "copyright": "Copyright © 2025 MyCompany"
}
```

更多定制选项请参考 [品牌定制指南](brand-customization.md)。

### 2. 修改图标（可选）

**如果需要自定义图标**，替换以下文件位置的图标（实际路径可能不同，请根据项目结构查找）：
```
packages/client/build/
├── icon.icns          # macOS 图标
├── icon.ico           # Windows 图标
└── icon.png           # Linux 图标
```

**图标尺寸要求**：
- macOS: 512x512 → 1024x1024（Retina）
- Windows: 256x256
- Linux: 512x512

**工具推荐**：
- macOS: `iconutil`
- Windows: `electron-icon-maker`

### 3. 更新 package.json

```json
{
  "name": "@mycompany/tools",
  "productName": "MyCompanyTools",
  "description": "企业工具管理平台",
  "author": "MyCompany <dev@mycompany.com>",
  "homepage": "https://tools.mycompany.com"
}
```

### 4. 更新 electron-builder 配置

```json5
{
  appId: 'com.mycompany.tools',
  productName: 'MyCompanyTools',
  copyright: 'Copyright © 2025 MyCompany',
  mac: {
    category: 'public.app-category.developer-tools',
  },
  win: {
    publisherName: 'MyCompany, Inc.',
  },
}
```

### 5. 自定义官方工具源

**配置文件**：`packages/client/electron/services/config.service.ts`

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
];
```

### 6. 构建自定义版本

```bash
# 修改品牌配置后，重新构建
pnpm build
pnpm release
```

**完整品牌定制指南**：[docs/brand-customization.md](brand-customization.md)

---

## 性能优化

### 1. 减小安装包体积

**优化措施**：
- 使用 `asar` 打包（electron-builder 默认启用）
- 排除开发依赖（`devDependencies`）
- 压缩静态资源（图片、字体）

**electron-builder 配置**：
```json5
{
  files: [
    'dist/**/*',
    'package.json',
    '!node_modules',
  ],
  asarUnpack: [
    'node_modules/better-sqlite3/**/*',
  ],
}
```

### 2. 启动速度优化

**技巧**：
- 延迟加载非关键模块
- 使用 V8 快照（V8 Snapshot）
- 减少主进程初始化逻辑

**主进程优化**：
```typescript
// ❌ 阻塞启动
import heavyModule from 'heavy-module';
app.on('ready', () => {
  const result = heavyModule.doSomething();
});

// ✅ 延迟加载
app.on('ready', () => {
  // 先显示窗口
  mainWindow.show();

  // 后台加载重模块
  setTimeout(() => {
    const heavyModule = require('heavy-module');
    heavyModule.doSomething();
  }, 1000);
});
```

### 3. 渲染性能优化

**Vite 配置**（`packages/client/vite.config.ts`）：
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## 常见问题

### 1. 打包失败：ENOENT

**问题**：
```
Error: ENOENT: no such file or directory, open 'dist/main/main.js'
```

**解决方案**：
```bash
# 确保先构建再打包
pnpm build
pnpm release
```

### 2. macOS 公证失败

**问题**：
```
Notarization failed: Invalid credentials
```

**解决方案**：
1. 检查 Apple ID 和 App-specific Password
2. 确认 Team ID 正确
3. 使用 `xcrun notarytool log` 查看详细错误

### 3. Windows Defender 误报

**问题**：打包的 `.exe` 被 Windows Defender 拦截

**解决方案**：
- 使用代码签名证书（必需）
- 向 Microsoft 提交白名单申请
- 增加杀毒软件扫描通过率

### 4. Linux AppImage 无法运行

**问题**：
```
dlopen(): error loading libfuse.so.2
```

**解决方案**：
```bash
# Ubuntu/Debian
sudo apt install libfuse2

# Fedora
sudo dnf install fuse-libs
```

---

## 检查清单

### 发布前检查

- [ ] 更新版本号（`package.json`）
- [ ] 更新 CHANGELOG.md
- [ ] 运行完整测试套件（`pnpm test`）
- [ ] 检查构建产物（`pnpm build`）
- [ ] 本地测试打包后的应用
- [ ] 验证自动更新配置
- [ ] 确认代码签名证书有效
- [ ] 审查安全漏洞（`pnpm audit`）

### 发布后验证

- [ ] 下载安装包并安装
- [ ] 测试核心功能（安装/启动工具）
- [ ] 验证自动更新功能
- [ ] 检查日志文件（无错误）
- [ ] 监控用户反馈

---

## 参考资料

- **electron-builder 文档**：https://www.electron.build/
- **electron-updater**：https://www.electron.build/auto-update
- **Apple 公证指南**：https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution
- **Windows 代码签名**：https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools

---

## 下一步

- 🎨 **品牌定制**：[docs/brand-customization.md](brand-customization.md)
- 📦 **工具开发**：[docs/plugins/development-guide.md](plugins/development-guide.md)
- 🔧 **示例工具**：[docs/examples-guide.md](examples-guide.md)
