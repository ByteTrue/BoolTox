# 二进制工具架构（现行实现）

## 核心结论

- 工具来源统一为 **Tool Source**：`remote`（GitHub/GitLab 仓库）或 `local`（本地目录）
- 工具元数据统一为 `booltox.json`；多工具仓库用 `booltox-index.json` 做索引
- 安装目录统一为 `$userData/tools/<toolId>/`（由 `ToolManager` 管理）

## 工具源（Tool Source）

### 远程仓库（remote）

- 多工具模式：仓库根目录提供 `booltox-index.json`，列出 `{ id, path }`
- 单工具模式：仓库根目录直接提供 `booltox.json`

客户端下载逻辑见 `packages/client/electron/services/git-ops.service.ts`：
- 通过 GitHub/GitLab **tarball** 下载仓库
- 只提取目标工具目录（`toolPath`），移动到 `$userData/tools/<toolId>/`
- 开发模式下，如果检测到本地 `../booltox-plugins/<toolPath>`，会创建符号链接以便热修改

### 本地目录（local）

本地目录同样支持两种模式：
- 根目录 `booltox-index.json`（多工具）
- 根目录 `booltox.json`（单工具）

## 二进制工具怎么写

推荐用 `cli` + `backend.type: "process"`，并用平台映射解决跨平台二进制：

```json
{
  "id": "com.booltox.binary-sysmon-demo",
  "name": "系统监控（Binary TUI）",
  "version": "1.0.0",
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "process",
      "entry": {
        "darwin-arm64": "bin/sysmon-macos-arm64",
        "darwin-x64": "bin/sysmon-macos-x64",
        "win32-x64": "bin/sysmon-windows-x64.exe",
        "linux-x64": "bin/sysmon-linux-x64"
      }
    },
    "title": "系统监控 TUI",
    "keepOpen": true
  }
}
```

示例目录：`packages/client/examples/binary-sysmon-demo/`

## 运行/加载

客户端会从以下位置加载工具（按顺序）：
- 已安装工具：`$userData/tools/`
- 开发工具目录：`BOOLTOX_DEV_TOOLS_DIR`（仅开发模式）
- 本地工具引用：从配置恢复的本地路径
- `packages/client/examples/`（仅开发模式）

## 相关代码

- 工具加载/校验：`packages/client/electron/services/tool/tool-manager.ts`
- 工具源拉取：`packages/client/electron/services/git-ops.service.ts`
- 协议与运行时类型：`packages/shared/src/types/protocol.ts`
