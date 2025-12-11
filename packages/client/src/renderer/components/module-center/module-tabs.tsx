/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from "framer-motion";
import { Package, ShoppingBag } from "lucide-react";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow } from "@/utils/glass-layers";
import type { ModuleTab } from "./types";

interface ModuleTabsProps {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  counts: {
    installed: number;
    store: number;
  };
}

export function ModuleTabs({ activeTab, onTabChange, counts }: ModuleTabsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const tabs: Array<{ id: ModuleTab; label: string; icon: typeof Package; count: number }> = [
    { id: "installed", label: "已安装工具", icon: Package, count: counts.installed },
    { id: "store", label: "工具商店", icon: ShoppingBag, count: counts.store },
  ];

  return (
    <div
      className={`relative z-10 rounded-2xl border p-2 transition-[background-color,border-color,color] duration-250 ease-swift ${getGlassShadow(theme)} gpu-accelerated`}
      style={getGlassStyle('CARD', theme)}
    >
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              whileHover={!isActive ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-250 ease-swift animate-optimized ${
                isActive
                  ? isDark 
                    ? "text-white" 
                    : "text-slate-800"
                  : isDark
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-800 hover:bg-black/5"
              }`}
            >
              {/* 激活背景 */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl layout-animate"
                  style={{
                    ...getGlassStyle('ACTIVE', theme === 'dark' ? 'dark' : 'light', {
                      withBorderGlow: true,
                      withInnerShadow: true,
                    }),
                    // 增强激活状态的层次感
                    boxShadow: theme === 'dark'
                      ? '0 2px 8px rgba(0, 0, 0, 0.4), 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                      : '0 2px 12px rgba(0, 0, 0, 0.12), 0 0.5px 0 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* 内容 */}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={18} />
                {tab.label}
                {/* 计数徽章 */}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-blue-500/20 text-blue-600"
                      : isDark
                        ? "bg-white/10 text-white/60"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
