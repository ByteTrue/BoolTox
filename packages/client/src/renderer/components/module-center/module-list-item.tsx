import { motion } from "framer-motion";
import { Play, Pause, Trash2, Download, ExternalLink } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from "@/utils/glass-layers";
import { cardHover, iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";
import type { ModuleInstance, ModuleDefinition } from "@core/modules/types";

interface ModuleListItemProps {
  module: ModuleInstance | ModuleDefinition;
  onToggleStatus?: (moduleId: string) => void;
  onUninstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  onInstall?: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  isProcessing?: boolean;
}

export function ModuleListItem({
  module,
  onToggleStatus,
  onUninstall,
  onOpen,
  onInstall,
  onClick,
  isProcessing = false,
}: ModuleListItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isInstalled = "runtime" in module;
  const isEnabled = isInstalled && module.runtime.status === "enabled";
  const definition = isInstalled ? module.definition : module;

  return (
    <motion.div
      {...cardHover}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-shadow duration-250 ease-swift ${getGlassShadow(theme)} ${
        isEnabled ? "border-l-4 border-l-green-500" : ""
      }`}
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
          {isInstalled && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
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
            {/* 启用/停用按钮 */}
            <motion.button
              {...iconButtonInteraction}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(module.id);
              }}
              className={`rounded-lg border p-2 transition-[background-color,transform] duration-250 ease-swift ${
                isEnabled
                  ? "border-green-500/30 bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  : isDark
                    ? "bg-white/10 text-white/80 hover:bg-white/20"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
              style={!isEnabled ? {
                borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
              } : undefined}
              title={isEnabled ? "停用模块" : "启用模块"}
            >
              {isEnabled ? <Pause size={16} /> : <Play size={16} />}
            </motion.button>

            {/* 打开按钮 */}
            {isEnabled && (
              <motion.button
                {...iconButtonInteraction}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen?.(module.id);
                }}
                className={`rounded-lg border border-blue-500/30 bg-blue-500/20 p-2 text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30`}
                title="打开模块"
              >
                <ExternalLink size={16} />
              </motion.button>
            )}

            {/* 卸载按钮 */}
            <motion.button
              {...iconButtonInteraction}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUninstall?.(module.id);
              }}
              className={`rounded-lg border border-red-500/30 bg-red-500/20 p-2 text-red-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-red-500/30`}
              title="卸载模块"
            >
              <Trash2 size={16} />
            </motion.button>
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
