/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Flame, Sparkles, Lightbulb } from 'lucide-react';
import { HorizontalScroll } from '../ui/horizontal-scroll';
import { AvailableModuleCard } from './module-card';
import type { RecommendedModules } from './types';

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
  const sections = [
    {
      id: 'popular',
      title: '🔥 热门推荐',
      description: '最受欢迎的工具',
      icon: Flame,
      modules: recommendations.popular,
    },
    {
      id: 'newReleases',
      title: '🆕 新发布',
      description: '最近7天内发布的新工具',
      icon: Sparkles,
      modules: recommendations.newReleases,
    },
    {
      id: 'smart',
      title: '💡 智能推荐',
      description: '基于您已安装的工具推荐',
      icon: Lightbulb,
      modules: recommendations.smart,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {sections.map(section => {
        if (section.modules.length === 0) return null;

        return (
          <Box key={section.id}>
            {/* 区域标题 */}
            <Box
              sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </Box>
              <Chip
                label={`${section.modules.length} 个工具`}
                size="small"
                sx={{ bgcolor: 'action.hover' }}
              />
            </Box>

            {/* 横向滚动卡片列表 */}
            <HorizontalScroll>
              {section.modules.map(module => (
                <Box key={module.id} sx={{ width: 320, flexShrink: 0 }}>
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
                </Box>
              ))}
            </HorizontalScroll>
          </Box>
        );
      })}

      {/* 如果所有推荐都为空 */}
      {recommendations.popular.length === 0 &&
        recommendations.newReleases.length === 0 &&
        recommendations.smart.length === 0 && (
          <Box
            sx={{
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              暂无推荐工具
            </Typography>
          </Box>
        )}
    </Box>
  );
}
