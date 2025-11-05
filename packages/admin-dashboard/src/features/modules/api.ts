import type { ModuleStatus } from '@booltox/shared';
import { apiClient } from '../../shared/api-client';
import type { ModuleListResponse } from './types';

export interface ModuleListParams {
  page: number;
  limit: number;
  search?: string;
  status?: ModuleStatus | null;
  featured?: boolean | null;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export const modulesApi = {
  async list(params: ModuleListParams) {
    const response = await apiClient.get<ApiSuccessResponse<ModuleListResponse>>('/api/modules', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search?.trim() || undefined,
        status: params.status ?? undefined,
        featured:
          typeof params.featured === 'boolean' ? String(params.featured) : undefined,
      },
    });

    return response.data.data;
  },
};
