import { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Download, 
  Package, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { PythonStatus, RunResult } from './types';

// 默认示例代码
const DEFAULT_CODE = `# Python Runner - 示例代码
# 在这里编写你的 Python 代码

def greet(name):
    return f"Hello, {name}!"

# 测试函数
print(greet("BoolTox"))
print("Python 版本:", end=" ")

import sys
print(sys.version)

# 数学计算示例
import math
print(f"圆周率: {math.pi:.10f}")
print(f"e: {math.e:.10f}")
`;

function App() {
  // 状态
  const [status, setStatus] = useState<PythonStatus | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [packages, setPackages] = useState<string[]>([]);
  const [newPackage, setNewPackage] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'packages'>('code');

  // 获取 Python 环境状态
  const fetchStatus = useCallback(async () => {
    try {
      const result = await window.booltox.python.getStatus();
      setStatus(result);
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  }, []);

  // 获取已安装的包列表
  const fetchPackages = useCallback(async () => {
    try {
      const result = await window.booltox.python.listDeps();
      if (result.success) {
        setPackages(result.packages);
      }
    } catch (error) {
      console.error('获取包列表失败:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    fetchStatus();
    fetchPackages();
  }, [fetchStatus, fetchPackages]);

  // 初始化 Python 环境
  const handleInitialize = async () => {
    setIsInitializing(true);
    setOutput('正在初始化 Python 环境...\n这可能需要几分钟时间（首次需要下载 Python）\n');
    
    try {
      const result = await window.booltox.python.ensure();
      if (result.success) {
        setOutput(prev => prev + '\n✅ Python 环境初始化成功！\n');
        await fetchStatus();
        await fetchPackages();
      } else {
        setOutput(prev => prev + `\n❌ 初始化失败: ${result.error}\n`);
      }
    } catch (error) {
      setOutput(prev => prev + `\n❌ 初始化失败: ${error}\n`);
    } finally {
      setIsInitializing(false);
    }
  };

  // 运行代码
  const handleRun = async () => {
    if (!status?.pythonInstalled) {
      setOutput('❌ Python 环境未就绪，请先初始化环境\n');
      return;
    }

    setIsRunning(true);
    setOutput('⏳ 正在运行...\n\n');

    try {
      const result: RunResult = await window.booltox.python.runCode(code, 30000);
      
      let outputText = '';
      if (result.stdout) {
        outputText += result.stdout;
      }
      if (result.stderr) {
        outputText += '\n--- stderr ---\n' + result.stderr;
      }
      if (result.error) {
        outputText += '\n❌ 错误: ' + result.error;
      }
      
      const exitInfo = result.success 
        ? '\n\n✅ 执行完成' 
        : `\n\n❌ 执行失败 (退出码: ${result.code})`;
      
      setOutput(outputText + exitInfo);
    } catch (error) {
      setOutput(`❌ 执行失败: ${error}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  // 安装包
  const handleInstallPackage = async () => {
    if (!newPackage.trim()) return;

    setIsInstalling(true);
    setOutput(`📦 正在安装 ${newPackage}...\n`);

    try {
      const result = await window.booltox.python.installDeps([newPackage.trim()]);
      if (result.success) {
        setOutput(prev => prev + `✅ ${newPackage} 安装成功！\n`);
        setNewPackage('');
        await fetchPackages();
      } else {
        setOutput(prev => prev + `❌ 安装失败: ${result.error}\n`);
      }
    } catch (error) {
      setOutput(prev => prev + `❌ 安装失败: ${error}\n`);
    } finally {
      setIsInstalling(false);
    }
  };

  // 渲染状态指示器
  const renderStatus = () => {
    if (!status) {
      return (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>检查环境...</span>
        </div>
      );
    }

    if (!status.uvAvailable) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <XCircle className="w-4 h-4" />
          <span>uv 运行时不可用</span>
        </div>
      );
    }

    if (!status.pythonInstalled) {
      return (
        <div className="flex items-center gap-2 text-yellow-500">
          <Download className="w-4 h-4" />
          <span>Python 未安装</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle2 className="w-4 h-4" />
        <span>Python {status.pythonVersion}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Logo 和标题 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-python-blue to-python-yellow flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">Python Runner</span>
          </div>
          
          {/* 状态 */}
          {renderStatus()}
        </div>

        <div className="flex items-center gap-2">
          {/* 刷新状态按钮 */}
          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="刷新状态"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* 初始化按钮 */}
          {(!status?.pythonInstalled || !status?.venvExists) && (
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isInitializing ? '初始化中...' : '初始化环境'}</span>
            </button>
          )}

          {/* 运行按钮 */}
          <button
            onClick={handleRun}
            disabled={isRunning || !status?.pythonInstalled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? '运行中...' : '运行'}</span>
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            代码
          </div>
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'packages'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            依赖管理
          </div>
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'code' ? (
          <>
            {/* 代码编辑区 */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                main.py
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 bg-white dark:bg-gray-900 resize-none code-editor"
                placeholder="在这里输入 Python 代码..."
                spellCheck={false}
              />
            </div>

            {/* 输出区 */}
            <div className="w-1/2 flex flex-col">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span>输出</span>
                <button
                  onClick={() => setOutput('')}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="清空输出"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 p-4 bg-gray-900 text-gray-100 overflow-auto output-area">
                {output || <span className="text-gray-500">点击"运行"按钮执行代码</span>}
              </div>
            </div>
          </>
        ) : (
          /* 依赖管理区 */
          <div className="flex-1 p-4 overflow-auto">
            {/* 安装新包 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">安装新包</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInstallPackage()}
                  placeholder="输入包名，如 requests, flask>=2.0"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isInstalling || !status?.pythonInstalled}
                />
                <button
                  onClick={handleInstallPackage}
                  disabled={isInstalling || !status?.pythonInstalled || !newPackage.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                >
                  {isInstalling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  安装
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                依赖将安装到插件隔离目录，不会影响系统 Python 环境
              </p>
            </div>

            {/* 已安装的包列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">已安装的包</h3>
                <button
                  onClick={fetchPackages}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  刷新列表
                </button>
              </div>
              
              {packages.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                  暂无已安装的包
                </div>
              ) : (
                <div className="grid gap-2">
                  {packages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm font-mono">{pkg}</span>
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 输出区（安装日志） */}
            {output && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">安装日志</h3>
                <div className="p-3 bg-gray-900 text-gray-100 rounded-lg output-area max-h-48 overflow-auto">
                  {output}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {status?.pythonPath && (
            <span title={status.pythonPath}>
              Python: {status.pythonPath.length > 50 ? '...' + status.pythonPath.slice(-50) : status.pythonPath}
            </span>
          )}
        </div>
        <div>
          {status?.uvVersion && <span>uv {status.uvVersion}</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
