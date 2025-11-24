import { motion } from "framer-motion";
import { Trash2, Download, ExternalLink } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow } from "@/utils/glass-layers";
import { cardHover, iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";
import type { ModuleInstance, ModuleDefinition } from "@core/modules/types";

interface ModuleListItemProps {
  module: ModuleInstance | ModuleDefinition;
  onUninstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  onInstall?: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  isProcessing?: boolean;
  isDev?: boolean; // 是否为开发插件(不可卸载)
}

export function ModuleListItem({
  module,
  onUninstall,
  onOpen,
  onInstall,
  onClick,
  isProcessing = false,
  isDev = false,
}: ModuleListItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isInstalled = "runtime" in module;
  const definition = isInstalled ? module.definition : module;
  const launchState = isInstalled ? module.runtime.launchState ?? "idle" : "idle";
  const isLaunching = launchState === "launching";
  const isRunning = launchState === "running";
  const isLaunchError = launchState === "error";
  const launchStateBadge = isInstalled
    ? isRunning
      ? { label: "窗口运行中", className: "border-green-500/30 bg-green-500/15 text-green-500" }
      : isLaunching
        ? { label: "启动中…", className: "border-yellow-500/30 bg-yellow-500/15 text-yellow-600" }
        : isLaunchError
          ? { label: "启动失败", className: "border-red-500/30 bg-red-500/15 text-red-500" }
          : null
    : null;

  return (
    <motion.div
      {...cardHover}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-shadow duration-250 ease-swift ${getGlassShadow(theme)}`}
      style={getGlassStyle('CARD', theme)}
    >
      {/* 左侧: 图标 */}
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
          isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
        }`}
      >
        {definition.icon && definition.icon.startsWith('http') ? (
          <img
            src={definition.icon}
            alt={definition.name}
            className="h-9 w-9 rounded-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-slate-700"
            }`}
          >
            {definition.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* 中间: 主要信息 */}
      <button
        type="button"
        onClick={() => onClick(module.id)}
        className="flex flex-1 flex-col gap-1 text-left"
      >
        <div className="flex items-center gap-2">
          <h3
            className={`text-base font-semibold transition-colors hover:text-blue-500 ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            {definition.name}
          </h3>
          {launchStateBadge && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${launchStateBadge.className}`}
            >
              {launchStateBadge.label}
            </span>
          )}
        </div>
        <p
          className={`line-clamp-1 text-sm ${
            isDark ? "text-white/70" : "text-slate-600"
          }`}
        >
          {definition.description || "暂无描述"}
        </p>
        <div
          className={`flex items-center gap-2 text-xs ${
            isDark ? "text-white/60" : "text-slate-500"
          }`}
        >
          <span>v{definition.version}</span>
          {definition.category && (
            <>
              <span>•</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-500">
                {definition.category}
              </span>
            </>
          )}
          {definition.author && (
            <>
              <span>•</span>
              <span>{definition.author}</span>
            </>
          )}
        </div>
      </button>

      {/* 右侧: 操作按钮 */}
      <div className="flex shrink-0 items-center gap-2">
        {isInstalled ? (
          <>
            {/* 打开按钮 */}
            <motion.button
              {...iconButtonInteraction}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(module.id);
              }}
              disabled={isLaunching}
              className={`rounded-lg border border-blue-500/30 bg-blue-500/20 p-2 text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30 ${
                isLaunching ? "cursor-wait opacity-70 hover:bg-blue-500/20" : ""
              }`}
              title={
                isLaunching ? "插件正在启动…" : isRunning ? "聚焦已打开的窗口" : "打开插件"
              }
            >
              {isLaunching ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              ) : (
                <ExternalLink size={16} />
              )}
            </motion.button>

            {/* 卸载按钮 - 开发插件不显示 */}
            {!isDev && (
              <motion.button
                {...iconButtonInteraction}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUninstall?.(module.id);
                }}
                className={`rounded-lg border border-red-500/30 bg-red-500/20 p-2 text-red-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-red-500/30`}
                title="卸载插件"
              >
                <Trash2 size={16} />
              </motion.button>
            )}
          </>
        ) : (
          <motion.button
            {...buttonInteraction}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInstall?.(module.id);
            }}
            disabled={isProcessing}
            className={`flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30 disabled:opacity-50`}
          >
            {isProcessing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                安装中
              </>
            ) : (
              <>
                <Download size={16} />
                安装
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
