import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { errorHandler } from '../error.handler';

/**
 * Global error handling middleware
 * This is a wrapper around the error handler to ensure consistent error responses
 */
export async function errorMiddleware(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return errorHandler(error, request, reply);
}

/**
 * Not found handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  reply.code(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: request.id,
    },
  });
}