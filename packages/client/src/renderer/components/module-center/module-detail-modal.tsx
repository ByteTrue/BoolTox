import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Play, Pause, Trash2 } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, GLASS_BORDERS } from "@/utils/glass-layers";
import { iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";
import type { ModuleInstance, ModuleDefinition } from "@core/modules/types";

interface ModuleDetailModalProps {
  module: ModuleInstance | ModuleDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall?: (moduleId: string) => void;
  onUninstall?: (moduleId: string) => void;
  onToggleStatus?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  isInstalled?: boolean;
}

type DetailTab = "details" | "changelog";

export function ModuleDetailModal({
  module,
  isOpen,
  onClose,
  onInstall,
  onUninstall,
  onToggleStatus,
  onOpen,
  isInstalled = false,
}: ModuleDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<DetailTab>("details");

  // 重置 Tab 当模块改变时
  useEffect(() => {
    setActiveTab("details");
  }, [module?.id]);

  if (!module) return null;

  const definition = "definition" in module ? module.definition : module;
  const runtime = "runtime" in module ? module.runtime : undefined;
  const isEnabled = runtime?.status === "enabled";

  // Modal 背景样式
  const modalStyle = {
    background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={modalStyle}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`relative w-full max-w-4xl rounded-3xl border ${
              isDark ? "shadow-2xl" : "shadow-xl shadow-brand-blue-400/20"
            }`}
            style={getGlassStyle('CARD', theme)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <motion.button
              {...iconButtonInteraction}
              type="button"
              onClick={onClose}
              className={`absolute right-4 top-4 z-10 rounded-full p-2 transition-[background-color,transform] duration-250 ease-swift ${
                isDark
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-200/50 text-slate-700 hover:bg-slate-300"
              }`}
            >
              <X size={20} />
            </motion.button>

            {/* 内容区域 - 可滚动 */}
            <div className="max-h-[80vh] overflow-y-auto">
              {/* 头部 */}
              <div
                className="border-b p-6"
                style={{
                  borderColor: GLASS_BORDERS.DARK
                }}
              >
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                      isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
                    }`}
                  >
                    {definition.icon && definition.icon.startsWith('http') ? (
                      <img
                        src={definition.icon}
                        alt={definition.name}
                        className="h-12 w-12 rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {definition.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1">
                    <h2
                      className={`mb-2 text-2xl font-bold ${
                        isDark ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {definition.name}
                    </h2>
                    <div
                      className={`flex flex-wrap items-center gap-3 text-sm ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      <span>v{definition.version}</span>
                      {definition.author && (
                        <>
                          <span>•</span>
                          <span>作者: {definition.author}</span>
                        </>
                      )}
                      {definition.category && (
                        <>
                          <span>•</span>
                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-500">
                            {definition.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {isInstalled && runtime ? (
                      <>
                        {onOpen && (
                          <motion.button
                            {...buttonInteraction}
                            type="button"
                            onClick={() => onOpen(module.id)}
                            className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30"
                          >
                            <ExternalLink size={16} className="inline mr-1" />
                            打开
                          </motion.button>
                        )}
                        {onToggleStatus && (
                          <motion.button
                            {...buttonInteraction}
                            type="button"
                            onClick={() => onToggleStatus(module.id)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-[background-color,transform] duration-250 ease-swift ${
                              isEnabled
                                ? "border-orange-500/30 bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"
                                : "border-green-500/30 bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <Pause size={16} className="inline mr-1" />
                                停用
                              </>
                            ) : (
                              <>
                                <Play size={16} className="inline mr-1" />
                                启用
                              </>
                            )}
                          </motion.button>
                        )}
                        {onUninstall && (
                          <motion.button
                            {...buttonInteraction}
                            type="button"
                            onClick={() => onUninstall(module.id)}
                            className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-red-500/30"
                          >
                            <Trash2 size={16} className="inline mr-1" />
                            卸载
                          </motion.button>
                        )}
                      </>
                    ) : (
                      onInstall && (
                        <motion.button
                          {...buttonInteraction}
                          type="button"
                          onClick={() => onInstall(module.id)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30"
                        >
                          <Download size={16} className="inline mr-1" />
                          安装模块
                        </motion.button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Tab 导航 */}
              <div
                className="border-b px-6"
                style={{
                  borderColor: GLASS_BORDERS.DARK
                }}
              >
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`relative py-3 text-sm font-medium transition-colors ${
                      activeTab === "details"
                        ? "text-blue-500"
                        : isDark
                          ? "text-white/60 hover:text-white"
                          : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    📖 详情
                    {activeTab === "details" && (
                      <motion.div
                        layoutId="activeDetailTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("changelog")}
                    className={`relative py-3 text-sm font-medium transition-colors ${
                      activeTab === "changelog"
                        ? "text-blue-500"
                        : isDark
                          ? "text-white/60 hover:text-white"
                          : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    📝 更新日志
                    {activeTab === "changelog" && (
                      <motion.div
                        layoutId="activeDetailTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Tab 内容 */}
              <div className="p-6">
                {activeTab === "details" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={isDark ? "text-white/80" : "text-slate-700"}
                  >
                    <h3 className="mb-3 text-lg font-semibold">模块描述</h3>
                    <p className="mb-6 leading-relaxed">
                      {definition.description || "暂无详细描述"}
                    </p>

                    {definition.keywords && definition.keywords.length > 0 && (
                      <>
                        <h3 className="mb-3 text-lg font-semibold">关键词</h3>
                        <div className="mb-6 flex flex-wrap gap-2">
                          {definition.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-500"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    <h3 className="mb-3 text-lg font-semibold">模块信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isDark ? "text-white/60" : "text-slate-500"}>
                          版本号:
                        </span>
                        <span className="font-medium">{definition.version}</span>
                      </div>
                      {definition.author && (
                        <div className="flex justify-between">
                          <span className={isDark ? "text-white/60" : "text-slate-500"}>
                            作者:
                          </span>
                          <span className="font-medium">{definition.author}</span>
                        </div>
                      )}
                      {definition.category && (
                        <div className="flex justify-between">
                          <span className={isDark ? "text-white/60" : "text-slate-500"}>
                            分类:
                          </span>
                          <span className="font-medium">{definition.category}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={isDark ? "text-white/60" : "text-slate-500"}>
                          来源:
                        </span>
                        <span className="font-medium">
                          {definition.source === "remote" ? "远程模块" : "本地模块"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "changelog" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={isDark ? "text-white/80" : "text-slate-700"}
                  >
                    <h3 className="mb-3 text-lg font-semibold">更新日志</h3>
                    <p className={isDark ? "text-white/60" : "text-slate-500"}>
                      暂无更新日志
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
