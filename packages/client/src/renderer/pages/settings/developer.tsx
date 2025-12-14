/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 开发者模式设置页面
 * 包含调试工具和开发配置
 */

import { useState } from 'react';
import { useTheme } from '../../components/theme-provider';
import { motion } from 'framer-motion';
import { Folder, RefreshCw, Trash2, FileText, Code, Database } from 'lucide-react';

export function DeveloperSettings() {
  const { theme } = useTheme();
  const [localPluginsPath, setLocalPluginsPath] = useState('E:\\Code\\TS\\BoolTox\\booltox-plugins');

  const handleOpenLogs = async () => {
    await window.ipc?.invoke('logger:open-log-folder');
    window.toast?.success('日志文件夹已打开');
  };

  const handleClearCache = async () => {
    if (!confirm('确定要清空所有缓存吗？这将删除下载的临时文件。')) return;

    // TODO: 调用清理缓存的 IPC
    window.toast?.success('缓存已清空');
  };

  const handleReloadTools = async () => {
    // 刷新页面重新加载工具
    window.location.reload();
  };

  const handleSelectPluginsPath = async () => {
    const path = await window.ipc?.invoke('dialog:openFile', {
      properties: ['openDirectory'],
    });

    if (path) {
      setLocalPluginsPath(path);
      // TODO: 保存到配置
      window.toast?.success(`本地工具仓库路径已设置: ${path}`);
    }
  };

  const actionButtons = [
    {
      icon: <FileText size={20} />,
      label: '打开日志文件夹',
      description: '查看应用日志，用于问题排查',
      onClick: handleOpenLogs,
      variant: 'default' as const,
    },
    {
      icon: <Trash2 size={20} />,
      label: '清空缓存',
      description: '删除临时文件和下载缓存',
      onClick: handleClearCache,
      variant: 'danger' as const,
    },
    {
      icon: <RefreshCw size={20} />,
      label: '重新加载工具',
      description: '刷新工具列表（重启应用）',
      onClick: handleReloadTools,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          开发者模式
        </h2>
        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          调试工具和开发配置
        </p>
      </div>

      {/* 本地工具仓库路径 */}
      <section className="space-y-4">
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            本地工具仓库路径
          </h3>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
            开发模式下，工具将通过符号链接安装（修改代码立即生效）
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={localPluginsPath}
            onChange={(e) => setLocalPluginsPath(e.target.value)}
            placeholder="E:\Code\TS\BoolTox\booltox-plugins"
            className={`flex-1 px-4 py-3 rounded-lg border font-mono text-sm ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
          <button
            onClick={handleSelectPluginsPath}
            className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <Folder size={18} />
            选择目录
          </button>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{
            background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            borderColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
          }}
        >
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
            💡 设置本地工具仓库路径后，开发模式下安装工具将创建符号链接。修改工具源码无需重新安装即可生效。
          </p>
        </div>
      </section>

      {/* 快速操作 */}
      <section className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          快速操作
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {actionButtons.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={action.onClick}
              className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-colors ${
                action.variant === 'danger'
                  ? theme === 'dark'
                    ? 'border-red-500/30 hover:bg-red-500/10'
                    : 'border-red-200 hover:bg-red-50'
                  : theme === 'dark'
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div
                className={`mt-1 ${
                  action.variant === 'danger'
                    ? 'text-red-500'
                    : theme === 'dark'
                      ? 'text-blue-400'
                      : 'text-blue-600'
                }`}
              >
                {action.icon}
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold mb-1 ${
                    action.variant === 'danger'
                      ? 'text-red-500'
                      : theme === 'dark'
                        ? 'text-white'
                        : 'text-gray-900'
                  }`}
                >
                  {action.label}
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                  {action.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 环境信息 */}
      <section className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          环境信息
        </h3>

        <div
          className="rounded-lg border p-4 font-mono text-sm space-y-2"
          style={{
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex justify-between">
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>工作目录:</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {process.cwd ? process.cwd() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>开发模式:</span>
            <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
              {import.meta.env.DEV ? '是' : '否'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>本地工具路径:</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{localPluginsPath}</span>
          </div>
        </div>
      </section>

      {/* 提示 */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)',
          borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)',
        }}
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'}`}>
          ⚠️ 开发者模式仅供调试使用。修改配置可能影响应用稳定性，请谨慎操作。
        </p>
      </div>
    </div>
  );
}
