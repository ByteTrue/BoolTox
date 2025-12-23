/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useActivityFeed } from '@/contexts';
import { formatRelativeTime, type ActivityFeedItem } from '@/content/activity-feed';
import { History, RefreshCw } from 'lucide-react';
import { ChangelogDrawer } from './changelog-drawer';

export function ActivityFeed() {
  const { items, loading, refreshing, refresh, error } = useActivityFeed();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  const hasItems = items.length > 0;
  const latestItem = hasItems ? items[0] : undefined;

  const handleViewDetail = () => {
    if (!latestItem) return;
    setSelectedItemId(latestItem.id);
    setIsDrawerOpen(true);
  };

  const handleViewHistory = () => {
    setSelectedItemId(undefined);
    setIsDrawerOpen(true);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <>
      <Card
        sx={{
          minHeight: 280,
          p: 4,
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: 3,
          },
        }}
      >
        {!loading && error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {hasItems ? '公告服务暂时不可用，当前展示缓存内容。' : error}
          </Alert>
        ) : null}

        {loading ? (
          <ActivityFeedSkeleton />
        ) : latestItem ? (
          <ActivityFeedContent
            latestItem={latestItem}
            itemCount={items.length}
            refreshing={refreshing}
            onViewDetail={handleViewDetail}
            onViewHistory={handleViewHistory}
            onRefresh={handleRefresh}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {error ?? '暂无公告'}
            </Typography>
          </Box>
        )}
      </Card>

      {!loading && latestItem ? (
        <ChangelogDrawer
          open={isDrawerOpen}
          items={items}
          onClose={() => setIsDrawerOpen(false)}
          initialSelectedId={selectedItemId}
        />
      ) : null}
    </>
  );
}

function ActivityFeedSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Skeleton variant="rounded" width={56} height={56} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
          <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
        </Box>
      </Box>

      <Box>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="85%" />
        <Skeleton variant="text" width="75%" />
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={36} height={36} />
        <Skeleton variant="rounded" width={60} height={24} sx={{ ml: 'auto' }} />
      </Box>
    </Box>
  );
}

function ActivityFeedContent({
  latestItem,
  itemCount,
  refreshing,
  onViewDetail,
  onViewHistory,
  onRefresh,
}: {
  latestItem: ActivityFeedItem;
  itemCount: number;
  refreshing: boolean;
  onViewDetail: () => void;
  onViewHistory: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            bgcolor: 'action.hover',
            fontSize: '1.75rem',
            flexShrink: 0,
          }}
        >
          {latestItem.icon || '📢'}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {latestItem.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {formatRelativeTime(latestItem.timestamp)}
            </Typography>
          </Box>

          <Chip
            label={latestItem.type === 'update' ? '更新日志' : '公告'}
            size="small"
            color={latestItem.type === 'update' ? 'info' : 'secondary'}
            variant="outlined"
            sx={{ mt: 1, height: 22 }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={onViewDetail}
      >
        <Box
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            '& .prose': {
              fontSize: '0.875rem',
              lineHeight: 1.6,
            },
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: () => null,
              h1: ({ children }) => <Typography fontWeight={600}>{children}</Typography>,
              h2: ({ children }) => <Typography fontWeight={600}>{children}</Typography>,
              h3: ({ children }) => <Typography fontWeight={600}>{children}</Typography>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !String(children).includes('\n');
                if (isInline) {
                  return (
                    <Box
                      component="code"
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        bgcolor: 'action.hover',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                      {...props}
                    >
                      {children}
                    </Box>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {latestItem.content}
          </ReactMarkdown>
        </Box>
        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
          点击查看完整内容 →
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<History size={16} />}
            onClick={onViewHistory}
          >
            查看所有公告
          </Button>

          <IconButton
            size="small"
            onClick={onRefresh}
            disabled={refreshing}
            title="刷新公告"
          >
            <Box
              component={RefreshCw}
              size={16}
              sx={
                refreshing
                  ? {
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }
                  : undefined
              }
            />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {latestItem.ctaUrl ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => window.open(latestItem.ctaUrl, '_blank')}
            >
              {latestItem.ctaLabel ?? '立即查看'}
            </Button>
          ) : null}

          {itemCount > 1 && (
            <Chip
              label={`共 ${itemCount} 条公告`}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
