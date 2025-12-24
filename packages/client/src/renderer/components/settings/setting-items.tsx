/**
 * SettingItem 组件集合
 * 提供 Toggle、Info、Action 三种类型的设置项渲染
 */

import type { ElementType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { transitions } from '@/theme/animations';

// ============================================================
// SettingToggle - 开关类型设置项
// ============================================================

interface SettingToggleProps {
  /** 设置项标签 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 图标 */
  icon?: ElementType;
  /** 开关状态 */
  checked: boolean;
  /** 状态变更回调 */
  onChange: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
}

export function SettingToggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
  disabled = false,
  loading = false,
}: SettingToggleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {Icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
            }}
          >
            <Icon size={16} />
          </Box>
        )}
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {label}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {loading && <CircularProgress size={16} />}
        <Switch checked={checked} onChange={onChange} disabled={disabled || loading} size="small" />
      </Box>
    </Box>
  );
}

// ============================================================
// SettingInfo - 信息展示类型设置项
// ============================================================

interface SettingInfoProps {
  /** 设置项标签 */
  label: string;
  /** 值 */
  value: string;
}

export function SettingInfo({ label, value }: SettingInfoProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.75,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

// ============================================================
// SettingAction - 操作按钮类型设置项
// ============================================================

interface SettingActionProps {
  /** 按钮标签 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 图标 */
  icon?: ReactNode;
  /** 点击回调 */
  onClick: () => void;
  /** 按钮变体 */
  variant?: 'default' | 'danger';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
}

export function SettingAction({
  label,
  description,
  icon,
  onClick,
  variant = 'default',
  disabled = false,
  loading = false,
}: SettingActionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isDanger = variant === 'danger';

  return (
    <Button
      onClick={onClick}
      variant="outlined"
      color={isDanger ? 'error' : 'inherit'}
      disabled={disabled || loading}
      sx={{
        justifyContent: 'flex-start',
        textAlign: 'left',
        p: 2,
        borderRadius: 2,
        textTransform: 'none',
        borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
        transition: transitions.hover,
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: isDanger
            ? 'error.main'
            : isDark
              ? alpha('#fff', 0.15)
              : alpha(theme.palette.primary.main, 0.3),
          bgcolor: isDanger
            ? alpha(theme.palette.error.main, 0.04)
            : isDark
              ? alpha('#fff', 0.02)
              : alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {icon && (
        <Box
          sx={{
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            color: isDanger ? 'error.main' : 'primary.main',
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          color={isDanger ? 'error.main' : 'text.primary'}
        >
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
    </Button>
  );
}

// ============================================================
// SettingGroup - 设置项分组
// ============================================================

interface SettingGroupProps {
  /** 分组标题 */
  title?: string;
  /** 子内容 */
  children: ReactNode;
  /** 分组间距 */
  spacing?: number;
}

export function SettingGroup({ title, children, spacing = 0.5 }: SettingGroupProps) {
  return (
    <Box>
      {title && (
        <Typography
          variant="caption"
          color="text.tertiary"
          fontWeight={600}
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>{children}</Box>
    </Box>
  );
}
