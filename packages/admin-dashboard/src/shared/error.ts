import type { AxiosError } from 'axios';

export function extractApiErrorMessage(
  error: unknown,
  fallback: string = '请求失败，请稍后重试。'
): string {
  if (!error) {
    return fallback;
  }

  const axiosError = error as AxiosError<{ error?: { message?: string } }>;

  if (axiosError?.response?.data?.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
