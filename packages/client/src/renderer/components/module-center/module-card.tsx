import { motion } from "framer-motion";
import { Play, Pause, Trash2, Download, ExternalLink, Pin } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from "@/utils/glass-layers";
import { cardHover, buttonInteraction } from "@/utils/animation-presets";
import type { ModuleInstance } from "@core/modules/types";

interface ModuleCardProps {
  module: ModuleInstance;
  onToggleStatus: (moduleId: string) => void;
  onUninstall: (moduleId: string) => void;
  onOpen: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  onPinToggle: (moduleId: string) => void;
}

export function ModuleCard({
  module,
  onToggleStatus,
  onUninstall,
  onOpen,
  onClick,
  onPinToggle,
}: ModuleCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isEnabled = module.runtime.status === "enabled";

  return (
    <motion.div
      {...cardHover}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-4 transition-shadow duration-250 ease-swift card-hover-optimized ${getGlassShadow(theme)} ${
        isDark 
          ? 'hover:shadow-unified-xl-dark' 
          : 'hover:shadow-unified-xl'
      }`}
      style={{
        ...getGlassStyle('CARD', theme, { withBorderGlow: true, withInnerShadow: true }),
        transitionProperty: 'box-shadow, transform',
        transitionDuration: '200ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 启用状态指示器 - 独立元素 */}
      {isEnabled && (
        <div 
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-green-500"
          style={{
            boxShadow: isDark 
              ? '0 0 8px rgba(34, 197, 94, 0.5)' 
              : '0 0 8px rgba(34, 197, 94, 0.3)',
          }}
        />
      )}
      
      {/* 头部: 图标和状态 */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 图标 */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
            }`}
          >
            {module.definition.icon && module.definition.icon.startsWith('http') ? (
              <img
                src={module.definition.icon}
                alt={module.definition.name}
                className="h-8 w-8 rounded-lg"
                loading="lazy"
                onError={(e) => {
                  // 图片加载失败时隐藏
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-slate-700"
                }`}
              >
                {module.definition.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 状态标签 */}
        <div className="flex flex-col gap-1">
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold border ${
              isEnabled
                ? "border-green-500/30 bg-green-500/20 text-green-500"
                : isDark
                  ? "bg-white/10 text-white/80"
                  : "bg-slate-200 text-slate-700"
            }`}
            style={!isEnabled ? {
              borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
            } : undefined}
          >
            {isEnabled ? "✓ 已启用" : "⏸ 已停用"}
          </span>
        </div>
      </div>

      {/* 内容 */}
      <button
        type="button"
        onClick={() => onClick(module.id)}
        className="mb-3 w-full text-left"
      >
        <h3
          className={`mb-1 text-base font-semibold transition-colors hover:text-blue-500 ${
            isDark ? "text-white" : "text-slate-800"
          }`}
        >
          {module.definition.name}
        </h3>
        {module.definition.description && (
          <p
            className={`line-clamp-2 text-sm ${
              isDark ? "text-white/70" : "text-slate-600"
            }`}
          >
            {module.definition.description}
          </p>
        )}
      </button>

      {/* 元信息 */}
      <div
        className={`mb-3 flex items-center gap-2 text-xs ${
          isDark ? "text-white/60" : "text-slate-500"
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
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(module.id);
          }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            isDark
              ? "bg-white/5 text-white hover:bg-white/10"
              : "bg-white/50 text-slate-700 hover:bg-white"
          }`}
          style={{
            borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
          }}
          title="打开模块"
        >
          <ExternalLink className="mx-auto" size={14} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle(module.id);
          }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            module.pinnedToQuickAccess
              ? "border-yellow-500/30 bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
              : isDark
                ? "bg-white/5 text-white hover:bg-white/10"
                : "bg-white/50 text-slate-700 hover:bg-white"
          }`}
          style={!module.pinnedToQuickAccess ? {
            borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
          } : undefined}
          title={module.pinnedToQuickAccess ? "从快速访问移除" : "添加到快速访问"}
        >
          <Pin 
            className={`mx-auto ${module.pinnedToQuickAccess ? 'fill-current' : ''}`} 
            size={14} 
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(module.id);
          }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            isEnabled
              ? "border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
              : "border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20"
          }`}
          title={isEnabled ? "停用模块" : "启用模块"}
        >
          {isEnabled ? <Pause className="mx-auto" size={14} /> : <Play className="mx-auto" size={14} />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUninstall(module.id);
          }}
          className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 hover:bg-red-500/20"
          title="卸载模块"
        >
          <Trash2 className="mx-auto" size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// 可用模块卡片 (未安装的模块)
interface AvailableModuleCardProps {
  module: { id: string; name: string; description?: string; version: string; category?: string; icon?: string };
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
  const isDark = theme === "dark";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border p-4 transition-shadow duration-200 hover:-translate-y-1.5 ${getGlassShadow(theme)} ${
        isDark 
          ? 'hover:shadow-unified-xl-dark' 
          : 'hover:shadow-unified-xl'
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
              isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
            }`}
          >
            {module.icon && module.icon.startsWith('http') ? (
              <img
                src={module.icon}
                alt={module.name}
                className="h-8 w-8 rounded-lg"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-slate-700"
                }`}
              >
                {module.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 内容 */}
      <button
        type="button"
        onClick={() => onClick(module.id)}
        className="mb-3 w-full text-left"
      >
        <h3
          className={`mb-1 text-base font-semibold transition-colors hover:text-blue-500 ${
            isDark ? "text-white" : "text-slate-800"
          }`}
        >
          {module.name}
        </h3>
        {module.description && (
          <p
            className={`line-clamp-2 text-sm ${
              isDark ? "text-white/70" : "text-slate-600"
            }`}
          >
            {module.description}
          </p>
        )}
      </button>

      {/* 元信息 */}
      <div
        className={`mb-3 flex items-center gap-2 text-xs ${
          isDark ? "text-white/60" : "text-slate-500"
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
        onClick={(e) => {
          e.stopPropagation();
          onInstall(module.id);
        }}
        disabled={isInstalling}
        className={`w-full rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-500 transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 hover:bg-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 ${
          isDark ? "shadow-unified-md-dark" : "shadow-unified-md"
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
            安装模块
          </span>
        )}
      </button>
    </motion.div>
  );
}
