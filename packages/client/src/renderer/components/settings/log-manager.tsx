/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { FileText, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * 日志管理组件
 * 用于设置页面,提供日志查看和管理功能
 */
export function LogManager() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [logPath, setLogPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 获取日志路径
  const getLogPath = async () => {
    try {
      setLoading(true);
      const path = (await window.ipc.invoke('logger:get-log-path')) as string;
      setLogPath(path);
      setMessage({ type: 'success', text: '日志路径获取成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '获取日志路径失败: ' + String(error) });
    } finally {
      setLoading(false);
    }
  };

  // 打开日志文件夹
  const openLogFolder = async () => {
    try {
      setLoading(true);
      await window.ipc.invoke('logger:open-log-folder');
      setMessage({ type: 'success', text: '日志文件夹已打开' });
    } catch (error) {
      setMessage({ type: 'error', text: '打开日志文件夹失败: ' + String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          日志管理
        </h3>
        <p className={`mt-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
          查看和管理应用日志文件
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? isDark
                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                : 'border-green-500/30 bg-green-50 text-green-700'
              : isDark
                ? 'border-red-500/20 bg-red-500/10 text-red-400'
                : 'border-red-500/30 bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 日志路径显示 */}
      {logPath && (
        <div
          className={`rounded-lg border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <FileText size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                日志文件路径
              </p>
              <p
                className={`mt-1 text-xs font-mono break-all ${
                  isDark ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                {logPath}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={getLogPath}
          disabled={loading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/15 disabled:opacity-50'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'
          }`}
        >
          <FileText size={16} />
          {loading ? '获取中...' : '获取日志路径'}
        </button>

        <button
          onClick={openLogFolder}
          disabled={loading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isDark
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50'
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
          }`}
        >
          <FolderOpen size={16} />
          {loading ? '打开中...' : '打开日志文件夹'}
        </button>
      </div>

      {/* 说明信息 */}
      <div
        className={`rounded-lg border p-4 ${
          isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          日志说明
        </h4>
        <ul className={`mt-2 space-y-1 text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
          <li>• 日志文件自动按日期归档,单个文件最大 10MB</li>
          <li>• 开发环境日志级别: DEBUG,记录所有信息</li>
          <li>• 生产环境日志级别: INFO,仅记录重要信息</li>
          <li>
            • 日志文件位置:
            <ul className="ml-4 mt-1 space-y-0.5">
              <li>- Windows: %APPDATA%/Roaming/BoolTox/logs/</li>
              <li>- macOS: ~/Library/Application Support/BoolTox/logs/</li>
              <li>- Linux: ~/.config/BoolTox/logs/</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
