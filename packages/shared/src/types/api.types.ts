/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  message?: string;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination response
 */
export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationResponse;
}