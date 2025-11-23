# 插件存储说明

## 插件安装位置

### 开发环境
- **源码插件**: `packages/client/plugins/{plugin-id}/`
- **已安装插件**: `%APPDATA%/Electron/plugins/{plugin-id}/` (开发时)

### 生产环境
- **已安装插件**: `%APPDATA%/BoolTox/plugins/{plugin-id}/`
  - Windows: `C:\Users\{用户名}\AppData\Roaming\BoolTox\plugins\`
  - macOS: `~/Library/Application Support/BoolTox/plugins/`
  - Linux: `~/.config/BoolTox/plugins/`

## 插件数据位置

### 插件运行时数据
- **位置**: `%APPDATA%/BoolTox/plugin-data/{plugin-id}/`
- **用途**: 插件通过 `window.pluginApi.storage` 保存的数据
- **特点**: 独立于插件代码,卸载插件时不会删除

### 模块配置数据
- **位置**: `%APPDATA%/BoolTox/modules-config.json`
- **内容**: 
  ```json
  {
    "version": "1.0.0",
    "installedModules": [
      {
        "id": "com.booltox.starter",
        "status": "enabled",
        "installedAt": "2025-11-23T10:00:00.000Z",
        "version": "1.0.0",
        "source": "remote",
        "isFavorite": true
      }
    ]
  }
  ```

## 客户端更新后数据保留

### ✅ 会保留
- **插件文件**: `userData/plugins/` 目录不会被删除
- **插件数据**: `userData/plugin-data/` 目录不会被删除  
- **模块配置**: `modules-config.json` 不会被删除
- **插件状态**: enabled/disabled、收藏状态等都会保留

### ❌ 会删除
- **应用程序**: 安装目录中的所有文件会被新版本替换
- **缓存文件**: `%TEMP%/booltox-plugin-downloads/` 会被清空

## 卸载插件的完整流程

1. **停止插件运行**
   - 调用 `plugin:stop` IPC 停止 BrowserView
   - 清理内存中的运行时状态

2. **删除插件文件**
   - 调用 `plugin:uninstall` IPC
   - 删除 `userData/plugins/{plugin-id}/` 目录

3. **删除持久化记录**
   - 从 `modules-config.json` 中移除记录
   - 刷新插件注册表

4. **更新 UI 状态**
   - 从 `installedModules` 列表移除
   - 显示卸载成功提示

## 重新安装插件

卸载后重新安装会:
1. 重新下载 ZIP 包到临时目录
2. 验证 SHA-256 哈希
3. 解压到 `userData/plugins/{plugin-id}/`
4. 验证 manifest.json
5. 加载到插件管理器
6. 在 `modules-config.json` 中创建新记录

**注意**: 插件数据 (`plugin-data/`) 不会被删除,重新安装后插件可以继续使用之前保存的数据。

## 完全卸载 BoolTox

如果要完全删除所有数据:
1. 卸载应用程序
2. 手动删除 `%APPDATA%/BoolTox/` 目录

这会删除:
- 所有已安装插件
- 所有插件数据
- 所有配置文件
