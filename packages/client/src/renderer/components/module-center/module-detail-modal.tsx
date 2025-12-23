/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import { X } from 'lucide-react';
import { ScreenshotCarousel } from './screenshot-carousel';
import type { ModuleInstance, ModuleDefinition } from '@/types/module';

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
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
  const isLaunchError = launchState === 'error';

  const getStatusChip = () => {
    if (isRunning) return { label: '窗口运行中', color: 'success' as const };
    if (isLaunching) return { label: '启动中…', color: 'warning' as const };
    if (isStopping) return { label: '停止中…', color: 'warning' as const };
    if (isLaunchError) return { label: '启动失败', color: 'error' as const };
    return { label: '未运行', color: 'default' as const };
  };

  return createPortal(
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '80vw' },
          maxWidth: 1200,
        },
      }}
    >
      {/* 头部 */}
      <Box
        sx={{
          position: 'relative',
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 3,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16 }}
          aria-label="关闭"
        >
          <X size={20} />
        </IconButton>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, pr: 6 }}>
          {/* 图标 */}
          <Box
            sx={{
              width: 56,
              height: 56,
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
                sx={{ width: 40, height: 40, borderRadius: 2 }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {definition.name.slice(0, 2).toUpperCase()}
              </Typography>
            )}
          </Box>

          {/* 信息 */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight="bold" noWrap sx={{ mb: 1 }}>
              {definition.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <Chip label={`ID ${definition.id}`} size="small" variant="outlined" />
              <Chip label={`v${definition.version}`} size="small" variant="outlined" />
              {definition.category && (
                <Chip label={definition.category} size="small" color="primary" />
              )}
              {definition.author && (
                <Typography variant="caption" color="text.secondary">
                  作者：{definition.author}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                来源：{definition.source === 'remote' ? '远程工具' : '本地工具'}
              </Typography>
              {runtime && <Chip label={getStatusChip().label} size="small" color={getStatusChip().color} />}
            </Box>

            {/* 操作按钮 */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {isInstalled && runtime ? (
                <>
                  {onOpen && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onOpen(module.id)}
                      disabled={isLaunching || isStopping}
                    >
                      {isLaunching ? '启动中…' : isStopping ? '停止中…' : isRunning ? '聚焦窗口' : '打开工具'}
                    </Button>
                  )}
                  {onUninstall && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => onUninstall(module.id)}
                    >
                      卸载
                    </Button>
                  )}
                </>
              ) : null}
              {!isInstalled && onInstall && (
                <Button variant="contained" size="small" onClick={() => onInstall(module.id)}>
                  安装工具
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 内容区 */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="工具详情" value="details" />
          <Tab label="更新日志" value="changelog" />
        </Tabs>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          {activeTab === 'details' && (
            <Fade in>
              <Box>
                {/* 截图轮播 */}
                {definition.screenshots && definition.screenshots.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <ScreenshotCarousel
                      screenshots={definition.screenshots}
                      toolName={definition.name}
                    />
                  </Box>
                )}

                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  工具描述
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                  {definition.description || '暂无详细描述'}
                </Typography>

                {definition.keywords && definition.keywords.length > 0 && (
                  <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      关键词
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {definition.keywords.map(keyword => (
                        <Chip key={keyword} label={keyword} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}

                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  工具信息
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">版本号:</Typography>
                    <Typography variant="body2" fontWeight={500}>{definition.version}</Typography>
                  </Box>
                  {definition.author && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">作者:</Typography>
                      <Typography variant="body2" fontWeight={500}>{definition.author}</Typography>
                    </Box>
                  )}
                  {definition.category && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">分类:</Typography>
                      <Typography variant="body2" fontWeight={500}>{definition.category}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">来源:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {definition.source === 'remote' ? '远程工具' : '本地工具'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}

          {activeTab === 'changelog' && (
            <Fade in>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  更新日志
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  暂无更新日志
                </Typography>
              </Box>
            </Fade>
          )}
        </Paper>
      </Box>
    </Drawer>,
    document.body
  );
}
