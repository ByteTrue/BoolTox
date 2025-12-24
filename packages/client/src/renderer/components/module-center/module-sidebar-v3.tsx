/**
 * ModuleSidebar V3 - Linear/Raycast 级别的极简设计
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import {
  GridViewRounded,
  StarRounded,
  PlayArrowRounded,
  StorefrontRounded,
  AddRounded,
} from '@mui/icons-material';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        mx: 0.5,
        borderRadius: 1.5,
        cursor: 'pointer',
        color: active ? 'text.primary' : 'text.secondary',
        bgcolor: active
          ? isDark
            ? alpha('#fff', 0.06)
            : alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          bgcolor: isDark ? alpha('#fff', 0.06) : alpha(theme.palette.primary.main, 0.06),
          color: 'text.primary',
        },
        // Linear 风格左侧 accent bar
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: active ? 'translateY(-50%) scaleY(1)' : 'translateY(-50%) scaleY(0)',
          width: 3,
          height: 16,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'primary.main' : 'inherit',
          transition: 'color 0.15s ease',
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: active ? 600 : 500,
          fontSize: '0.8125rem',
        }}
      >
        {label}
      </Typography>
      {count !== undefined && count > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.tertiary',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </Typography>
      )}
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        px: 2.5,
        pt: 3,
        pb: 1,
        display: 'block',
        color: 'text.tertiary',
        fontWeight: 600,
        fontSize: '0.6875rem',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </Typography>
  );
}

interface ModuleSidebarV3Props {
  currentView: string;
  currentCategory: string;
  onViewChange: (view: string) => void;
  onCategoryChange: (category: string) => void;
  onAddToolSource?: () => void;
  stats: {
    installed: number;
    favorites: number;
    running: number;
    official: number;
  };
  categories: string[];
}

export function ModuleSidebarV3({
  currentView,
  currentCategory,
  onViewChange,
  onCategoryChange,
  onAddToolSource,
  stats,
  categories,
}: ModuleSidebarV3Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        width: 220,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 用背景色差异替代边框分割
        bgcolor: isDark ? '#0c0c0e' : '#f8f9fb',
        // 左右留出空间，让选中项有呼吸间距
        px: 1.5,
      }}
    >
      {/* 我的工具 */}
      <Box>
        <SectionLabel>工具库</SectionLabel>
        <Stack spacing={0.25}>
          <NavItem
            icon={<GridViewRounded sx={{ fontSize: 18 }} />}
            label="全部"
            count={stats.installed}
            active={currentView === 'installed'}
            onClick={() => onViewChange('installed')}
          />
          <NavItem
            icon={<StarRounded sx={{ fontSize: 18 }} />}
            label="收藏"
            count={stats.favorites}
            active={currentView === 'favorites'}
            onClick={() => onViewChange('favorites')}
          />
          <NavItem
            icon={<PlayArrowRounded sx={{ fontSize: 18 }} />}
            label="运行中"
            count={stats.running}
            active={currentView === 'running'}
            onClick={() => onViewChange('running')}
          />
        </Stack>
      </Box>

      {/* 发现 */}
      <Box>
        <SectionLabel>发现</SectionLabel>
        <Stack spacing={0.25}>
          <NavItem
            icon={<StorefrontRounded sx={{ fontSize: 18 }} />}
            label="官方市场"
            count={stats.official}
            active={currentView === 'official'}
            onClick={() => onViewChange('official')}
          />
        </Stack>
      </Box>

      {/* 分类 */}
      {categories.length > 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <SectionLabel>分类</SectionLabel>
          <Stack spacing={0.25}>
            <NavItem
              icon={<Box sx={{ width: 18 }} />}
              label="全部"
              active={currentCategory === 'all'}
              onClick={() => onCategoryChange('all')}
            />
            {categories.map(cat => (
              <NavItem
                key={cat}
                icon={<Box sx={{ width: 18 }} />}
                label={cat}
                active={currentCategory === cat}
                onClick={() => onCategoryChange(cat)}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* 底部添加按钮 */}
      {onAddToolSource && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box
            onClick={onAddToolSource}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.25,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.25),
              color: isDark ? 'text.secondary' : theme.palette.primary.main,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <AddRounded sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={500} fontSize="0.8125rem">
              添加来源
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
