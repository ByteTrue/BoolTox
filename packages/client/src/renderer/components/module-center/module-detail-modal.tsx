/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "../theme-provider";
import { getGlassStyle, GLASS_BORDERS } from "@/utils/glass-layers";
import { iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";
import type { ModuleInstance, ModuleDefinition } from "@/types/module";

interface ModuleDetailModalProps {
  module: ModuleInstance | ModuleDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall?: (moduleId: string) => void;
  onUninstall?: (moduleId: string) => void;
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
  onOpen,
  isInstalled = false,
}: ModuleDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setActiveTab("details");
  }, [module?.id]);

  if (!module || !mounted) return null;

  const definition = "definition" in module ? module.definition : module;
  const runtime = "runtime" in module ? module.runtime : undefined;
  const launchState = module.runtime ? (module.runtime as any).launchState ?? 'idle' : 'idle';
  const isLaunching = launchState === "launching";
  const isRunning = launchState === "running";
  const isLaunchError = launchState === "error";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-slate-950/55 backdrop-blur-xl dark:bg-slate-950/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="fixed right-0 top-0 z-[9999] h-full w-full sm:w-[80vw]"
            style={{ maxWidth: "1200px" }}
          >
            <div
              className={`flex h-full flex-col border-l ${isDark ? "shadow-2xl shadow-blue-900/30" : "shadow-xl shadow-blue-200/30"}`}
              style={getGlassStyle("CARD", theme)}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="relative border-b px-6 py-6"
                style={{
                  borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                }}
              >
                <motion.button
                  {...iconButtonInteraction}
                  type="button"
                  onClick={onClose}
                  className={`absolute right-6 top-6 z-10 rounded-lg p-1.5 transition-[background-color,transform] duration-250 ease-swift ${
                    isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                  }`}
                  aria-label="关闭"
                >
                  <X
                    className={`h-4 w-4 ${
                      isDark ? "text-white/70" : "text-slate-600"
                    }`}
                  />
                </motion.button>

                <div className="grid grid-cols-[auto,1fr] gap-4 pr-12">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isDark
                        ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                        : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
                    }`}
                  >
                    {definition.icon && definition.icon.startsWith("http") ? (
                      <img
                        src={definition.icon}
                        alt={definition.name}
                        className="h-10 w-10 rounded-xl"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
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

                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2
                        className={`truncate text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {definition.name}
                      </h2>
                    </div>
                    <div
                      className={`flex flex-wrap items-center gap-2 text-xs ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      <span className="rounded-full border px-2 py-0.5">
                        ID {definition.id}
                      </span>
                      <span className="rounded-full border px-2 py-0.5">
                        版本 v{definition.version}
                      </span>
                      {definition.category && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-500">
                          {definition.category}
                        </span>
                      )}
                      {definition.author && <span>作者：{definition.author}</span>}
                      <span>
                        来源：{definition.source === "remote" ? "远程工具" : "本地工具"}
                      </span>
                      {runtime && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isRunning
                              ? "border border-green-500/30 bg-green-500/15 text-green-500"
                              : isLaunching
                              ? "border border-yellow-500/30 bg-yellow-500/15 text-yellow-600"
                              : isLaunchError
                              ? "border border-red-500/30 bg-red-500/15 text-red-500"
                              : isDark
                              ? "border border-white/10 text-white/70"
                              : "border border-slate-200 text-slate-600"
                          }`}
                        >
                          {isRunning
                            ? "窗口运行中"
                            : isLaunching
                            ? "启动中…"
                            : isLaunchError
                            ? "启动失败"
                            : "未运行"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-start-2 flex flex-wrap items-center gap-2 pt-2">
                    {isInstalled && runtime ? (
                      <>
                        {onOpen && (
                          <motion.button
                            {...buttonInteraction}
                            type="button"
                            onClick={() => onOpen(module.id)}
                            disabled={isLaunching}
                            className={`rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30 ${
                              isLaunching ? "cursor-wait opacity-70 hover:bg-blue-500/20" : ""
                            }`}
                          >
                            {isLaunching ? "启动中…" : isRunning ? "聚焦窗口" : "打开工具"}
                          </motion.button>
                        )}
                        {isInstalled && onUninstall && (
                          <motion.button
                            {...buttonInteraction}
                            type="button"
                            onClick={() => onUninstall(module.id)}
                            className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-red-500/25"
                          >
                            卸载
                          </motion.button>
                        )}
                      </>
                    ) : null}
                    {!isInstalled && onInstall ? (
                      <motion.button
                        {...buttonInteraction}
                        type="button"
                        onClick={() => onInstall(module.id)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-500 transition-[background-color,transform] duration-250 ease-swift hover:bg-blue-500/30"
                      >
                        安装工具
                      </motion.button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4 elegant-scroll">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "details"
                        ? isDark
                          ? "bg-white/15 text-white"
                          : "bg-slate-200 text-slate-900"
                        : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    工具详情
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("changelog")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "changelog"
                        ? isDark
                          ? "bg-white/15 text-white"
                          : "bg-slate-200 text-slate-900"
                        : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    更新日志
                  </button>
                </div>

                <div
                  className={`rounded-2xl border px-6 py-5 ${
                    isDark ? "bg-white/10" : "bg-white/75"
                  }`}
                  style={{
                    borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                  }}
                >
                  {activeTab === "details" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={isDark ? "text-white/80" : "text-slate-700"}
                    >
                      <h3 className="mb-3 text-lg font-semibold">工具描述</h3>
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

                      <h3 className="mb-3 text-lg font-semibold">工具信息</h3>
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
                            {definition.source === "remote" ? "远程工具" : "本地工具"}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
