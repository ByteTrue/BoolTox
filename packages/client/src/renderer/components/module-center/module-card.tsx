/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { Trash2, Download, ExternalLink, Pin, Square, Clock, Check } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from '@/utils/glass-layers';
import { cardHover } from '@/utils/animation-presets';
import { formatDistanceToNow } from '@/utils/date';
import type { ModuleInstance } from '@/types/module';

interface ModuleCardProps {
  module: ModuleInstance;
  onUninstall: (moduleId: string) => void;
  onOpen: (moduleId: string) => void;
  onStop: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  onPinToggle: (moduleId: string) => void;
  isDev?: boolean; // 是否为开发工具(不可卸载)
  isSelectionMode?: boolean; // 是否为选择模式
  isSelected?: boolean; // 是否被选中
  onSelect?: (moduleId: string) => void; // 选择回调
}

export function ModuleCard({
  module,
  onUninstall,
  onOpen,
  onStop,
  onClick,
  onPinToggle,
  isDev = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: ModuleCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const launchState = module.runtime.launchState ?? 'idle';
  const isLaunching = launchState === 'launching';
  const isRunning = launchState === 'running';
  const isLaunchError = launchState === 'error';
  const isStandalone = module.definition.runtimeMode === 'standalone';

  // 检查工具类型
  const runtimeType = module.definition.runtime?.type;
  const isExternalTool = runtimeType === 'cli' || runtimeType === 'binary';

  // 启动器模式：只在启动中或错误时显示状态标签
  const launchStateBadge = isLaunching
    ? { label: '启动中…', tone: 'warning' as const }
    : isLaunchError
      ? { label: '启动失败', tone: 'danger' as const }
      : null;

  return (
    <motion.div
      {...cardHover}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-4 transition-shadow duration-250 ease-swift card-hover-optimized ${getGlassShadow(theme)} ${
        isDark ? 'hover:shadow-unified-xl-dark' : 'hover:shadow-unified-xl'
      }`}
      style={{
        ...getGlassStyle('CARD', theme, { withBorderGlow: true, withInnerShadow: true }),
        transitionProperty: 'box-shadow, transform',
        transitionDuration: '200ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 头部: 图标和状态 */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 选择模式：复选框 */}
          {isSelectionMode && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSelect?.(module.id);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500'
                  : isDark
                    ? 'border-white/30 hover:border-blue-500/50'
                    : 'border-slate-300 hover:border-blue-500/50'
              }`}
            >
              {isSelected && <Check className="h-4 w-4 text-white" />}
            </button>
          )}

          {/* 图标 */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl relative ${
              isDark
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20'
            }`}
          >
            {/* 更新徽章 */}
            {module.runtime.updateAvailable && (
              <div
                className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center"
                title="有可用更新"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </div>
            )}

            {module.definition.icon && module.definition.icon.startsWith('http') ? (
              <img
                src={module.definition.icon}
                alt={module.definition.name}
                className="h-8 w-8 rounded-lg"
                loading="lazy"
                onError={e => {
                  // 图片加载失败时隐藏
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {module.definition.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 运行状态标签 */}
        {launchStateBadge && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              launchStateBadge.tone === 'warning'
                ? 'border-yellow-500/30 bg-yellow-500/15 text-yellow-600'
                : 'border-red-500/30 bg-red-500/15 text-red-500'
            }`}
          >
            {launchStateBadge.label}
          </span>
        )}
      </div>

      {/* 内容 */}
      <button type="button" onClick={() => onClick(module.id)} className="mb-3 w-full text-left">
        <h3
          className={`mb-1 text-base font-semibold transition-colors hover:text-blue-500 ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}
        >
          {module.definition.name}
        </h3>
        {module.definition.description && (
          <p className={`line-clamp-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {module.definition.description}
          </p>
        )}
      </button>

      {/* 元信息 */}
      <div
        className={`mb-3 flex items-center gap-2 text-xs ${
          isDark ? 'text-white/60' : 'text-slate-500'
        }`}
      >
        <span>v{module.definition.version}</span>
        {module.definition.category && (
          <>
            <span>•</span>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-500">
              {module.definition.category}
            </span>
          </>
        )}
        {isStandalone && (
          <>
            <span>•</span>
            <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-pink-500">外部窗口</span>
          </>
        )}
        {/* 上次启动时间 */}
        {module.runtime.lastLaunchedAt && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(module.runtime.lastLaunchedAt)}
            </span>
          </>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 启动/停止切换按钮 */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            // 运行中且非外部工具（CLI/Binary）：停止
            // 其他状态：启动
            if (isRunning && !isExternalTool) {
              onStop(module.id);
            } else {
              onOpen(module.id);
            }
          }}
          disabled={isLaunching}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            isRunning && !isExternalTool
              ? isDark
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-500/30'
              : isDark
                ? 'bg-white/5 text-white hover:bg-white/10'
                : 'bg-white/50 text-slate-700 hover:bg-white'
          } ${isLaunching ? 'cursor-wait opacity-70 hover:scale-100' : ''}`}
          style={
            isRunning && !isExternalTool
              ? {} // 停止按钮使用红色边框（通过 className）
              : { borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT }
          }
          title={
            isLaunching
              ? '工具正在启动…'
              : isRunning && !isExternalTool
                ? '停止工具'
                : isExternalTool && isRunning
                  ? '工具在外部运行'
                  : '启动工具'
          }
        >
          {isLaunching ? (
            <span className="mx-auto flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              启动中
            </span>
          ) : isRunning && !isExternalTool ? (
            <Square className="mx-auto" size={14} />
          ) : (
            <ExternalLink className="mx-auto" size={14} />
          )}
        </button>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onPinToggle(module.id);
          }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            module.isFavorite
              ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30'
              : isDark
                ? 'bg-white/5 text-white hover:bg-white/10'
                : 'bg-white/50 text-slate-700 hover:bg-white'
          }`}
          style={
            !module.isFavorite
              ? {
                  borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                }
              : undefined
          }
          title={module.isFavorite ? '取消收藏' : '收藏该工具'}
        >
          <Pin className={`mx-auto ${module.isFavorite ? 'fill-current' : ''}`} size={14} />
        </button>

        {/* 开发工具不显示卸载按钮 */}
        {!isDev && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onUninstall(module.id);
            }}
            className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-u[1.02] hover:brightness-110 hover:bg-red-500/20"
            title="卸载工具"
          >
            <Trash2 className="mx-auto" size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// 可用模块卡片 (未安装的模块)
interface AvailableModuleCardProps {
  module: {
    id: string;
    name: string;
    description?: string;
    version: string;
    category?: string;
    icon?: string;
  };
  onInstall: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  isInstalling?: boolean;
}

export function AvailableModuleCard({
  module,
  onInstall,
  onClick,
  isInstalling = false,
}: AvailableModuleCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-4 transition-shadow duration-200 hover:-translate-y-1.5 ${getGlassShadow(theme)} ${
        isDark ? 'hover:shadow-unified-xl-dark' : 'hover:shadow-unified-xl'
      }`}
      style={{
        ...getGlassStyle('CARD', theme),
        transitionProperty: 'box-shadow, transform',
        transitionDuration: '200ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 头部: 图标 */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isDark
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20'
            }`}
          >
            {module.icon && module.icon.startsWith('http') ? (
              <img
                src={module.icon}
                alt={module.name}
                className="h-8 w-8 rounded-lg"
                loading="lazy"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {module.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 内容 */}
      <button type="button" onClick={() => onClick(module.id)} className="mb-3 w-full text-left">
        <h3
          className={`mb-1 text-base font-semibold transition-colors hover:text-blue-500 ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}
        >
          {module.name}
        </h3>
        {module.description && (
          <p className={`line-clamp-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {module.description}
          </p>
        )}
      </button>

      {/* 元信息 */}
      <div
        className={`mb-3 flex items-center gap-2 text-xs ${
          isDark ? 'text-white/60' : 'text-slate-500'
        }`}
      >
        <span>v{module.version}</span>
        {module.category && (
          <>
            <span>•</span>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-500">
              {module.category}
            </span>
          </>
        )}
      </div>

      {/* 安装按钮 */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onInstall(module.id);
        }}
        disabled={isInstalling}
        className={`w-full rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-500 transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 hover:bg-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 ${
          isDark ? 'shadow-unified-md-dark' : 'shadow-unified-md'
        }`}
      >
        {isInstalling ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            正在安装...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Download size={16} />
            安装工具
          </span>
        )}
      </button>
    </motion.div>
  );
}
