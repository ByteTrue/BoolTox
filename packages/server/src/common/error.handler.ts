import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger.service';
import { sendError } from './response.util';

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes
 */
export const ErrorCode = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT: 'RATE_LIMIT',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNIQUE_CONSTRAINT: 'UNIQUE_CONSTRAINT',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',

  // Business logic
  INVALID_VERSION: 'INVALID_VERSION',
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  RELEASE_NOT_FOUND: 'RELEASE_NOT_FOUND',
  CHECKSUM_MISMATCH: 'CHECKSUM_MISMATCH',
} as const;

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): { code: string; message: string; details: unknown } {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details: issues,
  };
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(
  error: any
): { code: string; message: string; statusCode: number } {
  switch (error.code) {
    case 'P2002':
      return {
        code: ErrorCode.UNIQUE_CONSTRAINT,
        message: 'A record with this value already exists',
        statusCode: 409,
      };
    case 'P2003':
      return {
        code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
        message: 'Related record not found',
        statusCode: 400,
      };
    case 'P2025':
      return {
        code: ErrorCode.NOT_FOUND,
        message: 'Record not found',
        statusCode: 404,
      };
    default:
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database operation failed',
        statusCode: 500,
      };
  }
}

/**
 * Global error handler
 */
export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
      },
    },
    'Request error'
  );

  // Handle specific error types
  if (error instanceof AppError) {
    sendError(reply, error.code, error.message, error.statusCode, error.details);
    return;
  }

  if (error instanceof ZodError) {
    const { code, message, details } = handleZodError(error);
    sendError(reply, code, message, 400, details);
    return;
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    const { code, message, statusCode } = handlePrismaError(error);
    sendError(reply, code, message, statusCode);
    return;
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    const fastifyError = error as FastifyError;
    sendError(
      reply,
      fastifyError.code || ErrorCode.INTERNAL_ERROR,
      fastifyError.message,
      fastifyError.statusCode || 500
    );
    return;
  }

  // Default error response
  sendError(reply, ErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
}

/**
 * Create error factory functions
 */
export const createError = {
  notFound: (message = 'Resource not found', details?: unknown) =>
    new AppError(ErrorCode.NOT_FOUND, message, 404, details),

  unauthorized: (message = 'Unauthorized', details?: unknown) =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401, details),

  forbidden: (message = 'Forbidden', details?: unknown) =>
    new AppError(ErrorCode.FORBIDDEN, message, 403, details),

  validation: (message = 'Validation failed', details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  internal: (message = 'Internal server error', details?: unknown) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details),
};