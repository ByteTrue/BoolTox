/**
 * ToolCard V3 - Linear/Raycast 级别的极简设计
 * 原则：克制、精致、高对比度
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PlayArrowRounded,
  MoreHorizRounded,
  StarRounded,
  StopRounded,
  FiberManualRecord,
} from '@mui/icons-material';
import type { ModuleInstance } from '@/types/module';

interface ToolCardV3Props {
  tool: ModuleInstance;
  onOpen: (toolId: string) => void;
  onStop: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
  onClick: (toolId: string) => void;
}

export function ToolCardV3({
  tool,
  onOpen,
  onStop,
  onToggleFavorite,
  onClick,
}: ToolCardV3Props) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { runtime, definition } = tool;
  const isRunning = runtime.launchState === 'running';
  const canStop = runtime.installed && isRunning && definition.runtime?.type === 'http-service';

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(tool.id)}
      sx={{
        position: 'relative',
        p: 2.5,
        borderRadius: 2.5,
        cursor: 'pointer',
        bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
        border: '1px solid',
        borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.03),
          borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
        },
      }}
    >
      {/* 主内容 */}
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* 图标 */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
          {definition.icon?.startsWith('http') ? (
            <Box
              component="img"
              src={definition.icon}
              sx={{ width: 28, height: 28, borderRadius: 1 }}
            />
          ) : (
            definition.name.slice(0, 2)
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
            {isRunning && (
              <FiberManualRecord
                sx={{
                  fontSize: 8,
                  color: '#10B981',
                }}
              />
            )}
            {tool.isFavorite && (
              <StarRounded
                sx={{
                  fontSize: 14,
                  color: '#F59E0B',
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
            transition: 'opacity 0.15s ease',
          }}
        >
          {canStop ? (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onStop(tool.id);
              }}
              sx={{
                width: 32,
                height: 32,
                color: '#EF4444',
                bgcolor: alpha('#EF4444', 0.1),
                '&:hover': {
                  bgcolor: alpha('#EF4444', 0.15),
                },
              }}
            >
              <StopRounded sx={{ fontSize: 18 }} />
            </IconButton>
          ) : runtime.installed ? (
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpen(tool.id);
              }}
              sx={{
                width: 32,
                height: 32,
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                },
              }}
            >
              <PlayArrowRounded sx={{ fontSize: 18 }} />
            </IconButton>
          ) : null}
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite(tool.id);
            }}
            sx={{
              width: 32,
              height: 32,
              color: 'text.tertiary',
              '&:hover': {
                bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
              },
            }}
          >
            <MoreHorizRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
