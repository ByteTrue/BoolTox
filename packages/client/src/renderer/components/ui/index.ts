/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * UI 组件库统一导出
 * MUI 组件包装器 + 原有组件
 */

// =============================================================================
// MUI 组件包装器（推荐使用）
// =============================================================================

// Button 按钮
export { AppButton, AppIconButton, GlassButton } from './button';
export type { AppButtonProps, AppIconButtonProps, ButtonVariant, ButtonSize } from './button';

// Input 输入框
export { AppInput, Input } from './app-input';
export type { AppInputProps } from './app-input';

// Dialog 对话框
export {
  AppDialog,
  AppConfirmDialog,
  Modal,
  ConfirmDialog as MuiConfirmDialog,
} from './app-dialog';
export type { AppDialogProps, AppConfirmDialogProps } from './app-dialog';

// Switch 开关
export { AppSwitch, Toggle as MuiToggle } from './app-switch';
export type { AppSwitchProps } from './app-switch';

// Toast 提示
export {
  AppToast,
  AppToastProvider,
  useAppToast,
  Toast as MuiToast,
  ToastProvider,
  useToast as useMuiToast,
} from './app-toast';
export type { AppToastProps, ToastType } from './app-toast';

// Progress 进度
export {
  AppLinearProgress,
  AppCircularProgress,
  LinearProgress,
  CircularProgress,
  ProgressBar as MuiProgressBar,
} from './app-progress';
export type { AppLinearProgressProps, AppCircularProgressProps } from './app-progress';

// Skeleton 骨架屏
export {
  AppSkeleton,
  AppSkeletonText,
  AppSkeletonAvatar,
  AppSkeletonCard,
  AppSkeletonList,
  AppSkeletonTable,
  AppSkeletonImage,
  Skeleton as MuiSkeleton,
  SkeletonText as MuiSkeletonText,
  SkeletonAvatar as MuiSkeletonAvatar,
  SkeletonCard as MuiSkeletonCard,
  SkeletonList as MuiSkeletonList,
  SkeletonTable as MuiSkeletonTable,
  SkeletonImage as MuiSkeletonImage,
} from './app-skeleton';
export type {
  AppSkeletonProps,
  AppSkeletonTextProps,
  AppSkeletonAvatarProps,
  AppSkeletonCardProps,
  AppSkeletonListProps,
  AppSkeletonTableProps,
  AppSkeletonImageProps,
} from './app-skeleton';

// Select 选择器
export { AppSelect, AppDropdown, Select as MuiSelect, Dropdown as MuiDropdown } from './app-select';
export type {
  AppSelectProps,
  AppSelectOption,
  AppDropdownProps,
  AppDropdownItem,
} from './app-select';

// SegmentedControl 分段控制器
export {
  AppSegmentedControl,
  SegmentedControl as MuiSegmentedControl,
  Tabs,
} from './app-segmented';
export type { AppSegmentedControlProps, AppSegmentOption } from './app-segmented';

// Tooltip 提示
export { AppTooltip, Tooltip } from './app-tooltip';
export type { AppTooltipProps } from './app-tooltip';

// Card 卡片
export { AppCard, AppSimpleCard, GlassCard, SimpleCard } from './app-card';
export type { AppCardProps, AppSimpleCardProps } from './app-card';

// =============================================================================
// 原有组件（保留向后兼容）
// =============================================================================

export { EmptyState } from './empty-state';
export { SkeletonLoader } from './skeleton-loader';
export { SegmentedControl } from './segmented-control';
export { BatchActionBar } from './batch-action-bar';
export { ProgressToast, SimpleToast } from './progress-toast';
export { ConfirmDialog } from './confirm-dialog';
export { PageHeader, Toolbar } from './page-header';
export { HeroBanner, CategoryHeader, ScrollContainer } from './hero-banner';
export { ChangelogDrawer } from './changelog-drawer';

// 原有组件（即将弃用）
export { Toggle } from './toggle';
export { Dropdown, Select } from './dropdown';
export { Toast, ToastContainer, useToast } from './toast';
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonImage,
} from './skeleton';
export { ProgressBar } from './progress-bar';
