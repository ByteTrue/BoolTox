import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { createError } from '../error.handler';

/**
 * Validation target
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Create validation middleware for request data
 */
export function validateRequest(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    try {
      const data = request[target];
      request[target] = schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw error; // Will be handled by global error handler
      }
      throw createError.validation('Invalid request data');
    }
  };
}

/**
 * Create validation middleware for request body
 */
export function validateBody(schema: ZodSchema) {
  return validateRequest(schema, 'body');
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validateRequest(schema, 'query');
}

/**
 * Create validation middleware for route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validateRequest(schema, 'params');
}