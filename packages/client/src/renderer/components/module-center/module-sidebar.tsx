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
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import {
  LayoutGrid,
  Star,
  Hash,
  ChevronRight,
  Store,
  Package,
  Plus,
  Play,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ToolSourceConfig } from '@booltox/shared';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, count, onClick }: SidebarItemProps) {
  return (
    <ListItemButton
      onClick={onClick}
      selected={active}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          '& .MuiListItemIcon-root': {
            color: 'primary.contrastText',
          },
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 36,
          color: active ? 'inherit' : 'text.secondary',
          '& svg': {
            strokeWidth: 2.5,
          },
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          color: active ? 'inherit' : 'text.primary',
        }}
      />
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.75rem',
            bgcolor: active ? 'primary.contrastText' : 'action.selected',
            color: active ? 'primary.main' : 'text.secondary',
          }}
        />
      )}
    </ListItemButton>
  );
}

// 区域标题组件
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        px: 2,
        py: 1,
        display: 'block',
        color: 'text.secondary',
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {children}
    </Typography>
  );
}

interface ModuleSidebarProps {
  currentView: string; // 'installed' | 'store' | 'official' | 'custom' | 'favorites' | 'running' | 'source:xxx'
  currentCategory: string; // 'all' | categoryName
  onViewChange: (view: string) => void;
  onCategoryChange: (category: string) => void;
  onAddToolSource?: () => void;
  stats: {
    installed: number;
    store: number;
    official: number;
    custom: number;
    favorites: number;
    running: number; // 新增
    sourceCount?: Record<string, number>; // 新增：每个源的工具数
  };
  categories: string[];
  toolSources?: ToolSourceConfig[]; // 新增：工具源列表
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
  const navigate = useNavigate();

  // 过滤自定义工具源（非官方的远程源，排除本地源）
  const customSources = toolSources.filter(
    s => s.id !== 'official' && s.type === 'remote' && !s.localPath // 额外保险：排除有 localPath 的源
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
        py: 3,
        px: 2,
      }}
    >
      {/* 区域 1: 我的工具 */}
      <Box>
        <SectionHeader>📦 我的工具</SectionHeader>
        <List disablePadding>
          <SidebarItem
            icon={<LayoutGrid size={20} />}
            label="全部已安装"
            active={currentView === 'installed'}
            count={stats.installed}
            onClick={() => onViewChange('installed')}
          />

          <SidebarItem
            icon={<Star size={20} />}
            label="收藏"
            active={currentView === 'favorites'}
            count={stats.favorites}
            onClick={() => onViewChange('favorites')}
          />

          <SidebarItem
            icon={<Play size={20} />}
            label="运行中"
            active={currentView === 'running'}
            count={stats.running}
            onClick={() => onViewChange('running')}
          />
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 区域 2: 工具市场 */}
      <Box>
        <SectionHeader>🛍️ 工具市场</SectionHeader>

        {/* 浏览工具源子标题 */}
        <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 1, display: 'block' }}>
          📂 浏览工具源
        </Typography>

        <List disablePadding>
          <SidebarItem
            icon={<Store size={20} />}
            label="官方工具库"
            active={currentView === 'official'}
            count={stats.official}
            onClick={() => onViewChange('official')}
          />

          {/* 动态显示自定义工具源 */}
          {customSources.map(source => (
            <SidebarItem
              key={source.id}
              icon={<Package size={20} />}
              label={source.name}
              active={currentView === `source:${source.id}`}
              count={stats.sourceCount?.[source.id] || 0}
              onClick={() => onViewChange(`source:${source.id}`)}
            />
          ))}
        </List>

        {/* 添加工具源按钮 */}
        {onAddToolSource && (
          <Button
            onClick={onAddToolSource}
            variant="contained"
            color="secondary"
            startIcon={<Plus size={18} />}
            fullWidth
            sx={{
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            添加工具源
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 区域 3: 工具源管理 */}
      <Box>
        <SectionHeader>管理</SectionHeader>

        <List disablePadding>
          <ListItemButton
            onClick={() => navigate('/tools/sources')}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary', '& svg': { strokeWidth: 2.5 } }}>
              <Settings size={20} />
            </ListItemIcon>
            <ListItemText
              primary="工具源"
              primaryTypographyProps={{
                color: 'text.primary',
              }}
            />
          </ListItemButton>
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 分类过滤 */}
      <Box className="elegant-scroll" sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        <SectionHeader>分类</SectionHeader>

        <List disablePadding>
          <SidebarItem
            icon={<Hash size={20} />}
            label="全部"
            active={currentCategory === 'all'}
            onClick={() => onCategoryChange('all')}
          />

          {categories.map(category => (
            <SidebarItem
              key={category}
              icon={<ChevronRight size={18} />}
              label={category}
              active={currentCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </List>
      </Box>
    </Box>
  );
}
