import type { AnnouncementStatus, AnnouncementType } from '@booltox/shared';
import { apiClient } from '../../shared/api-client';
import type { AnnouncementListResponse } from './types';

export interface AnnouncementListParams {
  page: number;
  limit: number;
  status?: AnnouncementStatus | null;
  type?: AnnouncementType | null;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export const announcementsApi = {
  async list(params: AnnouncementListParams) {
    const response = await apiClient.get<ApiSuccessResponse<AnnouncementListResponse>>(
      '/api/announcements',
      {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status ?? undefined,
          type: params.type ?? undefined,
        },
      }
    );

    return response.data.data;
  },
};
