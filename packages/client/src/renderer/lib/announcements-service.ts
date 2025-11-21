import type { Announcement as GitOpsAnnouncement } from '../../../electron/services/git-ops.service';

export type AnnouncementType = 'ANNOUNCEMENT' | 'UPDATE';

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  publishAt: string | null;
  createdAt: string;
};

const TYPE_MAP: Record<GitOpsAnnouncement['type'], AnnouncementType> = {
  announcement: 'ANNOUNCEMENT',
  update: 'UPDATE',
};

function normalize(items: GitOpsAnnouncement[]): Announcement[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content ?? '',
    type: TYPE_MAP[item.type] ?? 'ANNOUNCEMENT',
    publishAt: item.date ?? null,
    createdAt: item.date ?? new Date().toISOString(),
  }));
}

export async function fetchAnnouncements(limit = 5): Promise<Announcement[]> {
  const take = Math.max(1, limit);
  try {
    if (window.gitOps?.getAnnouncements) {
      const payload = await window.gitOps.getAnnouncements();
      return normalize(payload).slice(0, take);
    }
  } catch (error) {
    console.error('gitOps 获取公告失败:', error);
  }

  try {
    const response = await fetch('/resources/announcements/news.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch announcements: ${response.statusText}`);
    }
    const payload = await response.json() as GitOpsAnnouncement[];
    return normalize(payload).slice(0, take);
  } catch (error) {
    console.error('公告本地回退读取失败:', error);
    return [];
  }
}
