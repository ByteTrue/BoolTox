/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import { Trash2, Download, ExternalLink, Pin, Square, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/utils/date';
import type { ModuleInstance } from '@/types/module';

interface ModuleCardProps {
  module: ModuleInstance;
  onUninstall: (moduleId: string) => void;
  onOpen: (moduleId: string) => void;
  onStop: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  onPinToggle: (moduleId: string) => void;
  isDev?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (moduleId: string) => void;
}

export function ModuleCard({
  module,
  onUninstall,
  onOpen,
  onStop,
  onClick,
  onPinToggle,
  isDev = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: ModuleCardProps) {
  const launchState = module.runtime.launchState ?? 'idle';
  const isLaunching = launchState === 'launching';
  const isStopping = launchState === 'stopping';
  const isRunning = launchState === 'running';
  const isLaunchError = launchState === 'error';
  const isStandalone = module.definition.runtimeMode === 'standalone';

  const runtimeType = module.definition.runtime?.type;
  const isExternalTool = runtimeType === 'cli' || runtimeType === 'binary';

  const launchStateBadge = isLaunching
    ? { label: '启动中…', color: 'warning' as const }
    : isStopping
      ? { label: '停止中…', color: 'warning' as const }
      : isLaunchError
        ? { label: '启动失败', color: 'error' as const }
        : null;

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {/* 头部: 图标和状态 */}
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onChange={() => onSelect?.(module.id)}
                onClick={e => e.stopPropagation()}
                size="small"
              />
            )}

            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                bgcolor: 'action.selected',
                position: 'relative',
              }}
            >
              {module.runtime.updateAvailable && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                  }}
                  title="有可用更新"
                />
              )}

              {module.definition.icon && module.definition.icon.startsWith('http') ? (
                <Box
                  component="img"
                  src={module.definition.icon}
                  alt={module.definition.name}
                  sx={{ width: 36, height: 36, borderRadius: 1 }}
                  loading="lazy"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {module.definition.name.slice(0, 2).toUpperCase()}
                </Typography>
              )}
            </Box>
          </Box>

          {launchStateBadge && (
            <Chip label={launchStateBadge.label} color={launchStateBadge.color} size="small" />
          )}
        </Box>

        {/* 内容 */}
        <Box
          component="button"
          onClick={() => onClick(module.id)}
          sx={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            color="text.primary"
            sx={{ mb: 0.5, '&:hover': { color: 'primary.main' } }}
          >
            {module.definition.name}
          </Typography>
          {module.definition.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
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

        {/* 元信息 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            v{module.definition.version}
          </Typography>
          {module.definition.category && (
            <Chip
              label={module.definition.category}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {isStandalone && (
            <Chip label="外部窗口" size="small" color="secondary" variant="outlined" />
          )}
          {module.runtime.lastLaunchedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Clock size={12} />
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(module.runtime.lastLaunchedAt)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant={isRunning && !isExternalTool ? 'outlined' : 'contained'}
            color={isRunning && !isExternalTool ? 'error' : 'primary'}
            size="small"
            onClick={e => {
              e.stopPropagation();
              if (isRunning && !isExternalTool) {
                onStop(module.id);
              } else {
                onOpen(module.id);
              }
            }}
            disabled={isLaunching || isStopping}
            sx={{ flex: 1 }}
            startIcon={
              isLaunching || isStopping ? (
                <CircularProgress size={14} color="inherit" />
              ) : isRunning && !isExternalTool ? (
                <Square size={14} />
              ) : (
                <ExternalLink size={14} />
              )
            }
          >
            {isLaunching
              ? '启动中'
              : isStopping
                ? '停止中'
                : isRunning && !isExternalTool
                  ? '停止'
                  : '打开'}
          </Button>

          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              onPinToggle(module.id);
            }}
            color={module.isFavorite ? 'warning' : 'default'}
            title={module.isFavorite ? '取消收藏' : '收藏该工具'}
          >
            <Pin size={16} fill={module.isFavorite ? 'currentColor' : 'none'} />
          </IconButton>

          {!isDev && (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onUninstall(module.id);
              }}
              color="error"
              title="卸载工具"
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// 可用模块卡片 (未安装的模块)
interface AvailableModuleCardProps {
  module: {
    id: string;
    name: string;
    description?: string;
    version: string;
    category?: string;
    icon?: string;
  };
  onInstall: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  isInstalling?: boolean;
}

export function AvailableModuleCard({
  module,
  onInstall,
  onClick,
  isInstalling = false,
}: AvailableModuleCardProps) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {/* 头部: 图标 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: 'action.selected',
            }}
          >
            {module.icon && module.icon.startsWith('http') ? (
              <Box
                component="img"
                src={module.icon}
                alt={module.name}
                sx={{ width: 36, height: 36, borderRadius: 1 }}
                loading="lazy"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Typography variant="h6" fontWeight="bold">
                {module.name.slice(0, 2).toUpperCase()}
              </Typography>
            )}
          </Box>
        </Box>

        {/* 内容 */}
        <Box
          component="button"
          onClick={() => onClick(module.id)}
          sx={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            color="text.primary"
            sx={{ mb: 0.5, '&:hover': { color: 'primary.main' } }}
          >
            {module.name}
          </Typography>
          {module.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {module.description}
            </Typography>
          )}
        </Box>

        {/* 元信息 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            v{module.version}
          </Typography>
          {module.category && (
            <Chip label={module.category} size="small" color="primary" variant="outlined" />
          )}
        </Box>

        {/* 安装按钮 */}
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          onClick={e => {
            e.stopPropagation();
            onInstall(module.id);
          }}
          disabled={isInstalling}
          startIcon={
            isInstalling ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />
          }
        >
          {isInstalling ? '正在安装...' : '安装工具'}
        </Button>
      </CardContent>
    </Card>
  );
}
