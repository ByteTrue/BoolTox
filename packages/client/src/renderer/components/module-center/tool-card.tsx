/**
 * ToolCard - 惊艳版
 * 特性：悬停升起、图标渐变、呼吸灯、精致动画
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme, keyframes } from '@mui/material/styles';
import {
  PlayArrowRounded,
  StarBorderRounded,
  StarRounded,
  StopRounded,
  DownloadRounded,
} from '@mui/icons-material';
import type { ModuleInstance } from '@/types/module';

// 呼吸灯脉冲动画
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
`;

// 微光闪烁动画
const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

interface ToolCardProps {
  tool: ModuleInstance;
  onOpen: (toolId: string) => void;
  onStop: (toolId: string) => void;
  onInstall?: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
  onClick: (toolId: string) => void;
  isInstalling?: boolean;
}

export function ToolCard({
  tool,
  onOpen,
  onStop,
  onInstall,
  onToggleFavorite,
  onClick,
  isInstalling = false,
}: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { runtime, definition } = tool;
  const isInstalled = runtime.installed;
  const isRunning = runtime.launchState === 'running';
  // 所有已安装且运行中的工具都可以停止（http-service、standalone、binary）
  const canStop = isInstalled && isRunning;

  // 双品牌色渐变 - 蓝色 + 橙色
  const brandGradient = isDark
    ? 'linear-gradient(135deg, #60A5FA 0%, #F97316 100%)'
    : 'linear-gradient(135deg, #3B82F6 0%, #F97316 100%)';

  // 浅色模式下 shimmer 使用黑色渐变
  const shimmerColor = isDark ? alpha('#fff', 0.3) : alpha('#000', 0.15);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(tool.id)}
      sx={{
        position: 'relative',
        p: 2.5,
        borderRadius: 3,
        cursor: 'pointer',
        bgcolor: isDark ? alpha('#fff', 0.02) : '#ffffff',
        border: '1px solid',
        borderColor: isHovered
          ? isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2)
          : isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
        // 悬停升起效果
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        // 柔和的光晕效果
        boxShadow: isHovered
          ? isDark
            ? `0 8px 24px ${alpha('#000', 0.4)}, 0 0 20px ${alpha(theme.palette.primary.main, 0.15)}`
            : `0 8px 24px ${alpha('#000', 0.06)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
          : isDark
            ? 'none'
            : `0 1px 3px ${alpha('#000', 0.04)}`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 主内容 */}
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* 图标 - 渐变背景 */}
        <Box
          sx={{
            position: 'relative',
            width: 48,
            height: 48,
            borderRadius: 2.5,
            // 渐变背景：运行时用品牌渐变，否则深色用白色渐变，浅色用黑色渐变
            background: isRunning
              ? brandGradient
              : isDark
                ? `linear-gradient(135deg, ${alpha('#fff', 0.08)} 0%, ${alpha('#fff', 0.04)} 100%)`
                : `linear-gradient(135deg, ${alpha('#000', 0.06)} 0%, ${alpha('#000', 0.02)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: 700,
            // 文字颜色：运行时白色，否则深色模式用浅色，浅色模式用深色
            color: isRunning ? '#fff' : isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7),
            flexShrink: 0,
            transition: 'all 0.3s ease',
            // 悬停时的微光效果：深色用白色shimmer，浅色用黑色shimmer
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
              backgroundSize: '200% 100%',
              animation: isHovered ? `${shimmer} 1.5s infinite` : 'none',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
            },
          }}
        >
          {definition.icon?.startsWith('http') ? (
            <Box
              component="img"
              src={definition.icon}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                position: 'relative',
                zIndex: 1,
              }}
            />
          ) : (
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {definition.name.slice(0, 2)}
            </Typography>
          )}
        </Box>

        {/* 信息 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {definition.name}
            </Typography>
            {/* 运行状态呼吸灯 */}
            {isRunning && (
              <Box
                sx={{
                  position: 'relative',
                  width: 8,
                  height: 8,
                  // 呼吸灯外圈
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    bgcolor: alpha('#10B981', 0.3),
                    animation: `${pulse} 2s ease-in-out infinite`,
                  },
                  // 呼吸灯内核
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    boxShadow: `0 0 8px ${alpha('#10B981', 0.6)}`,
                  },
                }}
              />
            )}
            {tool.isFavorite && (
              <StarRounded
                sx={{
                  fontSize: 14,
                  color: '#F59E0B',
                  filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))',
                }}
              />
            )}
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: 'text.tertiary',
              display: 'block',
              mt: 0.25,
            }}
          >
            {definition.category} · v{definition.version}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 1,
              fontSize: '0.8rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {definition.description || '暂无描述'}
          </Typography>
        </Box>

        {/* 操作按钮 */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(8px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* 安装按钮 - 未安装时显示 */}
          {!isInstalled && onInstall && (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onInstall(tool.id);
              }}
              disabled={isInstalling}
              title="安装"
              sx={{
                width: 32,
                height: 32,
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              {isInstalling ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DownloadRounded sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          )}
          {/* 停止按钮 - 运行中时显示 */}
          {canStop && (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onStop(tool.id);
              }}
              title="停止"
              sx={{
                width: 32,
                height: 32,
                color: '#EF4444',
                bgcolor: alpha('#EF4444', 0.1),
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha('#EF4444', 0.2),
                  transform: 'scale(1.05)',
                },
              }}
            >
              <StopRounded sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {/* 打开按钮 - 已安装时显示 */}
          {isInstalled && (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpen(tool.id);
              }}
              title={isRunning ? '聚焦窗口' : '打开工具'}
              sx={{
                width: 32,
                height: 32,
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.05)',
                },
              }}
            >
              <PlayArrowRounded sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {/* 收藏按钮 - 仅已安装时显示 */}
          {isInstalled && (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onToggleFavorite(tool.id);
              }}
              title={tool.isFavorite ? '取消收藏' : '收藏'}
              sx={{
                width: 32,
                height: 32,
                color: tool.isFavorite ? '#F59E0B' : 'text.tertiary',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: tool.isFavorite
                    ? alpha('#F59E0B', 0.1)
                    : isDark ? alpha('#fff', 0.08) : alpha('#000', 0.06),
                  transform: 'scale(1.05)',
                  color: '#F59E0B',
                },
              }}
            >
              {tool.isFavorite ? (
                <StarRounded sx={{ fontSize: 18 }} />
              ) : (
                <StarBorderRounded sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
