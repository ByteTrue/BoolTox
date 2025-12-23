/**
 * ModuleSidebar V2 - Material Design 3 现代化设计
 */

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Apps,
  Star,
  PlayArrow,
  Store,
  Add,
  Category,
} from '@mui/icons-material';
import type { ToolSourceConfig } from '@booltox/shared';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function NavItem({ icon, label, active, count, onClick }: NavItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: 3,
        mx: 1.5,
        mb: 0.5,
        px: 2,
        py: 1.25,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        bgcolor: active
          ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)
          : 'transparent',
        '&:hover': {
          bgcolor: active
            ? alpha(theme.palette.primary.main, isDark ? 0.25 : 0.16)
            : alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
        },
        // 左侧指示条
        '&::before': active
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 24,
              borderRadius: '0 4px 4px 0',
              bgcolor: 'primary.main',
            }
          : {},
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: active ? 'primary.main' : 'text.secondary',
          transition: 'color 0.2s ease',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: active ? 600 : 500,
          color: active ? 'primary.main' : 'text.primary',
          sx: { transition: 'all 0.2s ease' },
        }}
      />
      {count !== undefined && count > 0 && (
        <Badge
          badgeContent={count}
          color={active ? 'primary' : 'default'}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 600,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
            },
          }}
        />
      )}
    </ListItemButton>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        px: 3,
        pt: 2.5,
        pb: 1,
        display: 'block',
        color: 'text.secondary',
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Typography>
  );
}

interface ModuleSidebarV2Props {
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
  toolSources?: ToolSourceConfig[];
}

export function ModuleSidebarV2({
  currentView,
  currentCategory,
  onViewChange,
  onCategoryChange,
  onAddToolSource,
  stats,
  categories,
}: ModuleSidebarV2Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#fff', 0.8),
        backdropFilter: 'blur(20px)',
        borderRight: 1,
        borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
      }}
    >
      {/* Logo/Brand Area */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <Apps sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            工具中心
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.installed} 个工具已安装
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* 我的工具 */}
      <Box sx={{ mt: 1 }}>
        <SectionTitle>我的工具</SectionTitle>
        <List disablePadding>
          <NavItem
            icon={<Apps />}
            label="全部工具"
            active={currentView === 'installed'}
            count={stats.installed}
            onClick={() => onViewChange('installed')}
          />
          <NavItem
            icon={<Star />}
            label="收藏"
            active={currentView === 'favorites'}
            count={stats.favorites}
            onClick={() => onViewChange('favorites')}
          />
          <NavItem
            icon={<PlayArrow />}
            label="运行中"
            active={currentView === 'running'}
            count={stats.running}
            onClick={() => onViewChange('running')}
          />
        </List>
      </Box>

      <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />

      {/* 工具市场 */}
      <Box>
        <SectionTitle>发现</SectionTitle>
        <List disablePadding>
          <NavItem
            icon={<Store />}
            label="官方工具库"
            active={currentView === 'official'}
            count={stats.official}
            onClick={() => onViewChange('official')}
          />
        </List>
      </Box>

      {/* 添加工具源按钮 */}
      {onAddToolSource && (
        <Box sx={{ px: 1.5, mt: 1 }}>
          <ListItemButton
            onClick={onAddToolSource}
            sx={{
              borderRadius: 3,
              py: 1.25,
              px: 2,
              border: 1,
              borderStyle: 'dashed',
              borderColor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12),
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.04),
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
        </Box>
      )}

      <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />

      {/* 分类 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <SectionTitle>分类</SectionTitle>
        <List disablePadding>
          <NavItem
            icon={<Category />}
            label="全部"
            active={currentCategory === 'all'}
            onClick={() => onCategoryChange('all')}
          />
          {categories.map(category => (
            <ListItemButton
              key={category}
              onClick={() => onCategoryChange(category)}
              sx={{
                borderRadius: 3,
                mx: 1.5,
                mb: 0.5,
                py: 1,
                pl: 6,
                bgcolor:
                  currentCategory === category
                    ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08)
                    : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.04),
                },
              }}
            >
              <ListItemText
                primary={category}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: currentCategory === category ? 600 : 400,
                  color: currentCategory === category ? 'primary.main' : 'text.secondary',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
}
