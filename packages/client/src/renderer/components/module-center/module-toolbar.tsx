import { Search, SlidersHorizontal, ArrowUpDown, Grid3x3, List, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../theme-provider";
import { CustomSelect } from "./custom-select";
import { getGlassStyle, getGlassShadow } from "@/utils/glass-layers";
import { iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";
import type { SortBy, ViewMode } from "./types";

interface ModuleToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ModuleToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  categories,
  selectedCategory,
  onCategoryChange,
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
            placeholder="搜索模块..."
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
          {/* 分类过滤 */}
          <CustomSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            options={[
              { value: "all", label: "全部分类" },
              ...categories.map((cat) => ({ value: cat, label: cat })),
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

          {/* 视图切换 */}
          <div className="flex rounded-full border" style={getGlassStyle('BUTTON', theme)}>
            <motion.button
              {...buttonInteraction}
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`rounded-l-full px-3 py-2 transition-[background-color,color,box-shadow] duration-250 ease-swift ${
                viewMode === "grid"
                  ? "text-blue-500"
                  : isDark
                    ? "text-white/60 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
              }`}
              style={viewMode === "grid" ? {
                background: isDark 
                  ? 'rgba(101, 187, 233, 0.25)' 
                  : 'rgba(101, 187, 233, 0.20)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(101, 187, 233, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                  : '0 2px 10px rgba(101, 187, 233, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
              } : undefined}
              title="网格视图"
            >
              <Grid3x3 size={16} />
            </motion.button>
            <motion.button
              {...buttonInteraction}
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`rounded-r-full px-3 py-2 transition-[background-color,color,box-shadow] duration-250 ease-swift ${
                viewMode === "list"
                  ? "text-blue-500"
                  : isDark
                    ? "text-white/60 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
              }`}
              style={viewMode === "list" ? {
                background: isDark 
                  ? 'rgba(101, 187, 233, 0.25)' 
                  : 'rgba(101, 187, 233, 0.20)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(101, 187, 233, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                  : '0 2px 10px rgba(101, 187, 233, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
              } : undefined}
              title="列表视图"
            >
              <List size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
