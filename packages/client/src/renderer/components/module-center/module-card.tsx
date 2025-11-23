import { motion } from "framer-motion";
import { Play, Pause, Trash2, Download, ExternalLink, Pin } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from "@/utils/glass-layers";
import { cardHover } from "@/utils/animation-presets";
import type { ModuleInstance } from "@core/modules/types";

interface ModuleCardProps {
  module: ModuleInstance;
  onUninstall: (moduleId: string) => void;
  onOpen: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  onPinToggle: (moduleId: string) => void;
  isDev?: boolean; // 是否为开发插件(不可卸载)
}

export function ModuleCard({
  module,
  onUninstall,
  onOpen,
  onClick,
  onPinToggle,
  isDev = false,
}: ModuleCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const launchState = module.runtime.launchState ?? "idle";
  const isLaunching = launchState === "launching";
  const isRunning = launchState === "running";
  const isLaunchError = launchState === "error";
  const launchStateBadge = isRunning
    ? { label: "窗口运行中", tone: "success" as const }
    : isLaunching
      ? { label: "启动中…", tone: "warning" as const }
      : isLaunchError
        ? { label: "启动失败", tone: "danger" as const }
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

        {/* 运行状态标签 */}
        {launchStateBadge && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              launchStateBadge.tone === "success"
                ? "border-green-500/30 bg-green-500/15 text-green-500"
                : launchStateBadge.tone === "warning"
                  ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-600"
                  : "border-red-500/30 bg-red-500/15 text-red-500"
            }`}
          >
            {launchStateBadge.label}
          </span>
        )}
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
          disabled={isLaunching}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            isDark
              ? "bg-white/5 text-white hover:bg-white/10"
              : "bg-white/50 text-slate-700 hover:bg-white"
          } ${isLaunching ? "cursor-wait opacity-70 hover:scale-100" : ""}`}
          style={{
            borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
          }}
          title={
            isLaunching ? "插件正在启动…" : isRunning ? "聚焦已打开的窗口" : "打开插件"
          }
        >
          {isLaunching ? (
            <span className="mx-auto flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              启动中
            </span>
          ) : (
            <ExternalLink className="mx-auto" size={14} />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle(module.id);
          }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-[1.02] hover:brightness-110 ${
            module.isFavorite
              ? "border-yellow-500/30 bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
              : isDark
                ? "bg-white/5 text-white hover:bg-white/10"
                : "bg-white/50 text-slate-700 hover:bg-white"
          }`}
          style={!module.isFavorite ? {
            borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
          } : undefined}
          title={module.isFavorite ? "取消收藏" : "收藏该插件"}
        >
          <Pin 
            className={`mx-auto ${module.isFavorite ? 'fill-current' : ''}`} 
            size={14} 
          />
        </button>

        {/* 开发插件不显示卸载按钮 */}
        {!isDev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUninstall(module.id);
            }}
            className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-[transform,background-color,brightness] duration-150 ease-swift hover:scale-u[1.02] hover:brightness-110 hover:bg-red-500/20"
            title="卸载插件"
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
            安装插件
          </span>
        )}
      </button>
    </motion.div>
  );
}
