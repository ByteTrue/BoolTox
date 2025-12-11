/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Package, CheckCircle, PauseCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../theme-provider";
import { getGlassStyle, getGlassShadow } from "@/utils/glass-layers";
import { cardHover } from "@/utils/animation-presets";
import type { ModuleStatsData } from "./types";

interface ModuleStatsProps {
  stats: ModuleStatsData;
}

export function ModuleStats({ stats }: ModuleStatsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const statsCards = [
    {
      label: "工具总数",
      value: stats.total,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "正在使用",
      value: stats.enabled,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "已停用",
      value: stats.disabled,
      icon: PauseCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            {...cardHover}
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.05, 
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1]
            }}
            className={`rounded-2xl border p-4 transition-shadow duration-250 ease-swift ${getGlassShadow(theme)}`}
            style={getGlassStyle('CARD', theme)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl ${card.bgColor} p-3`}>
                <Icon className={card.color} size={24} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
