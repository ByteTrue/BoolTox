import { FastifyRequest, FastifyReply } from 'fastify';
import { securityConfig } from '../../config/server.config';
import { createError } from '../error.handler';
import { authService } from '../../modules/auth/auth.service';

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

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError.unauthorized('Missing authorization header');
  }

  if (!securityConfig.jwtSecret) {
    throw createError.internal('JWT authentication not configured');
  }

  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    throw createError.unauthorized('Invalid authorization format');
  }

  const { user, tokenId } = await authService.verifyAccessToken(token);

  request.user = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles,
    permissions: user.permissions,
    tokenId,
  };
}
