/**
 * Skeleton 骨架屏加载组件
 * 用于在数据加载时提供优雅的占位效果
 */

interface SkeletonProps {
  className?: string;
}

/**
 * 基础 Skeleton 组件
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * 插件卡片骨架屏
 */
export function PluginCardSkeleton() {
  return (
    <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3 flex-1">
          {/* 图标 */}
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />

          {/* 信息 */}
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* 验证标记 */}
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>

      {/* 描述 */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* 元信息 */}
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 插件列表骨架屏
 */
export function PluginListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PluginCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 文本行骨架屏
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * 圆形头像骨架屏
 */
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

/**
 * 按钮骨架屏
 */
export function ButtonSkeleton({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-10 rounded-lg ${className}`} />;
}
