/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Search, SlidersHorizontal, ArrowUpDown, X, Plus, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../theme-provider";
import { CustomSelect } from "./custom-select";
import { getGlassStyle, getGlassShadow } from "@/utils/glass-layers";
import { iconButtonInteraction } from "@/utils/animation-presets";
import type { SortBy } from "./types";

interface ModuleToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddLocalTool?: () => void; // 新增：添加本地工具回调
  isSelectionMode?: boolean; // 是否为选择模式
  onToggleSelectionMode?: () => void; // 切换选择模式
}

export function ModuleToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onAddLocalTool,
  isSelectionMode = false,
  onToggleSelectionMode,
}: ModuleToolbarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`relative z-20 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-250 ease-swift ${getGlassShadow(theme)}`}
      style={getGlassStyle('CARD', theme)}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? "text-white/60" : "text-slate-500"
            }`}
            size={18}
          />
          <input
            type="text"
            placeholder="搜索工具..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full rounded-full border py-2 pl-10 pr-10 text-sm transition-[background-color,border-color,box-shadow] duration-250 ease-swift focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDark
                ? "bg-white/5 text-white placeholder:text-white/60"
                : "bg-white/50 text-slate-800 placeholder:text-slate-500"
            }`}
            style={getGlassStyle('BUTTON', theme)}
          />
          {searchQuery && (
            <motion.button
              {...iconButtonInteraction}
              type="button"
              onClick={() => onSearchChange("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-[background-color,color] duration-250 ease-swift hover:bg-white/10 ${
                isDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <X size={14} />
            </motion.button>
          )}
        </div>

        {/* 右侧控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 选择模式按钮 */}
          {onToggleSelectionMode && (
            <motion.button
              {...iconButtonInteraction}
              onClick={onToggleSelectionMode}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-250 ease-swift ${
                isSelectionMode
                  ? "border-blue-500/50 bg-blue-500/20 text-blue-500"
                  : isDark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80"
              }`}
              style={getGlassStyle('BUTTON', theme)}
            >
              <CheckSquare size={16} />
              <span>{isSelectionMode ? "取消选择" : "选择"}</span>
            </motion.button>
          )}

          {/* 添加本地工具按钮 */}
          {onAddLocalTool && !isSelectionMode && (
            <motion.button
              {...iconButtonInteraction}
              onClick={onAddLocalTool}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-250 ease-swift ${
                isDark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80"
              }`}
              style={getGlassStyle('BUTTON', theme)}
            >
              <Plus size={16} />
              <span>添加本地工具</span>
            </motion.button>
          )}

          {/* 分类过滤 */}
          <CustomSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            options={[
              { value: "all", label: "全部分类" },
              ...categories.map((cat) => ({ value: cat, label: cat || "未分类" })),
            ]}
            icon={<SlidersHorizontal size={16} />}
          />

          {/* 排序 */}
          <CustomSelect
            value={sortBy}
            onChange={(val) => onSortChange(val as SortBy)}
            options={[
              { value: "default", label: "默认排序" },
              { value: "name", label: "按名称" },
              { value: "updatedAt", label: "按更新时间" },
            ]}
            icon={<ArrowUpDown size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
