# 系统监控 TUI - Binary 示例

Go 编写的实时系统监控工具，展示精美的 TUI 界面。

## 关于此示例

**目的**: 演示如何将 Go 编译的交互式 TUI 工具集成到 BoolTox

**技术栈**:
- **语言**: Go 1.25
- **TUI 框架**: Bubbletea（Charm 出品，现代化 Go TUI 库）
- **组件**: bubbles/progress（进度条）、lipgloss（样式）
- **系统信息**: gopsutil（跨平台系统信息库）

**特点**:
- ✅ **真正的交互式 TUI**: 启动后持续运行，实时更新
- ✅ **美观界面**: 彩色进度条、渐变效果
- ✅ **零运行时依赖**: 预编译二进制，直接运行
- ✅ **跨平台**: 一次编译，所有平台可用
- ✅ **体积小**: 每个平台 ~3.2MB

## 功能

- 📊 **实时 CPU 使用率**: 彩色进度条 + 百分比
- 💾 **实时内存使用**: 彩色进度条 + GB 显示
- 🖥️ **系统信息**: 主机名、操作系统、CPU 核心数
- 🔄 **自动刷新**: 每秒更新数据
- ⌨️ **键盘控制**: 按 'q' 或 Esc 退出

## 界面预览

```
  📊 系统监控 TUI

  CPU 使用率:
    ████████████░░░░░░░░░░░░░░░░░░░░  35.2%

  内存使用率:
    ████████████████████░░░░░░░░░░░  62.5% (10.00 GB / 16.00 GB)

  系统信息:
    主机名: MacBook-Pro
    系统: macOS 14.0
    CPU 核心: 8

  按 'q' 退出
```

## 在 BoolTox 中运行

1. 点击"系统监控（Binary TUI）"
2. Terminal 窗口打开
3. **立即看到实时监控界面**
4. 按 'q' 退出

**无需安装任何运行时**（Python/Node.js/Go），直接运行！

## 独立运行

```bash
# macOS ARM64
./bin/sysmon-macos-arm64

# macOS x64
./bin/sysmon-macos-x64

# Windows
.\bin\sysmon-windows-x64.exe

# Linux
./bin/sysmon-linux-x64
```

## 跨平台支持 ✨

**已包含所有平台的二进制**:

| 平台 | 文件名 | 大小 |
|------|--------|------|
| macOS ARM64 | bin/sysmon-macos-arm64 | 3.2MB |
| macOS x64 | bin/sysmon-macos-x64 | 3.3MB |
| Windows x64 | bin/sysmon-windows-x64.exe | 3.2MB |
| Linux x64 | bin/sysmon-linux-x64 | 3.2MB |

**自动平台检测**（BoolTox）:
```json
{
  "runtime": {
    "backend": {
      "entry": {
        "darwin-arm64": "bin/sysmon-macos-arm64",
        "darwin-x64": "bin/sysmon-macos-x64",
        "win32-x64": "bin/sysmon-windows-x64.exe",
        "linux-x64": "bin/sysmon-linux-x64"
      }
    }
  }
}
```

## 技术亮点

### Bubbletea - The Elm Architecture for Go

**Bubbletea** 是 Charm 公司的现代 Go TUI 框架：
- **Model-Update-View** 架构（类似 Elm、Redux）
- **简洁优雅**: 纯函数式风格
- **强大功能**: 支持动画、鼠标、样式等
- **成熟稳定**: glow、gh、vhs 等知名工具都在用

**代码示例**:
```go
type model struct {
    cpuPercent float64
    memPercent float64
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    // 每秒刷新数据
    cpuPercents, _ := cpu.Percent(0, false)
    m.cpuPercent = cpuPercents[0]
    return m, tickCmd()
}

func (m model) View() string {
    // 渲染 TUI 界面
    return "📊 系统监控 TUI\n" +
           m.cpuProgress.ViewAs(m.cpuPercent/100.0)
}
```

### 为什么是 Binary 模式的完美示例？

1. **真正的交互式 TUI**: 启动后持续运行（不是一次性命令）
2. **零运行时依赖**: 不需要 Go/Python/Node.js
3. **跨平台编译**: 一次编写，所有平台编译
4. **体积小**: ~3MB（Go 静态链接）
5. **性能优秀**: Go 编译的原生程序

## 如何编译

**前提**: 安装 Go 1.21+

```bash
# 安装依赖
go mod tidy

# 编译当前平台
go build -o sysmon main.go

# 交叉编译所有平台
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o bin/sysmon-macos-arm64 main.go
GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o bin/sysmon-macos-x64 main.go
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o bin/sysmon-windows-x64.exe main.go
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/sysmon-linux-x64 main.go
```

**编译参数说明**:
- `-ldflags="-s -w"`: 去除调试信息，减小体积
- `GOOS/GOARCH`: 目标操作系统和架构

## 源码说明

**文件结构**:
```
binary-sysmon-demo/
├── main.go              # 主程序（~150 行）
├── go.mod               # Go 模块配置
├── go.sum               # 依赖锁定文件
├── bin/                 # 编译产物
│   ├── sysmon-macos-arm64
│   ├── sysmon-macos-x64
│   ├── sysmon-windows-x64.exe
│   └── sysmon-linux-x64
├── booltox.json         # BoolTox 工具配置
└── README.md            # 本文档
```

**核心代码**:
- Model: 系统状态（CPU、内存）
- Update: 每秒刷新系统信息
- View: 渲染 TUI 界面（进度条、文字）

## Binary vs Source 对比

| 特性 | Source（Python/Node.js） | Binary（Go） |
|------|------------------------|-------------|
| **运行时** | 需要 Python/Node.js | 零依赖 |
| **启动速度** | 慢（解释器启动） | 快（原生二进制） |
| **体积** | 源码几十 KB + 运行时 | 二进制 ~3MB |
| **分发** | 源码 + 依赖安装 | 单文件 |
| **性能** | 中等 | 优秀 |
| **适用场景** | 快速开发、动态语言 | 性能关键、独立工具 |

## 许可说明

- **此工具**: CC-BY-NC-4.0（BoolTox 项目许可证）
- **Bubbletea**: MIT 许可证
- **gopsutil**: BSD-3-Clause 许可证

---

**演示完成！这就是如何用 Go 创建跨平台交互式 TUI 工具并集成到 BoolTox。** 🎉
