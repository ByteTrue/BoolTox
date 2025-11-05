import axios, { AxiosError } from 'axios';
import { authStorage } from '../storage/auth-storage';
import { authEvents } from '../storage/auth-events';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.request.use((config) => {
  const auth = authStorage.get();
  if (auth?.accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !isRefreshing &&
      error.config &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/refresh')
    ) {
      isRefreshing = true;
      refreshPromise = authEvents.emitRefreshRequested();
      try {
        await refreshPromise;
        refreshPromise = null;
        isRefreshing = false;
        return apiClient(error.config);
      } catch (refreshError) {
        refreshPromise = null;
        isRefreshing = false;
        authEvents.emitSessionExpired();
        throw refreshError;
      }
    }

    if (error.response?.status === 401 && isRefreshing && refreshPromise) {
      await refreshPromise;
      return apiClient(error.config!);
    }

    throw error;
  }
);
