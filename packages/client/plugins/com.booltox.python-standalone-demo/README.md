# Python Standalone Demo

- runtime.type = "standalone"，入口 `main.py`，无 BrowserWindow。
- 依赖隔离由宿主提供，requirements.txt 可选（示例为空）。
- 日志通过 stdout 输出，宿主负责进程生命周期管理。

运行：在 BoolTox 中加载插件后启动，即可弹出 tkinter 窗口。
