import type { FastifyReply, FastifyRequest } from 'fastify';
import { PermissionCode, RoleSlug } from '@booltox/shared';
import { createError } from '../error.handler';

type PermissionCheckMode = 'all' | 'any';

function assertAuthenticated(request: FastifyRequest) {
  if (!request.user) {
    throw createError.unauthorized('未登录或访问令牌无效');
  }
}

export function authorizeRoles(requiredRoles: RoleSlug[] | RoleSlug) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    assertAuthenticated(request);

    const userRoles = request.user!.roles;

    if (userRoles.includes(RoleSlug.SUPER_ADMIN)) {
      return;
    }

    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw createError.forbidden('角色权限不足');
    }
  };
}

export function authorizePermissions(
  requiredPermissions: PermissionCode[] | PermissionCode,
  mode: PermissionCheckMode = 'all'
) {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    assertAuthenticated(request);

    if (request.user!.roles.includes(RoleSlug.SUPER_ADMIN)) {
      return;
    }

    const userPermissions = new Set(request.user!.permissions);

    const hasPermissions =
      mode === 'all'
        ? permissions.every((permission) => userPermissions.has(permission))
        : permissions.some((permission) => userPermissions.has(permission));

    if (!hasPermissions) {
      throw createError.forbidden('权限不足，无法访问该资源');
    }
  };
}
