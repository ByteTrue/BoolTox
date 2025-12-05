# @booltox/plugin-sdk

BoolTox 插件开发 SDK - 轻量级运行时 API 封装。

## 安装

```bash
pnpm add @booltox/plugin-sdk
```

## 快速开始

### 基础使用

```typescript
import { getBooltoxClient } from '@booltox/plugin-sdk';

const booltox = getBooltoxClient();

// 设置窗口标题
await booltox.setTitle('我的插件');

// 读取文件
const content = await booltox.readFile('/path/to/file.txt');

// 存储数据
await booltox.setStorage('myKey', { foo: 'bar' });
const data = await booltox.getStorage('myKey');
```

### 后端通信

```typescript
import { createBackendClient } from '@booltox/plugin-sdk';

const backend = createBackendClient();

// 连接到后端进程
await backend.connect();

// 调用后端方法（JSON-RPC）
const result = await backend.call('getSystemInfo');

// 监听后端事件
backend.on('dataUpdate', (data) => {
  console.log('数据更新:', data);
});
```

### React Hooks

```typescript
import {
  useStorage,
  useBackend,
  useBackendCall,
  useWindowTitle,
} from '@booltox/plugin-sdk';

function MyPlugin() {
  // 自动同步的存储
  const [count, setCount] = useStorage('count', 0);

  // 自动连接的后端
  const { backend, isConnected } = useBackend();

  // 便捷的后端方法调用
  const { call, isLoading, data } = useBackendCall(backend);

  // 自动设置窗口标题
  useWindowTitle('我的插件');

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>

      {isConnected && (
        <button onClick={() => call('fetchData')}>
          {isLoading ? '加载中...' : '获取数据'}
        </button>
      )}
    </div>
  );
}
```

## API 参考

### BooltoxClient

#### 窗口 API
- `setTitle(title: string)` - 设置窗口标题
- `showWindow()` - 显示窗口
- `hideWindow()` - 隐藏窗口
- `setWindowSize(width, height)` - 设置窗口大小
- `minimizeWindow()` - 最小化窗口
- `closeWindow()` - 关闭窗口

#### 文件系统 API
- `readFile(path, encoding?)` - 读取文件
- `writeFile(path, data, encoding?)` - 写入文件
- `listDirectory(path?)` - 列出目录
- `getFileInfo(path)` - 获取文件信息

#### 存储 API
- `getStorage<T>(key)` - 获取存储值
- `setStorage<T>(key, value)` - 设置存储值
- `deleteStorage(key)` - 删除存储值
- `listStorageKeys()` - 列出所有键

#### Shell API
- `execCommand(command, args?)` - 执行命令
- `spawnProcess(options)` - 启动进程

#### Python API
- `getPythonStatus()` - 获取 Python 状态
- `ensurePython()` - 确保 Python 可用
- `installPythonPackages(packages)` - 安装依赖
- `runPythonCode(code, timeout?)` - 运行代码
- `runPythonScript(path, args?, timeout?)` - 运行脚本

### BackendClient

#### 连接管理
- `connect(definition?)` - 连接到后端进程
- `disconnect()` - 断开连接
- `isReady()` - 检查是否就绪
- `waitForReady(timeout?)` - 等待就绪

#### 通信
- `call<TParams, TResult>(method, params?, timeout?)` - 调用方法（JSON-RPC）
- `notify<TParams>(method, params?)` - 发送通知
- `postMessage(payload)` - 发送原始消息

#### 事件
- `on(event, listener)` - 监听事件
- `once(event, listener)` - 监听一次
- `off(event, listener?)` - 取消监听

### React Hooks

#### useStorage
```typescript
const [value, setValue] = useStorage<T>(key, defaultValue);
```

#### useBackend
```typescript
const { backend, isConnected, isConnecting, error } = useBackend();
```

#### useBackendEvent
```typescript
useBackendEvent(backend, 'dataUpdate', (data) => {
  console.log(data);
});
```

#### useBackendCall
```typescript
const { call, isLoading, error, data } = useBackendCall(backend);
await call('methodName', { param: 'value' });
```

#### useWindowTitle
```typescript
useWindowTitle('我的插件标题');
```

## 许可证

CC-BY-NC-4.0 © ByteTrue
