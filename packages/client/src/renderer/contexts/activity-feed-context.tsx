import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type ActivityFeedItem, sortByPriority } from '@/content/activity-feed';
import { fetchAnnouncements, type Announcement } from '@/lib/announcements-service';

const CACHE_KEY = 'booltox:activity-feed:cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟
const NETWORK_ERROR_MESSAGE = '无法连接到公告服务，请稍后重试。';

interface CachedData {
  items: ActivityFeedItem[];
  timestamp: number;
}

interface ActivityFeedContextValue {
  items: ActivityFeedItem[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  error: string | null;
}

const ActivityFeedContext = createContext<ActivityFeedContextValue | null>(null);

export function ActivityFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }
      
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }, []);

  const saveToCache = useCallback((feedItems: ActivityFeedItem[]) => {
    try {
      const data: CachedData = {
        items: feedItems,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }, []);

  const fetchRemoteData = useCallback(async (): Promise<ActivityFeedItem[]> => {
    const remoteItems: ActivityFeedItem[] = [];
    let fetchError: unknown = null;

    try {
      const announcements = await fetchAnnouncements(6);
      announcements.forEach((announcement) => {
        const type = mapAnnouncementType(announcement.type);
        remoteItems.push({
          id: announcement.id,
          type,
          title: announcement.title,
          content: announcement.content,
          timestamp: new Date(announcement.publishAt ?? announcement.createdAt).getTime(),
          priority: 'high',
          icon: iconForType(type),
        });
      });
    } catch (error) {
      console.error('fetchAnnouncements error:', error);
      fetchError = error;
    }

    const now = Date.now();
    const prioritized = remoteItems.map((item, index) => ({
      ...item,
      priority: item.priority ?? 'high',
      timestamp: Math.max(item.timestamp, now - index),
    }));

    if (fetchError && prioritized.length === 0) {
      throw fetchError;
    }

    return sortByPriority(prioritized);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshItems = await fetchRemoteData();
      setItems(freshItems);
      saveToCache(freshItems);
      setError(null);
    } catch (error) {
      console.error('Failed to refresh activity feed:', error);
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemoteData, saveToCache]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const cached = loadFromCache();
      
      if (cached) {
        if (!cancelled) {
          setItems(cached.items);
          setLoading(false);
          setError(null);
        }
        
        // 后台静默刷新
        fetchRemoteData().then((freshItems) => {
          if (!cancelled) {
            setItems(freshItems);
            saveToCache(freshItems);
            setError(null);
          }
        }).catch((error) => {
          console.error('Failed to silently refresh activity feed:', error);
          if (!cancelled) {
            setError(NETWORK_ERROR_MESSAGE);
          }
        });
      } else {
        try {
          const freshItems = await fetchRemoteData();
          if (!cancelled) {
            setItems(freshItems);
            saveToCache(freshItems);
            setLoading(false);
            setError(null);
          }
        } catch (error) {
          console.error('Failed to initialize activity feed:', error);
          if (!cancelled) {
            setItems([]);
            setLoading(false);
            setError(NETWORK_ERROR_MESSAGE);
          }
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [fetchRemoteData, loadFromCache, saveToCache]);

  const value = useMemo(
    () => ({
      items,
      loading,
      refreshing,
      refresh,
      error,
    }),
    [items, loading, refreshing, refresh, error]
  );

  return (
    <ActivityFeedContext.Provider value={value}>
      {children}
    </ActivityFeedContext.Provider>
  );
}

export function useActivityFeed() {
  const context = useContext(ActivityFeedContext);
  if (!context) {
    throw new Error('useActivityFeed must be used within ActivityFeedProvider');
  }
  return context;
}

const mapAnnouncementType = (type: Announcement['type']): ActivityFeedItem['type'] => {
  switch (type) {
    case 'UPDATE':
      return 'update';
    case 'NOTICE':
      return 'notice';
    default:
      return 'announcement';
  }
};

const iconForType = (type: ActivityFeedItem['type']): string => {
  switch (type) {
    case 'update':
      return '🚀';
    case 'notice':
      return '💡';
    default:
      return '📢';
  }
};
