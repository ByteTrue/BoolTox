/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import {
  PlayArrow,
  Stop,
  Download,
  MoreVert,
  Star,
  StarBorder,
  Schedule,
} from '@mui/icons-material';
import { formatDistanceToNow } from '@/utils/date';
import type { ModuleInstance } from '@/types/module';

interface ToolCardProps {
  tool: ModuleInstance;
  onOpen: (toolId: string) => void;
  onStop: (toolId: string) => void;
  onInstall?: (toolId: string) => void;
  onUninstall?: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
  onClick: (toolId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (toolId: string) => void;
  isInstalling?: boolean;
  isDev?: boolean;
}

export function ToolCard({
  tool,
  onOpen,
  onStop,
  onInstall,
  onToggleFavorite,
  onClick,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  isInstalling = false,
}: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { runtime, definition } = tool;
  const isInstalled = runtime.installed;
  const launchState = runtime.launchState;
  const isLaunching = launchState === 'launching';
  const isRunning = launchState === 'running';
  const isStopping = launchState === 'stopping';
  const isError = launchState === 'error';

  const runtimeType = definition.runtime?.type;
  const isExternalTool = runtimeType === 'cli' || runtimeType === 'binary';
  const canStop = isInstalled && isRunning && !isExternalTool && runtimeType === 'http-service';

  // 获取操作按钮文本和图标
  const getActionButton = () => {
    if (!isInstalled) {
      return {
        text: isInstalling ? '安装中...' : '安装工具',
        icon: isInstalling ? <CircularProgress size={16} /> : <Download />,
        onClick: () => onInstall?.(tool.id),
        variant: 'outlined' as const,
        color: 'primary' as const,
        disabled: isInstalling,
      };
    }

    if (canStop) {
      return {
        text: isStopping ? '停止中...' : '停止',
        icon: isStopping ? <CircularProgress size={16} /> : <Stop />,
        onClick: () => onStop(tool.id),
        variant: 'outlined' as const,
        color: 'error' as const,
        disabled: isStopping,
      };
    }

    return {
      text: isLaunching ? '启动中...' : '打开工具',
      icon: isLaunching ? <CircularProgress size={16} /> : <PlayArrow />,
      onClick: () => onOpen(tool.id),
      variant: 'outlined' as const,
      color: 'primary' as const,
      disabled: isLaunching,
    };
  };

  const actionButton = getActionButton();

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 3,
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme => (theme.palette as any).surfaceContainerHigh,
        '&:hover': {
          bgcolor: theme => (theme.palette as any).surfaceContainerHighest,
        },
      }}
    >
      {/* Hover时显示的勾选框 */}
      <Checkbox
        checked={isSelected}
        onChange={() => onSelect?.(tool.id)}
        onClick={e => e.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 2,
          opacity: isSelectionMode || isHovered ? 1 : 0,
          transition: 'opacity 0.2s',
          bgcolor: 'background.paper',
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      />

      {/* 运行状态徽章 */}
      {isRunning && (
        <Chip
          label="运行中"
          size="small"
          color="success"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            fontWeight: 600,
            height: 22,
            fontSize: '0.6875rem',
          }}
        />
      )}

      {/* 错误状态徽章 */}
      {isError && (
        <Chip
          label="启动失败"
          size="small"
          color="error"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            fontWeight: 600,
            height: 22,
            fontSize: '0.6875rem',
          }}
        />
      )}

      {/* 更新可用徽章 */}
      {runtime.updateAvailable && (
        <Tooltip title="有可用更新">
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              right: isRunning ? 80 : -4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              border: 2,
              borderColor: 'background.paper',
              zIndex: 3,
            }}
          />
        </Tooltip>
      )}

      <CardContent
        onClick={() => onClick(tool.id)}
        sx={{
          flex: 1,
          p: 3,
        }}
      >
        <Stack spacing={2.5}>
          {/* 头部: 图标 + 名称 + 收藏按钮 */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              src={definition.icon?.startsWith('http') ? definition.icon : undefined}
              variant="rounded"
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '1.75rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: 2,
              }}
            >
              {!definition.icon?.startsWith('http') && definition.name.slice(0, 2).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '1.125rem',
                  lineHeight: 1.3,
                  mb: 0.5,
                }}
              >
                {definition.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                 <Typography
                   variant="caption"
                   sx={{
                     bgcolor: theme => (theme.palette as any).surfaceContainerHighest,
                     color: 'text.secondary',
                     px: 1,
                     py: 0.25,
                     borderRadius: 1,
                     fontSize: '0.6875rem',
                   }}
                 >
                  v{definition.version}
                </Typography>
              </Stack>
            </Box>

            {isInstalled && (
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onToggleFavorite(tool.id);
                }}
                sx={{
                  color: tool.isFavorite ? 'warning.main' : 'action.disabled',
                  '&:hover': {
                    color: tool.isFavorite ? 'warning.dark' : 'action.active',
                  },
                }}
              >
                {tool.isFavorite ? <Star /> : <StarBorder />}
              </IconButton>
            )}
          </Stack>

          {/* 描述 */}
          {definition.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.6,
                minHeight: '3.2em',
                fontSize: '0.875rem',
              }}
            >
              {definition.description}
            </Typography>
          )}

          {/* 元信息 */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ minHeight: 24 }}>
            {definition.category && (
              <Chip
                label={definition.category}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: theme => (theme.palette as any).surfaceContainerHighest,
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              />
            )}

            {isInstalled && runtime.lastLaunchedAt && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto !important' }}>
                <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                  {formatDistanceToNow(runtime.lastLaunchedAt)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>

      {/* 操作按钮区 */}
      <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button
          fullWidth
          variant={actionButton.variant}
          color={actionButton.color}
          startIcon={actionButton.icon}
          onClick={e => {
            e.stopPropagation();
            actionButton.onClick();
          }}
          disabled={actionButton.disabled}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: 1,
          }}
        >
          {actionButton.text}
        </Button>

        <IconButton
          size="small"
          onClick={e => {
            e.stopPropagation();
            // TODO: 显示更多操作菜单
          }}
          sx={{
            ml: 1,
            color: 'text.secondary'
          }}
        >
          <MoreVert />
        </IconButton>
      </CardActions>
    </Card>
  );
}
