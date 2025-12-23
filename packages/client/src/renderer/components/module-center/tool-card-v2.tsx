/**
 * ToolCard V2 - Material Design 3 现代化设计
 * 展示 MUI 的真正能力
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PlayArrow,
  MoreHoriz,
  Star,
  StarBorder,
  Circle,
} from '@mui/icons-material';
import type { ModuleInstance } from '@/types/module';

// 根据工具名称生成渐变色
function getToolGradient(name: string, isDark: boolean): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  if (isDark) {
    return `linear-gradient(135deg, hsl(${hue}, 70%, 25%) 0%, hsl(${(hue + 30) % 360}, 60%, 20%) 100%)`;
  }
  return `linear-gradient(135deg, hsl(${hue}, 80%, 65%) 0%, hsl(${(hue + 30) % 360}, 70%, 55%) 100%)`;
}

// 获取图标背景色
function getIconBgColor(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CEC9',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

interface ToolCardV2Props {
  tool: ModuleInstance;
  onOpen: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
  onClick: (toolId: string) => void;
}

export function ToolCardV2({
  tool,
  onOpen,
  onToggleFavorite,
  onClick,
}: ToolCardV2Props) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { runtime, definition } = tool;
  const isRunning = runtime.launchState === 'running';
  const iconBg = getIconBgColor(definition.name);
  const cardGradient = getToolGradient(definition.name, isDark);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(tool.id)}
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        background: cardGradient,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 40px ${alpha(iconBg, 0.3)}`,
        },
      }}
    >
      {/* 顶部装饰 */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: alpha('#fff', isDark ? 0.05 : 0.15),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: alpha('#fff', isDark ? 0.03 : 0.1),
        }}
      />

      {/* 主内容区 */}
      <Box sx={{ p: 2.5, flex: 1, position: 'relative', zIndex: 1 }}>
        {/* 头部：图标 + 操作按钮 */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          {/* 图标 */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alpha('#fff', isDark ? 0.15 : 0.9),
              backdropFilter: 'blur(10px)',
              boxShadow: `0 4px 12px ${alpha('#000', 0.1)}`,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: iconBg,
            }}
          >
            {definition.icon?.startsWith('http') ? (
              <Box
                component="img"
                src={definition.icon}
                sx={{ width: 36, height: 36, borderRadius: 1 }}
              />
            ) : (
              definition.name.slice(0, 2)
            )}
          </Box>

          {/* 操作按钮组 */}
          <Stack direction="row" spacing={0.5}>
            <Fade in={isHovered}>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onToggleFavorite(tool.id);
                }}
                sx={{
                  color: tool.isFavorite ? '#FFD700' : alpha('#fff', 0.7),
                  bgcolor: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.2),
                  },
                }}
              >
                {tool.isFavorite ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
              </IconButton>
            </Fade>
            <Fade in={isHovered}>
              <IconButton
                size="small"
                sx={{
                  color: alpha('#fff', 0.7),
                  bgcolor: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.2),
                  },
                }}
              >
                <MoreHoriz fontSize="small" />
              </IconButton>
            </Fade>
          </Stack>
        </Stack>

        {/* 标题和描述 */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#fff',
                fontSize: '1.1rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {definition.name}
            </Typography>
            {isRunning && (
              <Tooltip title="运行中">
                <Circle sx={{ fontSize: 10, color: '#4ADE80' }} />
              </Tooltip>
            )}
          </Stack>
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: alpha('#fff', 0.8),
              fontSize: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {definition.description || '暂无描述'}
          </Typography>
        </Box>
      </Box>

      {/* 底部操作栏 */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: alpha('#000', isDark ? 0.2 : 0.1),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {definition.category && (
            <Chip
              label={definition.category}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha('#fff', 0.15),
                color: '#fff',
                '& .MuiChip-label': { px: 1.5 },
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{ color: alpha('#fff', 0.6), fontSize: '0.7rem' }}
          >
            v{definition.version}
          </Typography>
        </Stack>

        {/* 打开按钮 */}
        <IconButton
          onClick={e => {
            e.stopPropagation();
            onOpen(tool.id);
          }}
          sx={{
            bgcolor: alpha('#fff', 0.2),
            color: '#fff',
            '&:hover': {
              bgcolor: alpha('#fff', 0.3),
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <PlayArrow />
        </IconButton>
      </Box>
    </Card>
  );
}
