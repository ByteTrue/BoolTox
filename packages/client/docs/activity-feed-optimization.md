# 公告系统缓存优化

## 问题
每次切换到概览面板时都会重新请求后台获取公告数据，造成不必要的网络请求和加载延迟。

## 解决方案
实现全局状态管理 + 智能缓存机制

### 核心特性
1. **全局Context管理**: 使用 `ActivityFeedContext` 在整个应用中共享公告数据
2. **LocalStorage缓存**: 数据持久化到本地，即使刷新页面也能快速加载
3. **智能刷新策略**: 
   - 缓存有效期: 30分钟
   - 优先使用缓存数据快速响应
   - 后台静默刷新保持数据新鲜度
4. **手动刷新**: 新增刷新按钮支持用户主动更新
5. **离线降级**: 网络异常时展示提示并保留缓存数据，避免占位公告

### 技术实现

#### 新增文件
- `src/renderer/contexts/activity-feed-context.tsx` - 全局公告Context

#### 修改文件
- `src/main.tsx` - 添加 ActivityFeedProvider
- `src/renderer/contexts/index.ts` - 导出新Context
- `src/renderer/hooks/use-activity-feed.ts` - 标记为废弃，重定向到Context
- `src/renderer/components/ui/activity-feed.tsx` - 添加刷新功能

### 使用示例
```tsx
import { useActivityFeed } from '@/contexts';

function MyComponent() {
  const { items, loading, refreshing, refresh, error } = useActivityFeed();
  
  // items: 公告列表
  // loading: 首次加载状态
  // refreshing: 刷新中状态
  // refresh: 手动刷新函数
  // error: 网络异常提示（有缓存时仍可读取历史公告）
}
```

### 优势
- ✅ 减少重复请求，降低服务器压力
- ✅ 快速响应，优先展示缓存数据
- ✅ 后台更新，保持数据新鲜度
- ✅ 持久化缓存，提升用户体验
- ✅ 手动刷新，用户可控

### 缓存策略
- **缓存Key**: `booltox:activity-feed:cache`
- **有效期**: 30分钟
- **缓存内容**: 公告数据 + 时间戳
- **失效处理**: 自动删除过期缓存并重新请求

### 更新日志
- 2025-10-28: 初始实现，添加全局Context和缓存机制
