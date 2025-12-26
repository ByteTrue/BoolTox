# 常见问题（FAQ）

本文档收集了 BoolTox 使用过程中的常见问题和解决方案。

---

## 安装与启动

### Q: 下载安装包后无法打开（macOS）

**问题**：
双击 `.dmg` 文件后提示「无法打开"BoolTox.app"，因为它来自身份不明的开发者」。

**解决方案**：
```bash
# 方案一：右键打开
右键点击应用 → 打开 → 确认打开

# 方案二：系统设置
系统设置 → 隐私与安全性 → 点击「仍要打开」

# 方案三：移除隔离属性（推荐）
xattr -dr com.apple.quarantine /Applications/BoolTox.app
```

### Q: Windows Defender 拦截安装包

**问题**：
Windows Defender 提示「Windows 已保护你的电脑」或将安装包标记为病毒。

**解决方案**：
1. 点击「更多信息」→「仍要运行」
2. 将安装包添加到 Windows Defender 排除列表
3. 等待官方代码签名版本（已签名的版本不会被误报）

### Q: Linux 下无法运行 AppImage

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

# Arch Linux
sudo pacman -S fuse2

# 手动运行
chmod +x BoolTox-1.0.0.AppImage
./BoolTox-1.0.0.AppImage
```

### Q: 启动后窗口空白或加载失败

**问题**：
应用启动后窗口显示空白或无限加载。

**排查步骤**：
1. 检查日志（设置 → 开发者 → 查看日志）
2. 清除缓存：
   - macOS: `~/Library/Application Support/BoolTox/`
   - Windows: `%APPDATA%/BoolTox/`
   - Linux: `~/.config/BoolTox/`
3. 重新安装应用

---

## 工具管理

### Q: 无法添加工具源

**问题**：
添加 GitHub/Gitee 工具源时提示「连接失败」或「仓库不存在」。

**解决方案**：
1. 检查仓库路径格式（`owner/repo`）
2. 确认仓库为公开仓库（私有仓库需要 token）
3. 检查 `booltox-index.json` 是否存在
4. 测试网络连接：
   ```bash
   curl https://api.github.com/repos/ByteTrue/BoolTox
   ```

### Q: 工具源添加成功但无法看到工具

**问题**：
工具源显示「已连接」，但工具库中没有工具。

**排查步骤**：
1. 检查 `booltox-index.json` 格式：
   ```json
   {
     "tools": [
       { "id": "my-tool", "path": "tools/my-tool" }
     ]
   }
   ```
2. 确认每个工具目录包含 `booltox.json`
3. 查看日志中的错误信息
4. 刷新工具列表（重启应用）

### Q: 工具安装失败

**问题**：
点击「安装」后进度条卡住或提示安装失败。

**常见原因和解决方案**：

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `Network error` | 网络连接失败 | 检查网络，使用 VPN/代理 |
| `Permission denied` | 权限不足 | 以管理员身份运行 BoolTox |
| `Disk full` | 磁盘空间不足 | 清理磁盘空间（至少 500MB） |
| `Python not found` | Python 未安装 | 确保 Python 环境（BoolTox 会自动下载） |

### Q: 工具安装后无法启动

**问题**：
工具安装成功，但点击「启动」后无响应。

**排查步骤**：
1. 查看日志（设置 → 开发者 → 查看日志）
2. 检查端口是否被占用（http-service 工具）：
   ```bash
   # macOS/Linux
   lsof -i :8001

   # Windows
   netstat -ano | findstr :8001
   ```
3. 手动运行工具测试：
   ```bash
   cd ~/Library/Application\ Support/BoolTox/tools/my-tool
   python main.py
   ```
4. 检查依赖是否完整安装

---

## Python 环境

### Q: Python 依赖安装失败

**问题**：
```
ERROR: Could not find a version that satisfies the requirement ...
```

**解决方案**：

**方案一：使用国内镜像源**
```bash
# 临时使用清华镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置（推荐）
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**方案二：检查 Python 版本**
```bash
python --version
# 确保版本 >= 3.8
```

**方案三：更新 pip**
```bash
python -m pip install --upgrade pip
```

### Q: BoolTox 如何管理 Python 环境

**回答**：
BoolTox 使用独立 venv 方案：
- 每个工具一个 venv（`~/.booltox/tool-envs/{toolId}/`）
- 使用 `uv` 自动下载 Python（无需用户预装）
- SHA256 哈希检测依赖变化（避免重复安装）
- 卸载工具时自动清理 venv

**查看工具 venv**：
```bash
ls ~/.booltox/tool-envs/
```

### Q: 如何使用系统 Python 而不是 BoolTox 下载的 Python

**回答**：
目前 BoolTox 默认使用 `uv` 下载的 Python。如需使用系统 Python：

**临时方案**（修改工具配置）：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "process",
      "entry": "/usr/bin/python3",
      "args": ["main.py"],
      "port": 8001
    }
  }
}
```

---

## 工具开发

### Q: 如何创建一个新工具

**回答**：
参考 [工具开发指南](plugins/development-guide.md)，最简配置：

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}
```

### Q: 工具可以调用 BoolTox API 吗

**回答**：
**不推荐**。BoolTox 的核心理念是「启动器而非容器」，工具应该能独立运行。

**如果确实需要集成**：
- 通过 HTTP API 通信（工具作为独立服务）
- 使用环境变量传递配置
- 避免深度耦合

**示例**（环境变量）：
```python
import os

# BoolTox 会注入环境变量
tool_id = os.getenv('BOOLTOX_TOOL_ID')
data_dir = os.getenv('BOOLTOX_DATA_DIR')
```

### Q: 工具如何持久化数据

**回答**：
使用工具目录或用户目录：

**方案一：工具目录**（推荐）
```python
import os

# 获取工具目录
tool_dir = os.path.dirname(__file__)
data_file = os.path.join(tool_dir, 'data.json')
```

**方案二：用户目录**
```python
from pathlib import Path

# 使用系统用户目录
data_dir = Path.home() / '.my-tool'
data_dir.mkdir(exist_ok=True)
```

**方案三：BoolTox 提供的存储**（通过 IPC）
```typescript
// 渲染进程
await window.electron.ipcRenderer.invoke('module-store:get-cache-path', toolId);
```

---

## 性能与稳定性

### Q: 应用启动很慢

**问题**：
首次启动或更新后启动时间超过 10 秒。

**优化措施**：
1. 关闭不必要的工具源
2. 清理缓存：
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/BoolTox/Cache/

   # Windows
   rd /s /q %APPDATA%\BoolTox\Cache
   ```
3. 减少启动时自动启动的工具

### Q: 应用占用内存过高

**问题**：
BoolTox 进程占用超过 500MB 内存。

**排查**：
1. 检查运行中的工具数量（每个工具独立进程）
2. 关闭不使用的工具标签页
3. 重启应用（释放内存）

**正常内存占用**：
- 主进程（Electron）：150-250MB
- 渲染进程（React）：100-200MB
- 每个工具进程：50-200MB（取决于工具）

### Q: 工具标签页卡顿

**问题**：
在 BoolTox 中打开工具后，标签页响应缓慢。

**解决方案**：
1. 检查工具是否有性能问题（独立运行测试）
2. 关闭其他运行中的工具
3. 增加系统资源（内存、CPU）
4. 使用分离窗口模式（减少主窗口负担）

---

## 更新与维护

### Q: 如何更新 BoolTox

**回答**：
BoolTox 支持自动更新：

**自动更新**：
- 设置 → 关于 → 检查更新
- 下载完成后提示重启安装

**手动更新**：
1. 下载最新版本安装包
2. 安装覆盖旧版本
3. 数据和配置会自动保留

### Q: 更新后工具无法启动

**问题**：
更新 BoolTox 后，之前安装的工具启动失败。

**解决方案**：
1. 检查工具协议版本兼容性
2. 重新安装工具：
   ```
   工具库 → 已安装 → 卸载 → 重新安装
   ```
3. 查看更新日志（Release Notes）中的破坏性变更

### Q: 如何回滚到旧版本

**回答**：
1. 从 [Releases](https://github.com/ByteTrue/BoolTox/releases) 下载旧版本
2. 卸载当前版本
3. 安装旧版本
4. ⚠️ 注意：可能导致数据不兼容

---

## 数据与隐私

### Q: BoolTox 会收集哪些数据

**回答**：
BoolTox 默认**不收集**任何用户数据：
- 不上传工具列表
- 不上传使用日志
- 不跟踪用户行为

**可选的匿名统计**（需用户手动开启）：
- 应用启动次数
- 崩溃报告（不包含个人信息）
- 功能使用统计

**查看设置**：
设置 → 隐私 → 匿名统计（默认关闭）

### Q: 如何导出/备份配置

**回答**：
**手动备份**：
```bash
# macOS
cp -r ~/Library/Application\ Support/BoolTox backup/

# Windows
xcopy %APPDATA%\BoolTox backup\ /E /I /H

# Linux
cp -r ~/.config/BoolTox backup/
```

**恢复配置**：
将备份的目录恢复到原位置即可。

### Q: 卸载 BoolTox 后如何清理数据

**回答**：
卸载应用后，手动删除以下目录：

**macOS**：
```bash
rm -rf ~/Library/Application\ Support/BoolTox
rm -rf ~/Library/Logs/BoolTox
rm -rf ~/Library/Caches/BoolTox
rm -rf ~/.booltox
```

**Windows**：
```bash
rd /s /q %APPDATA%\BoolTox
rd /s /q %LOCALAPPDATA%\BoolTox
rd /s /q %USERPROFILE%\.booltox
```

**Linux**：
```bash
rm -rf ~/.config/BoolTox
rm -rf ~/.cache/BoolTox
rm -rf ~/.booltox
```

---

## 网络与代理

### Q: 在公司内网如何使用

**问题**：
公司网络限制外网访问，无法连接 GitHub/Gitee 工具源。

**解决方案**：

**方案一：使用本地工具源**
```bash
# 1. 克隆工具仓库到本地
git clone https://github.com/ByteTrue/booltox-tools.git

# 2. 在 BoolTox 中添加本地工具源
设置 → 工具源 → 添加工具源 → 本地路径 → 选择克隆的目录
```

**方案二：配置代理**
```bash
# 设置系统代理（BoolTox 会自动使用）
export http_proxy=http://proxy.company.com:8080
export https_proxy=http://proxy.company.com:8080
```

**方案三：使用内部 GitLab/GitHub**
```
设置 → 工具源 → 添加工具源 → GitLab
  - 基础 URL: https://gitlab.company.com
  - 仓库路径: team/tools
```

### Q: 国内访问 GitHub 慢

**问题**：
从 GitHub 下载工具时速度很慢或超时。

**解决方案**：

**方案一：使用 Gitee 镜像**
```
设置 → 工具源 → 添加工具源 → Gitee
  - 仓库路径: bytrue/booltox-tools
```

**方案二：配置 GitHub 代理**
```bash
# 使用代理加速
export https_proxy=http://127.0.0.1:7890
```

**方案三：使用 CDN 加速**
BoolTox 内置 jsDelivr CDN 加速（自动）。

---

## 故障排查

### Q: 如何查看日志

**回答**：
**UI 方式**：
设置 → 开发者 → 查看日志

**命令行方式**：
```bash
# macOS
tail -f ~/Library/Logs/BoolTox/main.log

# Windows
type %APPDATA%\BoolTox\logs\main.log

# Linux
tail -f ~/.config/BoolTox/logs/main.log
```

### Q: 应用崩溃后如何恢复

**问题**：
BoolTox 启动后立即崩溃或黑屏。

**紧急恢复步骤**：
1. 删除配置文件（重置）：
   ```bash
   # macOS
   rm ~/Library/Application\ Support/BoolTox/config.json
   ```
2. 清空缓存
3. 重新启动应用

**如果仍无法恢复**：
重新安装应用（数据会丢失）。

### Q: 如何启用调试模式

**回答**：
**开发模式**：
```bash
cd packages/client
pnpm dev:client
```

**生产版本调试**：
设置 → 开发者 → 启用开发者工具

**环境变量**：
```bash
export BOOLTOX_DEBUG=1
export ELECTRON_ENABLE_LOGGING=1
```

---

## 其他问题

### Q: BoolTox 支持哪些平台

**回答**：
- ✅ macOS 11+ (Intel + Apple Silicon)
- ✅ Windows 10/11 (x64)
- ✅ Linux (Ubuntu 20.04+, Debian 11+, Fedora 35+)

### Q: BoolTox 是否开源

**回答**：
是的，BoolTox 在 GitHub 开源：
- 许可证：CC-BY-NC-4.0（非商业许可）
- 仓库：https://github.com/ByteTrue/BoolTox
- 商业使用需联系作者获取授权

### Q: 如何贡献代码或报告 Bug

**回答**：
- **报告 Bug**：[GitHub Issues](https://github.com/ByteTrue/BoolTox/issues)
- **功能建议**：[GitHub Discussions](https://github.com/ByteTrue/BoolTox/discussions)
- **贡献代码**：参考 [CONTRIBUTING.md](../CONTRIBUTING.md)

### Q: BoolTox vs VS Code Extensions

**回答**：
| 维度 | VS Code Extensions | BoolTox |
|------|-------------------|---------|
| **运行位置** | VS Code 内嵌 | 独立进程 |
| **API 耦合** | 强耦合（Extension API） | 零耦合 |
| **崩溃影响** | 可能拖垮 VS Code | 仅工具自身 |
| **调试** | 需要 Extension Host | 直接用浏览器 DevTools |
| **适用场景** | VS Code 集成工具 | 独立开发工具 |

**BoolTox 设计理念**：启动器而非容器。

---

## 获取帮助

如果以上 FAQ 未能解决你的问题：

1. **搜索 Issues**：[GitHub Issues](https://github.com/ByteTrue/BoolTox/issues)
2. **查看文档**：[完整文档索引](README.md)
3. **提交 Issue**：描述问题并附上日志
4. **社区讨论**：[GitHub Discussions](https://github.com/ByteTrue/BoolTox/discussions)

---

**文档更新**：2025-01-15 | **版本**：1.0.0
