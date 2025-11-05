import { motion } from 'framer-motion';

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
  className = ''
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((index) => (
        <div key={index} className={className}>
          {type === 'module-card' && <ModuleCardSkeleton />}
          {type === 'list-item' && <ListItemSkeleton />}
          {type === 'text' && <TextSkeleton />}
          {type === 'circle' && <CircleSkeleton />}
        </div>
      ))}
    </>
  );
}

// 模块卡片骨架屏
function ModuleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] p-4 shadow-[0_8px_18px_rgba(15,35,70,0.12)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />

      <div className="flex justify-end">
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

// 列表项骨架屏
function ListItemSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 文本骨架屏
function TextSkeleton() {
  return <Skeleton className="h-4 w-full" />;
}

// 圆形骨架屏
function CircleSkeleton() {
  return <Skeleton className="h-12 w-12 rounded-full" />;
}

// 基础骨架屏组件
function Skeleton({ className }: { className: string }) {
  return (
    <motion.div
      className={`bg-[var(--shell-chip)] ${className}`}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
