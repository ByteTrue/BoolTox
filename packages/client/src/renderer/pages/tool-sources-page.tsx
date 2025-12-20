/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';
import { Github, Folder, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import type { ToolSourceConfig } from '@booltox/shared';

export function ToolSourcesPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sources, setSources] = useState<ToolSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const list = (await window.ipc.invoke('tool-sources:list')) as ToolSourceConfig[] | undefined;
      setSources(list || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
      window.toast?.error('加载工具源失败');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceId: string, sourceName: string) => {
    if (sourceId === 'official') {
      window.toast?.error('官方工具源不能删除');
      return;
    }

    if (!confirm(`确定要删除工具源「${sourceName}」吗？\n\n来自该工具源的工具将被移除。`)) {
      return;
    }

    try {
      await window.ipc.invoke('tool-sources:delete', sourceId);
      window.toast?.success(`工具源「${sourceName}」已删除`);
      await loadSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
      window.toast?.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 仅显示远程工具源，本地工具直接变为已安装状态，无需在此管理
  const remoteSources = sources.filter(s => s.type === 'remote');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 elegant-scroll">
      {/* 页面头部 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/tools')}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          工具源管理
        </h1>
      </div>

      {/* 工具源列表（仅显示远程源） */}
      <section className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          工具源 ({remoteSources.length})
        </h2>
        <div className="space-y-4">
          {remoteSources.length === 0 ? (
            <EmptyPlaceholder text="暂无工具源" isDark={isDark} />
          ) : (
            remoteSources.map(source => (
              <SourceCard
                key={source.id}
                source={source}
                onDelete={() => handleDelete(source.id, source.name)}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </section>

      {/* 底部操作 */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/tools/add-source')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加工具源
        </button>
      </div>
    </div>
  );
}

// 空状态占位
function EmptyPlaceholder({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <div
      className={`p-6 border-2 border-dashed rounded-lg text-center ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}
    >
      <p className="text-gray-500">{text}</p>
    </div>
  );
}

// 工具源卡片组件
interface SourceCardProps {
  source: ToolSourceConfig;
  onDelete: () => void;
  isDark: boolean;
}

function SourceCard({ source, onDelete, isDark }: SourceCardProps) {
  const canDelete = source.id !== 'official';

  return (
    <div
      className={`border rounded-xl p-6 transition-all ${
        isDark
          ? 'border-white/10 bg-white/5 hover:bg-white/10'
          : 'border-slate-200 bg-white/50 hover:bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* 左侧：图标 + 信息 */}
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`flex-shrink-0 p-3 rounded-lg ${
              source.type === 'remote' ? 'bg-blue-500/10' : 'bg-green-500/10'
            }`}
          >
            {source.type === 'remote' ? (
              <Github size={32} className="text-blue-500" />
            ) : (
              <Folder size={32} className="text-green-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {source.name}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  source.enabled ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-500'
                }`}
              >
                {source.enabled ? '已启用' : '已禁用'}
              </span>
            </div>

            {/* 远程工具源信息 */}
            {source.type === 'remote' && (
              <div className="space-y-1">
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {source.provider === 'github' ? 'GitHub' : 'GitLab'}: {source.owner}/{source.repo}
                </p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  分支: {source.branch}
                </p>
              </div>
            )}

            {/* 本地工具源信息 */}
            {source.type === 'local' && (
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'} truncate`}>
                {source.localPath}
              </p>
            )}

            {/* 统计信息 */}
            <div
              className={`mt-3 flex items-center gap-4 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}
            >
              <span>优先级: {source.priority}</span>
            </div>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex gap-2">
          {!canDelete ? (
            <div
              className={`px-4 py-2 rounded-lg border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="text-sm text-gray-500">不可删除</span>
            </div>
          ) : (
            <button
              onClick={onDelete}
              className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="删除工具源"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 官方源警告 */}
      {!canDelete && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            官方工具源提供核心工具和安全保障，不能被删除或禁用
          </p>
        </div>
      )}
    </div>
  );
}
