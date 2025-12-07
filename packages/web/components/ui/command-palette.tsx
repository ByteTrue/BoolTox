/**
 * Command Palette 命令面板（Cmd+K）
 * 提供全局搜索、快速导航和快捷操作
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Box,
  Package,
  Settings,
  FileText,
  Play,
  Square,
  Trash2,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { usePlugins } from '@/hooks/use-plugins';
import { cn } from '@/lib/utils';
import { registerCommandPaletteOpener } from './command-palette-trigger';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'plugin' | 'action';
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { plugins, startPlugin, stopPlugin } = usePlugins();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useFocusTrap({ isActive: isOpen });

  // 打开/关闭面板
  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  // 注册 opener，让外部可以调用
  useEffect(() => {
    registerCommandPaletteOpener(openPalette);
  }, [openPalette]);

  // Cmd+K 快捷键
  useHotkeys({
    keys: 'mod+k',
    callback: openPalette,
    description: '打开命令面板',
  });

  // ESC 关闭
  useHotkeys({
    keys: 'escape',
    callback: closePalette,
    enabled: isOpen,
  });

  // 构建命令列表
  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];

    // 导航命令
    items.push(
      {
        id: 'nav-home',
        label: '首页',
        icon: <Home size={16} />,
        action: () => {
          router.push('/');
          closePalette();
        },
        category: 'navigation',
        keywords: ['home', '主页', '首页'],
      },
      {
        id: 'nav-tools',
        label: '工具箱',
        icon: <Box size={16} />,
        action: () => {
          router.push('/tools');
          closePalette();
        },
        category: 'navigation',
        keywords: ['tools', '工具箱'],
      },
      {
        id: 'nav-installed',
        label: '我的插件',
        icon: <Box size={16} />,
        action: () => {
          router.push('/tools/installed');
          closePalette();
        },
        category: 'navigation',
        keywords: ['installed', '我的插件', '已安装'],
      },
      {
        id: 'nav-market',
        label: '插件市场',
        icon: <Package size={16} />,
        action: () => {
          router.push('/tools/market');
          closePalette();
        },
        category: 'navigation',
        keywords: ['market', '插件市场', '市场'],
      },
      {
        id: 'nav-docs',
        label: '文档',
        icon: <FileText size={16} />,
        action: () => {
          router.push('/docs');
          closePalette();
        },
        category: 'navigation',
        keywords: ['docs', '文档', '帮助'],
      }
    );

    // 已安装插件操作
    plugins.forEach((plugin) => {
      const isRunning = plugin.status === 'running';

      // 打开插件
      items.push({
        id: `plugin-open-${plugin.id}`,
        label: `打开 ${plugin.manifest.name}`,
        description: plugin.manifest.description,
        icon: <ArrowRight size={16} />,
        action: () => {
          router.push(`/plugin/${plugin.id}`);
          closePalette();
        },
        category: 'plugin',
        keywords: [plugin.manifest.name, plugin.manifest.description || '', '打开', 'open'],
      });

      // 启动/停止插件
      if (isRunning) {
        items.push({
          id: `plugin-stop-${plugin.id}`,
          label: `停止 ${plugin.manifest.name}`,
          icon: <Square size={16} />,
          action: async () => {
            await stopPlugin(plugin.id);
            closePalette();
          },
          category: 'action',
          keywords: [plugin.manifest.name, '停止', 'stop'],
        });
      } else {
        items.push({
          id: `plugin-start-${plugin.id}`,
          label: `启动 ${plugin.manifest.name}`,
          icon: <Play size={16} />,
          action: async () => {
            await startPlugin(plugin.id);
            closePalette();
          },
          category: 'action',
          keywords: [plugin.manifest.name, '启动', 'start'],
        });
      }
    });

    return items;
  }, [plugins, router, closePalette, startPlugin, stopPlugin]);

  // 搜索过滤
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const searchText = [
        cmd.label,
        cmd.description || '',
        ...(cmd.keywords || []),
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });
  }, [commands, query]);

  // 分组命令
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      plugin: [],
      action: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const categoryLabels = {
    navigation: '导航',
    plugin: '插件',
    action: '操作',
  };

  const categoryIcons = {
    navigation: '🧭',
    plugin: '🔌',
    action: '⚡',
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closePalette}
        aria-hidden="true"
      />

      {/* 命令面板 */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div
          ref={containerRef}
          className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-transform duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="命令面板"
        >
          {/* 搜索框 */}
          <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Search size={20} className="text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索插件、导航或操作..."
              className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 outline-none"
              autoFocus
              aria-label="搜索命令"
            />
            <kbd className="hidden sm:inline-block px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
              ESC
            </kbd>
          </div>

          {/* 命令列表 */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-neutral-500 dark:text-neutral-400">未找到匹配的命令</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedCommands).map(([category, items]) => {
                  if (items.length === 0) return null;

                  return (
                    <div key={category}>
                      {/* 分类标题 */}
                      <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        {categoryIcons[category as keyof typeof categoryIcons]}{' '}
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </div>

                      {/* 命令项 */}
                      {items.map((cmd) => {
                        const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                              isSelected
                                ? "bg-primary-50 dark:bg-primary-900/20"
                                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0",
                              isSelected ? "text-primary-600 dark:text-primary-400" : "text-neutral-600 dark:text-neutral-400"
                            )}>
                              {cmd.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-sm font-medium",
                                isSelected ? "text-primary-900 dark:text-primary-100" : "text-neutral-900 dark:text-neutral-100"
                              )}>
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <kbd className="flex-shrink-0 px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-xs font-medium text-primary-700 dark:text-primary-300 font-mono">
                                ↵
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                  ↑↓
                </kbd>
                导航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                  ↵
                </kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                  ESC
                </kbd>
                关闭
              </span>
            </div>
            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              {filteredCommands.length} 个结果
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
