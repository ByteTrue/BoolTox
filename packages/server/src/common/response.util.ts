import { FastifyReply } from 'fastify';

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200
): FastifyReply {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: reply.request.id,
    },
  };

  return reply.code(statusCode).send(response);
}

/**
 * Send error response
 */
export function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): FastifyReply {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: reply.request.id,
    },
  };

  return reply.code(statusCode).send(response);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  items: T[],
  total: number,
  page: number,
  limit: number
): FastifyReply {
  const totalPages = Math.ceil(total / limit);

  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: reply.request.id,
    },
  };

  return reply.code(200).send(response);
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(Math.max(1, limit || 10), 100); // Max 100 items per page

  return { page: validPage, limit: validLimit };
}