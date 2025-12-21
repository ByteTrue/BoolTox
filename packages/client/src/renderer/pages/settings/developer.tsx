/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 开发者模式设置页面
 * 包含调试工具和开发配置
 */

import { useTheme } from '../../components/theme-provider';
import { motion } from 'framer-motion';
import { Trash2, FileText, RefreshCw } from 'lucide-react';

export function DeveloperSettings() {
  const { theme } = useTheme();

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

      {/* 快速操作 */}
      <section className="space-y-4">
        <h3
          className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          快速操作
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {actionButtons.map(action => (
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
        <h3
          className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
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
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>环境模式:</span>
            <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
              {import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>Electron:</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {typeof window !== 'undefined' && window.electron ? '已启用' : '未启用'}
            </span>
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
