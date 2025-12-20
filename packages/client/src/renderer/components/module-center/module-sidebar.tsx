/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import React from 'react';
import {
  LayoutGrid,
  Star,
  Hash,
  ChevronRight,
  Store,
  Package,
  Plus,
  Play,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import type { ToolSourceConfig } from '@booltox/shared';

// 辅助函数：生成简单的类名合并
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  isDark: boolean;
}

function SidebarItem({ icon, label, active, count, onClick, isDark }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        active
          ? isDark
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-blue-50 text-blue-600'
          : isDark
            ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'transition-colors',
            active ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'
          )}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span
          className={cn(
            'text-xs',
            active ? 'text-blue-500' : isDark ? 'text-slate-600' : 'text-slate-400'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// 区域标题组件
function SectionHeader({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <h3
      className={cn(
        'mb-2 px-3 text-xs font-semibold uppercase tracking-wider',
        isDark ? 'text-slate-500' : 'text-slate-400'
      )}
    >
      {children}
    </h3>
  );
}

interface ModuleSidebarProps {
  currentView: string; // 'installed' | 'store' | 'official' | 'custom' | 'favorites' | 'running' | 'source:xxx'
  currentCategory: string; // 'all' | categoryName
  onViewChange: (view: string) => void;
  onCategoryChange: (category: string) => void;
  onAddToolSource?: () => void;
  stats: {
    installed: number;
    store: number;
    official: number;
    custom: number;
    favorites: number;
    running: number; // 新增
    sourceCount?: Record<string, number>; // 新增：每个源的工具数
  };
  categories: string[];
  toolSources?: ToolSourceConfig[]; // 新增：工具源列表
}

export function ModuleSidebar({
  currentView,
  currentCategory,
  onViewChange,
  onCategoryChange,
  onAddToolSource,
  stats,
  categories,
  toolSources = [],
}: ModuleSidebarProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 过滤自定义工具源（非官方的远程源，排除本地源）
  const customSources = toolSources.filter(
    s => s.id !== 'official' && s.type === 'remote' && !s.localPath // 额外保险：排除有 localPath 的源
  );

  return (
    <div
      className={cn(
        'flex h-full w-60 flex-col gap-6 border-r px-4 py-6',
        isDark ? 'border-white/10' : 'border-slate-200'
      )}
    >
      {/* 区域 1: 我的工具 */}
      <div className="space-y-1">
        <SectionHeader isDark={isDark}>📦 我的工具</SectionHeader>

        <SidebarItem
          icon={<LayoutGrid size={18} />}
          label="全部已安装"
          active={currentView === 'installed'}
          count={stats.installed}
          onClick={() => onViewChange('installed')}
          isDark={isDark}
        />

        <SidebarItem
          icon={<Star size={18} />}
          label="收藏"
          active={currentView === 'favorites'}
          count={stats.favorites}
          onClick={() => onViewChange('favorites')}
          isDark={isDark}
        />

        <SidebarItem
          icon={<Play size={18} />}
          label="运行中"
          active={currentView === 'running'}
          count={stats.running}
          onClick={() => onViewChange('running')}
          isDark={isDark}
        />
      </div>

      {/* 区域 2: 工具市场 */}
      <div
        className="space-y-1 border-t pt-4"
        style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
      >
        <SectionHeader isDark={isDark}>🛍️ 工具市场</SectionHeader>

        {/* 浏览工具源子标题 */}
        <div className={cn('px-3 mb-1 text-xs', isDark ? 'text-slate-600' : 'text-slate-500')}>
          📂 浏览工具源
        </div>

        <SidebarItem
          icon={<Store size={18} />}
          label="官方工具库"
          active={currentView === 'official'}
          count={stats.official}
          onClick={() => onViewChange('official')}
          isDark={isDark}
        />

        {/* 动态显示自定义工具源 */}
        {customSources.map(source => (
          <SidebarItem
            key={source.id}
            icon={<Package size={18} />}
            label={source.name}
            active={currentView === `source:${source.id}`}
            count={stats.sourceCount?.[source.id] || 0}
            onClick={() => onViewChange(`source:${source.id}`)}
            isDark={isDark}
          />
        ))}

        {/* 添加工具源按钮 */}
        {onAddToolSource && (
          <button
            onClick={onAddToolSource}
            className={cn(
              'mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isDark
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            )}
          >
            <Plus size={18} />
            <span>添加工具源</span>
          </button>
        )}
      </div>

      {/* 区域 3: 工具源管理 */}
      <div
        className="border-t pt-4"
        style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
      >
        <SectionHeader isDark={isDark}>管理</SectionHeader>

        <button
          onClick={() => navigate('/tools/sources')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isDark
              ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Settings size={18} />
          <span>工具源</span>
        </button>
      </div>

      {/* 分类过滤 */}
      <div
        className="flex-1 overflow-y-auto space-y-1 elegant-scroll pr-2 border-t pt-4"
        style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
      >
        <SectionHeader isDark={isDark}>分类</SectionHeader>

        <SidebarItem
          icon={<Hash size={18} />}
          label="全部"
          active={currentCategory === 'all'}
          onClick={() => onCategoryChange('all')}
          isDark={isDark}
        />

        {categories.map(category => (
          <SidebarItem
            key={category}
            icon={<ChevronRight size={16} />}
            label={category}
            active={currentCategory === category}
            onClick={() => onCategoryChange(category)}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
}
