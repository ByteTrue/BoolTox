/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { Play, Square, Trash2, X } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { getGlassStyle } from '@/utils/glass-layers';

interface BatchActionsBarProps {
  selectedCount: number;
  onStartAll: () => void;
  onStopAll: () => void;
  onUninstallAll: () => void;
  onCancel: () => void;
  hasHttpService: boolean; // 是否有 http-service 工具被选中
}

export function BatchActionsBar({
  selectedCount,
  onStartAll,
  onStopAll,
  onUninstallAll,
  onCancel,
  hasHttpService,
}: BatchActionsBarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (selectedCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`sticky bottom-4 z-30 mx-auto max-w-2xl rounded-2xl border p-4 shadow-2xl ${
        isDark ? 'shadow-blue-900/30' : 'shadow-blue-200/30'
      }`}
      style={getGlassStyle('CARD', theme)}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium">已选中 {selectedCount} 个工具</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 批量启动 */}
          <button
            type="button"
            onClick={onStartAll}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isDark
                ? 'border-white/20 bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <Play size={14} />
            <span>启动全部</span>
          </button>

          {/* 批量停止 - 仅当有 http-service 工具时显示 */}
          {hasHttpService && (
            <button
              type="button"
              onClick={onStopAll}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isDark
                  ? 'border-white/20 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              <Square size={14} />
              <span>停止全部</span>
            </button>
          )}

          {/* 批量卸载 */}
          <button
            type="button"
            onClick={onUninstallAll}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isDark
                ? 'border-white/20 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <Trash2 size={14} />
            <span>卸载全部</span>
          </button>

          {/* 取消选择 */}
          <button
            type="button"
            onClick={onCancel}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isDark
                ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <X size={14} />
            <span>取消</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
