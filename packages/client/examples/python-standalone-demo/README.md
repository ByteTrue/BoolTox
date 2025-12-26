# 番茄钟计时器（Python Standalone）

演示如何创建一个**完全独立**的 Python GUI 工具，使用 PySide6 创建原生窗口。

## 🎯 设计理念

**BoolTox = 进程管理器 + 工具市场**，不是工具运行容器。

- ✅ 工具完全独立，可以手动启动：`python main.py`
- ✅ 不依赖任何 BoolTox SDK
- ✅ 使用 PySide6（Qt）创建原生窗口界面
- ✅ BoolTox 只负责：发现、安装、启动、停止工具

## 功能特性

- **现代 Fluent Design UI**：基于 QFluentWidgets，提供流畅的现代界面
- **可配置计时器**：专注/短休/长休时长、长休间隔、自动开始策略
- **统计面板**：实时记录今日番茄数量、专注分钟数，展示最近 7 天趋势
- **系统通知**：通过 plyer 触发跨平台通知（可在设置里关闭）
- **数据持久化**：使用 QSettings 存储配置和统计数据

## 📁 文件结构

```
python-standalone-demo/
├── booltox.json       # 声明 runtime.type = "standalone"
├── main.py            # 应用入口 + UI/业务逻辑
├── requirements.txt   # PySide6 / QFluentWidgets / plyer
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 独立运行

```bash
python main.py
```

应用将启动原生 Qt 窗口界面。

### 3. 在 BoolTox 中使用

BoolTox 会自动：
1. 检测并安装 Python 依赖（PySide6、QFluentWidgets 等）
2. 启动 Python 进程运行 main.py
3. 管理进程生命周期（启动/停止）

## 技术栈

- **GUI 框架**: PySide6 (Qt for Python)
- **UI 组件**: QFluentWidgets（现代 Fluent Design）
- **通知**: plyer（跨平台系统通知）
- **存储**: QSettings（Qt 配置存储）

## Standalone 模式说明

**什么时候使用 standalone 模式？**
- 工具有自己的原生 GUI 界面（Qt、Tkinter、wxPython 等）
- 不需要浏览器前端
- 需要系统级别的窗口管理

**与 http-service 模式的区别：**
- `standalone`：工具自己创建窗口（如本示例）
- `http-service`：工具提供 HTTP 服务，在浏览器中显示

## 开发与调试

### 本地开发

1. 安装依赖：`pip install -r requirements.txt`
2. 运行：`python main.py`
3. 修改代码后重新运行即可查看效果

### 数据存储位置

- Windows: `%APPDATA%/BoolTox/`
- macOS: `~/Library/Preferences/BoolTox/`
- Linux: `~/.config/BoolTox/`

删除对应目录可重置所有设置和统计数据。

## ✨ 优势

1. **原生体验**: 完整的 Qt 原生窗口，性能优秀
2. **独立性强**: 可以完全独立于 BoolTox 运行
3. **跨平台**: PySide6 支持 Windows、macOS、Linux
4. **功能强大**: 可以使用 Qt 的所有功能（系统托盘、快捷键等）
5. **易于维护**: 纯 Python 代码，无需处理前后端通信

## 运行截图

- **计时器页面**: ProgressRing + 倒计时显示 + 开始/暂停/重置按钮
- **设置页面**: 各项时长配置、通知开关、自动开始策略等
- **统计页面**: 今日汇总（番茄数、专注时长）+ 最近 7 天趋势列表

---

该示例展示如何创建完全独立的 Python GUI 工具，适合需要原生窗口体验的场景。
