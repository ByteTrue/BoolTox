/**
 * ModuleDetailModal V3 - 惊艳版
 * 特性：毛玻璃、渐变光效、流畅动画、精致排版
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import { alpha, useTheme, keyframes } from '@mui/material/styles';
import {
  CloseRounded,
  PlayArrowRounded,
  DeleteOutlineRounded,
  DownloadRounded,
  FiberManualRecord,
  OpenInNewRounded,
  CategoryRounded,
  UpdateRounded,
  PersonRounded,
  InventoryRounded,
} from '@mui/icons-material';
import { ScreenshotCarousel } from './screenshot-carousel';
import type { ModuleInstance, ModuleDefinition } from '@/types/module';

// 微光动画
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// 脉冲动画
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

interface ModuleDetailModalProps {
  module: ModuleInstance | ModuleDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall?: (moduleId: string) => void;
  onUninstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  isInstalled?: boolean;
}

type DetailTab = 'details' | 'changelog';

export function ModuleDetailModal({
  module,
  isOpen,
  onClose,
  onInstall,
  onUninstall,
  onOpen,
  isInstalled = false,
}: ModuleDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 双品牌色渐变 - 蓝色 + 橙色
  const brandGradient = isDark
    ? 'linear-gradient(135deg, #60A5FA 0%, #F97316 100%)'
    : 'linear-gradient(135deg, #3B82F6 0%, #F97316 100%)';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setActiveTab('details');
  }, [module?.id]);

  if (!module || !mounted) return null;

  const definition = 'definition' in module ? module.definition : module;
  const runtime = 'definition' in module ? module.runtime : undefined;
  const launchState = runtime?.launchState ?? 'idle';
  const isLaunching = launchState === 'launching';
  const isStopping = launchState === 'stopping';
  const isRunning = launchState === 'running';

  const getStatusInfo = () => {
    if (isRunning) return { label: '运行中', color: '#10B981', pulse: true };
    if (isLaunching) return { label: '启动中', color: '#F59E0B', pulse: true };
    if (isStopping) return { label: '停止中', color: '#F59E0B', pulse: true };
    return { label: '未运行', color: isDark ? '#6B7280' : '#9CA3AF', pulse: false };
  };

  const statusInfo = getStatusInfo();

  return createPortal(
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          maxWidth: '100vw',
          bgcolor: isDark ? '#0f0f11' : '#ffffff',
          backgroundImage: 'none',
          // 启用 flex 布局，让内容区可以滚动
          display: 'flex',
          flexDirection: 'column',
          // 顶部渐变光效
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha('#000', isDark ? 0.7 : 0.5),
            backdropFilter: 'blur(8px)',
          },
        },
      }}
    >
      {/* 关闭按钮 */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 10,
          width: 36,
          height: 36,
          bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
          color: 'text.secondary',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.08),
            color: 'text.primary',
          },
        }}
      >
        <CloseRounded sx={{ fontSize: 20 }} />
      </IconButton>

      {/* 头部区域 */}
      <Box sx={{ px: 3, pt: 4, pb: 3, flexShrink: 0 }}>
        {/* 图标 + 基本信息 */}
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          {/* 大图标 - 渐变背景 */}
          <Box
            sx={{
              position: 'relative',
              width: 72,
              height: 72,
              borderRadius: 3,
              background: isRunning ? brandGradient : isDark
                ? `linear-gradient(135deg, ${alpha('#fff', 0.1)} 0%, ${alpha('#fff', 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha('#000', 0.08)} 0%, ${alpha('#000', 0.03)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              // 微光效果
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.15)}, transparent)`,
                backgroundSize: '200% 100%',
                animation: `${shimmer} 3s infinite`,
                opacity: 0.5,
              },
            }}
          >
            {definition.icon?.startsWith('http') ? (
              <Box
                component="img"
                src={definition.icon}
                alt={definition.name}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: isRunning ? '#fff' : 'text.secondary',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {definition.name.slice(0, 2)}
              </Typography>
            )}
          </Box>

          {/* 信息 */}
          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.02em',
                mb: 0.75,
              }}
            >
              {definition.name}
            </Typography>

            {/* 状态和版本 */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              {/* 运行状态 */}
              {runtime && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 8,
                      height: 8,
                      '&::before': statusInfo.pulse ? {
                        content: '""',
                        position: 'absolute',
                        inset: -2,
                        borderRadius: '50%',
                        bgcolor: alpha(statusInfo.color, 0.3),
                        animation: `${pulse} 2s ease-in-out infinite`,
                      } : undefined,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: statusInfo.color,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: statusInfo.color, fontWeight: 500 }}>
                    {statusInfo.label}
                  </Typography>
                </Stack>
              )}
              <Typography variant="caption" sx={{ color: 'text.tertiary' }}>
                v{definition.version}
              </Typography>
            </Stack>

            {/* 标签 */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {definition.category && (
                <Chip
                  label={definition.category}
                  size="small"
                  sx={{
                    height: 24,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              )}
              <Chip
                label={definition.source === 'remote' ? '远程' : '本地'}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  borderColor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12),
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  '& .MuiChip-label': { px: 1.25 },
                }}
              />
            </Stack>
          </Box>
        </Stack>

        {/* 操作按钮 */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          {isInstalled && runtime ? (
            <>
              {onOpen && (
                <Button
                  variant="contained"
                  startIcon={isRunning ? <OpenInNewRounded /> : <PlayArrowRounded />}
                  onClick={() => onOpen(module.id)}
                  disabled={isLaunching || isStopping}
                  sx={{
                    flex: 1,
                    height: 44,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    background: brandGradient,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      background: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                      color: 'text.disabled',
                    },
                  }}
                >
                  {isLaunching ? '启动中...' : isStopping ? '停止中...' : isRunning ? '聚焦窗口' : '打开工具'}
                </Button>
              )}
              {onUninstall && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteOutlineRounded />}
                  onClick={() => onUninstall(module.id)}
                  sx={{
                    height: 44,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: alpha('#EF4444', 0.5),
                    color: '#EF4444',
                    px: 2.5,
                    '&:hover': {
                      borderColor: '#EF4444',
                      bgcolor: alpha('#EF4444', 0.08),
                    },
                  }}
                >
                  卸载
                </Button>
              )}
            </>
          ) : !isInstalled && onInstall ? (
            <Button
              variant="contained"
              startIcon={<DownloadRounded />}
              onClick={() => onInstall(module.id)}
              sx={{
                flex: 1,
                height: 44,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: brandGradient,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              安装工具
            </Button>
          ) : null}
        </Stack>
      </Box>

      {/* 分隔线 */}
      <Box
        sx={{
          height: '1px',
          flexShrink: 0,
          mx: 3,
          bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
        }}
      />

      {/* Tab 切换 */}
      <Stack direction="row" spacing={0.5} sx={{ px: 3, py: 1.5, flexShrink: 0 }}>
        {(['details', 'changelog'] as const).map(tab => (
          <Box
            key={tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              cursor: 'pointer',
              color: activeTab === tab ? 'text.primary' : 'text.tertiary',
              bgcolor: activeTab === tab
                ? isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04)
                : 'transparent',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: '0.8125rem',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: 'text.primary',
                bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
              },
            }}
          >
            {tab === 'details' ? '工具详情' : '更新日志'}
          </Box>
        ))}
      </Stack>

      {/* 内容区 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          py: 2,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
            borderRadius: 3,
          },
        }}
      >
        <Fade in={activeTab === 'details'} unmountOnExit>
          <Box>
            {/* 截图轮播 - 只在有有效截图时显示 */}
            {(() => {
              const validScreenshots = (definition.screenshots || []).filter(
                (s): s is string => typeof s === 'string' && s.trim().length > 0 && s.startsWith('http')
              );
              return validScreenshots.length > 0 ? (
                <ScreenshotCarousel screenshots={validScreenshots} toolName={definition.name} />
              ) : null;
            })()}

            {/* 描述 */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                描述
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.7,
                }}
              >
                {definition.description || '暂无详细描述'}
              </Typography>
            </Box>

            {/* 关键词 */}
            {definition.keywords && definition.keywords.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  关键词
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {definition.keywords.map(keyword => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 26,
                        borderColor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.1),
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        '& .MuiChip-label': { px: 1.25 },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* 工具信息卡片 */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                border: '1px solid',
                borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                工具信息
              </Typography>
              <Stack spacing={1.5}>
                <InfoRow
                  icon={<UpdateRounded sx={{ fontSize: 16 }} />}
                  label="版本"
                  value={definition.version}
                  isDark={isDark}
                />
                {definition.author && (
                  <InfoRow
                    icon={<PersonRounded sx={{ fontSize: 16 }} />}
                    label="作者"
                    value={definition.author}
                    isDark={isDark}
                  />
                )}
                {definition.category && (
                  <InfoRow
                    icon={<CategoryRounded sx={{ fontSize: 16 }} />}
                    label="分类"
                    value={definition.category}
                    isDark={isDark}
                  />
                )}
                <InfoRow
                  icon={<InventoryRounded sx={{ fontSize: 16 }} />}
                  label="来源"
                  value={definition.source === 'remote' ? '远程工具' : '本地工具'}
                  isDark={isDark}
                />
              </Stack>
            </Box>
          </Box>
        </Fade>

        <Fade in={activeTab === 'changelog'} unmountOnExit>
          <Box>
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                border: '1px solid',
                borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04),
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'text.tertiary' }}
              >
                暂无更新日志
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Drawer>,
    document.body
  );
}

// 信息行组件
function InfoRow({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.tertiary' }}>
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Stack>
      <Typography
        variant="body2"
        sx={{
          color: 'text.primary',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
