import type { ReleaseChannel } from '@booltox/shared';
import { apiClient } from '../../shared/api-client';
import type {
  ReleaseListResponse,
  ReleaseDetail,
  CreateReleasePayload,
  UpdateReleasePayload,
  SyncGitHubReleasePayload,
  SyncGitHubReleaseResult,
} from './types';

export interface ReleaseListParams {
  page: number;
  limit: number;
  channel?: ReleaseChannel | null;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export const releasesApi = {
  async list(params: ReleaseListParams) {
    const response = await apiClient.get<ApiSuccessResponse<ReleaseListResponse>>('/api/admin/releases', {
      params: {
        page: params.page,
        limit: params.limit,
        channel: params.channel ?? undefined,
      },
    });
    return response.data.data;
  },

  async get(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<ReleaseDetail>>(`/api/admin/releases/${encodeURIComponent(id)}`);
    return response.data.data;
  },

  async create(payload: CreateReleasePayload) {
    const response = await apiClient.post<ApiSuccessResponse<ReleaseDetail>>('/api/admin/releases', payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateReleasePayload) {
    const response = await apiClient.put<ApiSuccessResponse<ReleaseDetail>>(
      `/api/admin/releases/${encodeURIComponent(id)}`,
      payload
    );
    return response.data.data;
  },

  async remove(id: string) {
    await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/api/admin/releases/${encodeURIComponent(id)}`);
  },

  async syncGitHub(payload: SyncGitHubReleasePayload) {
    const body: { tag?: string; syncAll?: boolean; limit?: number } = {};

    if (payload.mode === 'tag') {
      body.tag = payload.tag.trim();
    } else if (payload.mode === 'all') {
      body.syncAll = true;
      if (typeof payload.limit === 'number' && Number.isFinite(payload.limit)) {
        body.limit = payload.limit;
      }
    }

    const response = await apiClient.post<ApiSuccessResponse<SyncGitHubReleaseResult>>('/api/admin/releases/sync-github', body);
    return response.data.data;
  },
};
