/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import React from "react";
import {
  LayoutGrid,
  ShoppingBag,
  Star,
  Hash,
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// 辅助函数：生成简单的类名合并
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
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
        "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? isDark
            ? "bg-blue-500/20 text-blue-400"
            : "bg-blue-50 text-blue-600"
          : isDark
            ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(
          "transition-colors",
          active ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"
        )}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={cn(
          "text-xs",
          active
            ? "text-blue-500"
            : isDark ? "text-slate-600" : "text-slate-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

interface ModuleSidebarProps {
  currentView: string; // 'installed' | 'store' | 'favorites' | 'all'
  currentCategory: string; // 'all' | categoryName
  onViewChange: (view: string) => void;
  onCategoryChange: (category: string) => void;
  stats: {
    installed: number;
    store: number;
    favorites: number;
  };
  categories: string[];
}

export function ModuleSidebar({
  currentView,
  currentCategory,
  onViewChange,
  onCategoryChange,
  stats,
  categories,
}: ModuleSidebarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={cn(
      "flex h-full w-60 flex-col gap-6 border-r px-4 py-6",
      isDark ? "border-white/10" : "border-slate-200"
    )}>
      {/* 核心导航 */}
      <div className="space-y-1">
        <h3 className={cn(
          "mb-2 px-3 text-xs font-semibold uppercase tracking-wider",
          isDark ? "text-slate-500" : "text-slate-400"
        )}>
          库
        </h3>

        <SidebarItem
          icon={<LayoutGrid size={18} />}
          label="已安装"
          active={currentView === 'installed'}
          count={stats.installed}
          onClick={() => onViewChange('installed')}
          isDark={isDark}
        />
        <SidebarItem
          icon={<Star size={18} />}
          label="我的收藏"
          active={currentView === 'favorites'}
          count={stats.favorites}
          onClick={() => onViewChange('favorites')}
          isDark={isDark}
        />
      </div>

      {/* 发现 */}
      <div className="space-y-1">
        <h3 className={cn(
          "mb-2 px-3 text-xs font-semibold uppercase tracking-wider",
          isDark ? "text-slate-500" : "text-slate-400"
        )}>
          发现
        </h3>
        <SidebarItem
          icon={<ShoppingBag size={18} />}
          label="工具商店"
          active={currentView === 'store'}
          count={stats.store}
          onClick={() => onViewChange('store')}
          isDark={isDark}
        />
      </div>

      {/* 分类 */}
      <div className="flex-1 overflow-y-auto space-y-1 elegant-scroll pr-2">
        <h3 className={cn(
          "mb-2 px-3 text-xs font-semibold uppercase tracking-wider",
          isDark ? "text-slate-500" : "text-slate-400"
        )}>
          分类
        </h3>

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
