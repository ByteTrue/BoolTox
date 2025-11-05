import { apiClient } from '../../shared/api-client';
import type { AuthResponse, LoginPayload } from './types';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
      '/api/auth/login',
      payload
    );
    return data.data;
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
      '/api/auth/refresh',
      {
        refreshToken,
      }
    );
    return data.data;
  },

  async logout(refreshToken: string) {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (error) {
      // 如果刷新令牌已失效，则忽略错误
      console.warn('Logout failed:', error);
    }
  },
};
