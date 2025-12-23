/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import {
  Apps,
  Star,
  PlayArrow,
  Store,
  FolderOpen,
  Add,
} from '@mui/icons-material';
import type { ToolSourceConfig } from '@booltox/shared';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  countColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onClick: () => void;
}

function SidebarItem({ icon, label, active, count, countColor = 'default', onClick }: SidebarItemProps) {
  return (
    <ListItemButton
      onClick={onClick}
      selected={active}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        px: 2,
        py: 1,
        '&.Mui-selected': {
          bgcolor: theme => (theme.palette as any).primaryContainer,
          color: 'primary.main',
          '&:hover': {
            bgcolor: theme => (theme.palette as any).primaryContainer,
          },
          '& .MuiListItemIcon-root': {
            color: 'primary.main',
          },
          '& .MuiChip-root': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        },
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: active ? 'inherit' : 'action.active',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: active ? 600 : 500,
        }}
      />
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          color={active ? undefined : countColor}
          sx={{
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        />
      )}
    </ListItemButton>
  );
}

// 区域标题组件 - 符合MD3规范
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        px: 2,
        pt: 2,
        pb: 1,
        display: 'block',
        color: 'text.secondary',
        fontWeight: 600,
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </Typography>
  );
}

interface ModuleSidebarProps {
  currentView: string;
  currentCategory: string;
  onViewChange: (view: string) => void;
  onCategoryChange: (category: string) => void;
  onAddToolSource?: () => void;
  stats: {
    installed: number;
    store: number;
    official: number;
    custom: number;
    favorites: number;
    running: number;
    sourceCount?: Record<string, number>;
  };
  categories: string[];
  toolSources?: ToolSourceConfig[];
}

export function ModuleSidebar({
  currentView,
  currentCategory,
  onViewChange,
  onCategoryChange,
  onAddToolSource,
  stats,
  categories,
  toolSources = [],
}: ModuleSidebarProps) {
  // 过滤自定义工具源（非官方的远程源，排除本地源）
  const customSources = toolSources.filter(
    s => s.id !== 'official' && s.type === 'remote' && !s.localPath
  );

  return (
    <Box
      sx={{
        width: 240,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme => (theme.palette as any).surfaceContainerLow,
        overflow: 'hidden',
      }}
    >
      {/* 区域 1: 我的工具 */}
      <Box sx={{ px: 1 }}>
        <SectionHeader>我的工具</SectionHeader>
        <List disablePadding>
          <SidebarItem
            icon={<Apps />}
            label="全部已安装"
            active={currentView === 'installed'}
            count={stats.installed}
            onClick={() => onViewChange('installed')}
          />

          <SidebarItem
            icon={<Star />}
            label="收藏"
            active={currentView === 'favorites'}
            count={stats.favorites}
            countColor="warning"
            onClick={() => onViewChange('favorites')}
          />

          <SidebarItem
            icon={<PlayArrow />}
            label="运行中"
            active={currentView === 'running'}
            count={stats.running}
            countColor="success"
            onClick={() => onViewChange('running')}
          />
        </List>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* 区域 2: 工具市场 */}
      <Box sx={{ px: 1 }}>
        <SectionHeader>工具市场</SectionHeader>

        <List disablePadding>
          {/* 官方工具库 */}
          <SidebarItem
            icon={<Store />}
            label="官方工具库"
            active={currentView === 'official'}
            count={stats.official}
            onClick={() => onViewChange('official')}
          />

          {/* 动态显示自定义工具源 */}
          {customSources.map(source => (
            <SidebarItem
              key={source.id}
              icon={<FolderOpen />}
              label={source.name}
              active={currentView === `source:${source.id}`}
              count={stats.sourceCount?.[source.id] || 0}
              onClick={() => onViewChange(`source:${source.id}`)}
            />
          ))}

          {/* 添加工具源按钮 */}
          {onAddToolSource && (
            <ListItemButton
              onClick={onAddToolSource}
              sx={{
                borderRadius: 2,
                mt: 1,
                border: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                <Add />
              </ListItemIcon>
              <ListItemText
                primary="添加工具源"
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                  color: 'primary.main',
                }}
              />
            </ListItemButton>
          )}
        </List>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* 区域 3: 分类筛选 */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'action.hover',
            borderRadius: 3,
          },
        }}
      >
        <SectionHeader>分类</SectionHeader>

        <List disablePadding>
          <SidebarItem
            icon={<Apps />}
            label="全部"
            active={currentCategory === 'all'}
            onClick={() => onCategoryChange('all')}
          />

          {categories.map(category => (
            <ListItemButton
              key={category}
              selected={currentCategory === category}
              onClick={() => onCategoryChange(category)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 0.75,
                pl: 6,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                },
              }}
            >
              <ListItemText
                primary={category}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: currentCategory === category ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
}
