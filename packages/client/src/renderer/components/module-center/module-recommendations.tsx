/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Flame, Sparkles, Lightbulb } from "lucide-react";
import { useTheme } from "../theme-provider";
import { HorizontalScroll } from "../ui/horizontal-scroll";
import { AvailableModuleCard } from "./module-card";
import { GLASS_BORDERS } from "@/utils/glass-layers";
import type { RecommendedModules } from "./types";

interface ModuleRecommendationsProps {
  recommendations: RecommendedModules;
  onInstall: (moduleId: string) => void;
  onCardClick: (moduleId: string) => void;
  processingModuleId: string | null;
}

export function ModuleRecommendations({
  recommendations,
  onInstall,
  onCardClick,
  processingModuleId,
}: ModuleRecommendationsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sections = [
    {
      id: "popular",
      title: "🔥 热门推荐",
      description: "最受欢迎的工具",
      icon: Flame,
      modules: recommendations.popular,
    },
    {
      id: "newReleases",
      title: "🆕 新发布",
      description: "最近7天内发布的新工具",
      icon: Sparkles,
      modules: recommendations.newReleases,
    },
    {
      id: "smart",
      title: "💡 智能推荐",
      description: "基于您已安装的工具推荐",
      icon: Lightbulb,
      modules: recommendations.smart,
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        if (section.modules.length === 0) return null;

        return (
          <div key={section.id}>
            {/* 区域标题 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}
                >
                  {section.title}
                </h3>
                <span
                  className={`text-sm ${
                    isDark ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  {section.description}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isDark
                    ? "bg-white/10 text-white/80"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {section.modules.length} 个工具
              </span>
            </div>

            {/* 横向滚动卡片列表 */}
            <HorizontalScroll>
              {section.modules.map((module) => (
                <div key={module.id} className="w-80 flex-shrink-0">
                  <AvailableModuleCard
                    module={{
                      id: module.id,
                      name: module.name,
                      description: module.description,
                      version: module.version,
                      category: module.category,
                      icon: module.icon,
                    }}
                    onInstall={onInstall}
                    onClick={onCardClick}
                    isInstalling={processingModuleId === module.id}
                  />
                </div>
              ))}
            </HorizontalScroll>
          </div>
        );
      })}

      {/* 如果所有推荐都为空 */}
      {recommendations.popular.length === 0 &&
        recommendations.newReleases.length === 0 &&
        recommendations.smart.length === 0 && (
          <div
            className={`rounded-2xl border border-dashed p-8 text-center ${
              isDark ? "text-white/60" : "text-slate-500"
            }`}
            style={{
              borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
            }}
          >
            <p>暂无推荐工具</p>
          </div>
        )}
    </div>
  );
}
