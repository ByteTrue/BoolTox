/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings, Download, Clock, Command } from "lucide-react";
import Fuse from "fuse.js";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useModulePlatform } from "@/contexts/module-context";
import { formatDistanceToNow } from "@/utils/date";

interface CommandItem {
  id: string;
  type: "tool" | "action";
  label: string;
  description?: string;
  icon?: string;
  lastUsed?: number;
  onSelect: () => void;
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { installedModules, openModule } = useModulePlatform();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 构建命令列表
  const commands = useMemo<CommandItem[]>(() => {
    const toolCommands: CommandItem[] = installedModules.map(tool => ({
      id: tool.id,
      type: "tool" as const,
      label: tool.definition.name,
      description: tool.definition.description,
      icon: tool.definition.icon,
      lastUsed: tool.runtime?.lastLaunchedAt,
      onSelect: () => {
        openModule(tool.id);
        close();
      },
    }));

    const actionCommands: CommandItem[] = [
      {
        id: "settings",
        type: "action" as const,
        label: "设置",
        description: "打开应用设置",
        onSelect: () => {
          // TODO: 导航到设置页面
          close();
        },
      },
    ];

    return [...toolCommands, ...actionCommands];
  }, [installedModules, openModule, close]);

  // 模糊搜索
  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: ["label", "description"],
        threshold: 0.3,
        includeScore: true,
      }),
    [commands]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // 无搜索词时，按上次使用时间排序
      return [...commands].sort((a, b) => {
        const aTime = a.lastUsed || 0;
        const bTime = b.lastUsed || 0;
        return bTime - aTime;
      });
    }
    return fuse.search(query).map(result => result.item);
  }, [query, commands, fuse]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].onSelect();
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [filteredCommands, selectedIndex, close]
  );

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 点击背景关闭
  const handleBackdropClick = useCallback(() => {
    close();
  }, [close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* 命令面板 */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-4 overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl">
                {/* 搜索框 */}
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                  <Search className="h-5 w-5 text-white/40" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜索工具或输入命令..."
                    className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
                  />
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Command className="h-3 w-3" />
                    <span>K</span>
                  </div>
                </div>

                {/* 结果列表 */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {filteredCommands.length === 0 ? (
                    <div className="px-4 py-8 text-center text-white/40">
                      未找到匹配的工具
                    </div>
                  ) : (
                    <div className="py-2">
                      {filteredCommands.map((command, index) => (
                        <button
                          key={command.id}
                          onClick={command.onSelect}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            index === selectedIndex
                              ? "bg-white/10"
                              : "hover:bg-white/5"
                          }`}
                        >
                          {/* 图标 */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                            {command.type === "tool" ? (
                              <div className="text-2xl">{command.icon || "🔧"}</div>
                            ) : command.id === "settings" ? (
                              <Settings className="h-5 w-5 text-white/60" />
                            ) : (
                              <Download className="h-5 w-5 text-white/60" />
                            )}
                          </div>

                          {/* 信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {command.label}
                              </span>
                              {command.type === "tool" && (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                                  工具
                                </span>
                              )}
                            </div>
                            {command.description && (
                              <div className="mt-0.5 text-sm text-white/50 truncate">
                                {command.description}
                              </div>
                            )}
                            {command.lastUsed && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                                <Clock className="h-3 w-3" />
                                <span>
                                  上次使用: {formatDistanceToNow(command.lastUsed)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 快捷键提示 */}
                          {index === selectedIndex && (
                            <div className="text-xs text-white/40">
                              <span className="rounded border border-white/20 px-1.5 py-0.5">
                                Enter
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 底部提示 */}
                <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <span className="rounded border border-white/20 px-1 py-0.5">↑↓</span>
                    <span>导航</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded border border-white/20 px-1 py-0.5">Enter</span>
                    <span>选择</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded border border-white/20 px-1 py-0.5">Esc</span>
                    <span>关闭</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
