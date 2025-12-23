/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { Trash2, Download, ExternalLink, Square } from 'lucide-react';
import type { ModuleInstance, ModuleDefinition } from '@/types/module';

interface ModuleListItemProps {
  module: ModuleInstance | ModuleDefinition;
  onUninstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  onStop?: (moduleId: string) => void;
  onInstall?: (moduleId: string) => void;
  onClick: (moduleId: string) => void;
  isProcessing?: boolean;
  isDev?: boolean;
}

export function ModuleListItem({
  module,
  onUninstall,
  onOpen,
  onStop,
  onInstall,
  onClick,
  isProcessing = false,
  isDev = false,
}: ModuleListItemProps) {
  const isInstalled = 'definition' in module;
  const definition = 'definition' in module ? module.definition : module;
  const launchState = 'definition' in module ? (module.runtime.launchState ?? 'idle') : 'idle';
  const isLaunching = launchState === 'launching';
  const isStopping = launchState === 'stopping';
  const isRunning = launchState === 'running';
  const isLaunchError = launchState === 'error';

  const runtimeType = definition.runtime?.type;
  const isExternalTool = runtimeType === 'cli' || runtimeType === 'binary';

  const launchStateBadge = isInstalled
    ? isLaunching
      ? { label: '启动中…', color: 'warning' as const }
      : isStopping
        ? { label: '停止中…', color: 'warning' as const }
        : isLaunchError
          ? { label: '启动失败', color: 'error' as const }
          : null
    : null;

  return (
    <Paper
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      {/* 左侧: 图标 */}
      <Box
        sx={{
          width: 56,
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: 'primary.main',
          opacity: 0.1,
        }}
      >
        {definition.icon && definition.icon.startsWith('http') ? (
          <Box
            component="img"
            src={definition.icon}
            alt={definition.name}
            sx={{ width: 36, height: 36, borderRadius: 1 }}
            loading="lazy"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {definition.name.slice(0, 2).toUpperCase()}
          </Typography>
        )}
      </Box>

      {/* 中间: 主要信息 */}
      <Box
        component="button"
        onClick={() => onClick(module.id)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          p: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            {definition.name}
          </Typography>
          {launchStateBadge && (
            <Chip label={launchStateBadge.label} color={launchStateBadge.color} size="small" />
          )}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {definition.description || '暂无描述'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            v{definition.version}
          </Typography>
          {definition.category && (
            <Chip label={definition.category} size="small" color="primary" variant="outlined" />
          )}
          {definition.author && (
            <Typography variant="caption" color="text.secondary">
              {definition.author}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 右侧: 操作按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {isInstalled ? (
          <>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpen?.(module.id);
              }}
              disabled={isLaunching || isStopping}
              color="primary"
              title={
                isLaunching
                  ? '工具正在启动…'
                  : isStopping
                    ? '工具正在停止…'
                    : isRunning
                      ? '聚焦已打开的窗口'
                      : '打开工具'
              }
            >
              {isLaunching || isStopping ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ExternalLink size={16} />
              )}
            </IconButton>

            {isRunning && (
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onStop?.(module.id);
                }}
                color="warning"
                title={isExternalTool ? '我已关闭工具（标记为已停止）' : '停止工具'}
              >
                <Square size={16} />
              </IconButton>
            )}

            {!isDev && (
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onUninstall?.(module.id);
                }}
                color="error"
                title="卸载工具"
              >
                <Trash2 size={16} />
              </IconButton>
            )}
          </>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={e => {
              e.stopPropagation();
              onInstall?.(module.id);
            }}
            disabled={isProcessing}
            startIcon={
              isProcessing ? <CircularProgress size={14} color="inherit" /> : <Download size={16} />
            }
          >
            {isProcessing ? '安装中' : '安装'}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
