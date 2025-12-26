/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { ChevronRight } from 'lucide-react';
import type { ModuleInstance } from '@/types/module';

export interface ModuleQuickCardProps {
  /** 模块实例 */
  module: ModuleInstance;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 模块快速卡片组件
 * 用于快速启动面板和最近使用模块展示
 */
export function ModuleQuickCard({ module, onClick }: ModuleQuickCardProps) {
  const isLoading = module.runtime.loading;
  const launchState = module.runtime.launchState ?? 'idle';
  const isRunning = launchState === 'running';

  return (
    <Card
      sx={{
        minHeight: 140,
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: '100%',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {/* 顶部区域 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
            mb: 'auto',
          }}
        >
          {/* 模块图标 */}
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              fontSize: '1.5rem',
              bgcolor: isRunning ? 'success.main' : 'action.hover',
              boxShadow: 1,
            }}
          >
            {module.definition.icon}
          </Box>

          {/* 状态指示器 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading ? (
              <CircularProgress size={8} color="warning" />
            ) : isRunning ? (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'action.disabled',
                }}
              />
            )}
          </Box>
        </Box>

        {/* 模块信息 */}
        <Box sx={{ mt: 2, width: '100%' }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ color: 'text.primary' }}>
            {module.definition.name}
          </Typography>

          {module.definition.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {module.definition.description}
            </Typography>
          )}
        </Box>

        {/* 底部标签 */}
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Chip
            label={isLoading ? '加载中...' : isRunning ? '运行中' : '未启动'}
            size="small"
            color={isRunning ? 'success' : 'default'}
            variant={isRunning ? 'filled' : 'outlined'}
            sx={{ height: 20, fontSize: '0.7rem' }}
          />

          {module.definition.category && (
            <Chip
              label={`${getCategoryEmoji(module.definition.category)} ${getCategoryLabel(module.definition.category)}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}

          <Box sx={{ ml: 'auto' }}>
            <ChevronRight size={16} />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

/**
 * 获取分类对应的 emoji
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    productivity: '⚡',
    design: '🎨',
    utility: '🛠️',
    entertainment: '🎮',
    development: '💻',
    system: '⚙️',
  };
  return emojiMap[category] || '📦';
}

/**
 * 获取分类的显示名称
 */
function getCategoryLabel(category: string): string {
  const labelMap: Record<string, string> = {
    productivity: '效率',
    design: '设计',
    utility: '工具',
    entertainment: '娱乐',
    development: '开发',
    system: '系统',
  };
  return labelMap[category] || category;
}
