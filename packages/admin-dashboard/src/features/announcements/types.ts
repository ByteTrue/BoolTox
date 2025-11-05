import type { Announcement } from '@booltox/shared';

export interface AnnouncementListResponse {
  items: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
