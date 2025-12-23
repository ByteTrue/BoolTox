/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

interface SkeletonLoaderProps {
  type?: 'module-card' | 'list-item' | 'text' | 'circle';
  count?: number;
  className?: string;
}

/**
 * 骨架屏加载组件 - 优化加载体验
 * 支持多种类型的骨架屏样式
 */
export function SkeletonLoader({
  type = 'module-card',
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map(index => (
        <Box key={index} className={className}>
          {type === 'module-card' && <ModuleCardSkeleton />}
          {type === 'list-item' && <ListItemSkeleton />}
          {type === 'text' && <TextSkeleton />}
          {type === 'circle' && <CircleSkeleton />}
        </Box>
      ))}
    </>
  );
}

function ModuleCardSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rounded" width={32} height={32} />
          <Skeleton variant="rounded" width={64} height={20} sx={{ borderRadius: 3 }} />
        </Box>
        <Skeleton variant="rounded" width={80} height={20} sx={{ borderRadius: 3 }} />
      </Box>

      <Skeleton variant="text" width={128} height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={16} sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 3 }} />
      </Box>
    </Paper>
  );
}

function ListItemSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rounded" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={192} height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="100%" sx={{ maxWidth: 384 }} height={16} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    </Paper>
  );
}

function TextSkeleton() {
  return <Skeleton variant="text" width="100%" height={16} />;
}

function CircleSkeleton() {
  return <Skeleton variant="circular" width={48} height={48} />;
}
