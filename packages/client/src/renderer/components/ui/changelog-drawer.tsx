/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useId, useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import { formatRelativeTime, type ActivityFeedItem } from '@/content/activity-feed';

export interface ChangelogDrawerProps {
  open: boolean;
  items: ActivityFeedItem[];
  onClose: () => void;
  initialSelectedId?: string;
}

type FilterType = 'all' | 'announcement' | 'update';

/**
 * 更新日志历史抽屉组件
 */
export function ChangelogDrawer({ open, items, onClose, initialSelectedId }: ChangelogDrawerProps) {
  const drawerId = useId();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<ActivityFeedItem | null>(
    () => items.find(item => item.id === initialSelectedId) || items[0] || null
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(item => item.type === filter);
  }, [items, filter]);

  const typeConfig = {
    update: { label: '更新日志', color: 'info' as const },
    announcement: { label: '公告', color: 'secondary' as const },
  };

  const filters: { value: FilterType; label: string; emoji: string }[] = [
    { value: 'all', label: '全部', emoji: '📋' },
    { value: 'announcement', label: '公告', emoji: '📢' },
    { value: 'update', label: '更新', emoji: '🚀' },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '80vw' },
          maxWidth: 1200,
        },
      }}
    >
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* 左侧：详细内容区域 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {selectedItem ? (
            <Fade in key={selectedItem.id}>
              <Box>
                {/* 标题区 */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      fontSize: '1.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {selectedItem.icon || '📢'}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {selectedItem.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip
                        label={typeConfig[selectedItem.type]?.label ?? '公告'}
                        size="small"
                        color={typeConfig[selectedItem.type]?.color ?? 'default'}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(selectedItem.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 内容区 */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ '& .prose': { maxWidth: 'none' } }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !String(children).includes('\n');
                          if (isInline) {
                            return (
                              <Box
                                component="code"
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  bgcolor: 'action.hover',
                                  fontFamily: 'monospace',
                                  fontSize: '0.875rem',
                                  border: 1,
                                  borderColor: 'divider',
                                }}
                                {...props}
                              >
                                {children}
                              </Box>
                            );
                          }
                          return (
                            <Box
                              component="code"
                              sx={{
                                display: 'block',
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                              }}
                              className={className}
                              {...props}
                            >
                              {children}
                            </Box>
                          );
                        },
                      }}
                    >
                      {selectedItem.content}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          ) : (
            <Box
              sx={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                请从右侧选择一条公告查看详情
              </Typography>
            </Box>
          )}
        </Box>

        {/* 右侧：列表区域 */}
        <Box
          sx={{
            width: 320,
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 标题栏 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              📜 历史记录
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Box>

          {/* 筛选器 */}
          <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            {filters.map(f => (
              <Button
                key={f.value}
                size="small"
                variant={filter === f.value ? 'contained' : 'outlined'}
                onClick={() => setFilter(f.value)}
                sx={{ borderRadius: 2, textTransform: 'none', minWidth: 'auto', px: 1.5 }}
              >
                {f.emoji} {f.label}
              </Button>
            ))}
          </Box>

          {/* 列表区域 */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            {filteredItems.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  暂无相关记录
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredItems.map(item => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: selectedItem?.id === item.id ? 'action.selected' : 'transparent',
                      borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '1rem', flexShrink: 0 }}>
                        {item.icon || '📢'}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={typeConfig[item.type]?.label ?? '公告'}
                        size="small"
                        color={typeConfig[item.type]?.color ?? 'default'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(item.timestamp)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
