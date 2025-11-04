import { FastifyRequest, FastifyReply } from 'fastify';
import { securityConfig } from '../../config/server.config';
import { createError } from '../error.handler';

/**
 * Authentication middleware for client API
 * Validates x-client-token header
 */
export async function authenticateClient(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = request.headers['x-client-token'];

  if (!token) {
    throw createError.unauthorized('Missing x-client-token header');
  }

  if (token !== securityConfig.clientApiToken) {
    throw createError.unauthorized('Invalid client token');
  }
}

/**
 * Authentication middleware for ingest API
 * Validates x-ingest-secret header
 */
export async function authenticateIngest(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const secret = request.headers['x-ingest-secret'];

  if (!secret) {
    throw createError.unauthorized('Missing x-ingest-secret header');
  }

  if (secret !== securityConfig.ingestSharedSecret) {
    throw createError.unauthorized('Invalid ingest secret');
  }
}

/**
 * Authentication middleware for admin API
 * Validates JWT token (placeholder for future implementation)
 */
export async function authenticateAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw createError.unauthorized('Missing authorization header');
  }

  // TODO: Implement JWT validation
  // For now, check if JWT_SECRET is configured
  if (!securityConfig.jwtSecret) {
    throw createError.internal('JWT authentication not configured');
  }

  // Placeholder: Extract and validate JWT token
  const token = authorization.replace('Bearer ', '');
  if (!token) {
    throw createError.unauthorized('Invalid authorization format');
  }

  // TODO: Verify JWT token
  // const payload = jwt.verify(token, securityConfig.jwtSecret);
  // request.user = payload;
}