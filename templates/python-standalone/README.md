# Python Standalone Template

- 仅运行 Python GUI（tkinter 示例），不创建 BrowserWindow。
- manifest.runtime.type = "standalone"，entry 指向 `main.py`。
- 依赖隔离由宿主提供，requirements.txt 可选。

## 快速开始
1. 在 BoolTox 中加载插件，启动后会弹出独立窗口。
2. 如需 PySide/PyQt，请在 requirements.txt 中声明并在 main.py 中自行初始化。
3. 可通过 stdout 打印日志，宿主将记录到运行日志。
