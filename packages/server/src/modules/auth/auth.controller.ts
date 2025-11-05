import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateApiKeySchema,
  CreateUserSchema,
  LoginSchema,
  LogoutSchema,
  RefreshTokenSchema,
  RotateApiKeySchema,
  UpdateUserRolesSchema,
  UpdateUserStatusSchema,
  UserIdParamSchema,
  type CreateApiKeyInput,
  type CreateUserInput,
  type LoginInput,
  type LogoutInput,
  type RefreshTokenInput,
  type RotateApiKeyInput,
  type UpdateUserRolesInput,
  type UpdateUserStatusInput,
  type UserIdParam,
} from './auth.schema';
import { authService } from './auth.service';
import { sendSuccess } from '../../common/response.util';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { authenticateAdmin } from '../../common/middleware/auth.middleware';
import { authorizePermissions } from '../../common/middleware/rbac.middleware';
import { PermissionCode, RoleSlug } from '@booltox/shared';
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from './auth.constants';

function getRequestMetadata(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: (request.headers['user-agent'] as string) ?? null,
  };
}

export async function registerAuthRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/login
   */
  app.post(
    '/api/auth/login',
    {
      preHandler: validateRequest(LoginSchema, 'body'),
    },
    async (request, reply: FastifyReply) => {
      const result = await authService.login(request.body as LoginInput, getRequestMetadata(request));
      return sendSuccess(reply, result);
    }
  );

  /**
   * POST /api/auth/refresh
   */
  app.post(
    '/api/auth/refresh',
    {
      preHandler: validateRequest(RefreshTokenSchema, 'body'),
    },
    async (request, reply: FastifyReply) => {
      const result = await authService.refreshToken(
        request.body as RefreshTokenInput,
        getRequestMetadata(request)
      );
      return sendSuccess(reply, result);
    }
  );

  /**
   * POST /api/auth/logout
   */
  app.post(
    '/api/auth/logout',
    {
      preHandler: [validateRequest(LogoutSchema, 'body'), authenticateAdmin],
    },
    async (request, reply: FastifyReply) => {
      await authService.logout(request.body as LogoutInput);
      return sendSuccess(reply, { message: '已退出登录' });
    }
  );

  /**
   * GET /api/auth/profile
   */
  app.get(
    '/api/auth/profile',
    {
      preHandler: [authenticateAdmin],
    },
    async (request, reply: FastifyReply) => {
      return sendSuccess(reply, {
        user: request.user,
      });
    }
  );

  /**
   * GET /api/auth/roles
   */
  app.get(
    '/api/auth/roles',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(
          [PermissionCode.ROLE_MANAGE, PermissionCode.USER_MANAGE],
          'any'
        ),
      ],
    },
    async (_request, reply: FastifyReply) => {
      const roles = Object.values(RoleSlug).map((slug) => ({
        slug,
        description: ROLE_DESCRIPTIONS[slug],
        permissions: ROLE_PERMISSIONS[slug],
      }));

      return sendSuccess(reply, { roles });
    }
  );

  /**
   * POST /api/auth/users
   */
  app.post(
    '/api/auth/users',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.USER_MANAGE), validateRequest(CreateUserSchema, 'body')],
    },
    async (request, reply: FastifyReply) => {
      const operatorId = request.user?.id;
      const user = await authService.createUser(request.body as CreateUserInput, operatorId);
      return sendSuccess(reply, user, 201);
    }
  );

  /**
   * PATCH /api/auth/users/:id/roles
   */
  app.patch(
    '/api/auth/users/:id/roles',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(PermissionCode.USER_MANAGE),
        validateRequest(UserIdParamSchema, 'params'),
        validateRequest(UpdateUserRolesSchema, 'body'),
      ],
    },
    async (request, reply: FastifyReply) => {
      const params = request.params as UserIdParam;
      const body = request.body as UpdateUserRolesInput;
      const user = await authService.updateUserRoles(params.id, body, request.user?.id);
      return sendSuccess(reply, user);
    }
  );

  /**
   * PATCH /api/auth/users/:id/status
   */
  app.patch(
    '/api/auth/users/:id/status',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(PermissionCode.USER_MANAGE),
        validateRequest(UserIdParamSchema, 'params'),
        validateRequest(UpdateUserStatusSchema, 'body'),
      ],
    },
    async (request, reply: FastifyReply) => {
      const params = request.params as UserIdParam;
      const body = request.body as UpdateUserStatusInput;
      const user = await authService.updateUserStatus(params.id, body);
      return sendSuccess(reply, user);
    }
  );

  /**
   * GET /api/auth/api-keys
   */
  app.get(
    '/api/auth/api-keys',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.API_KEY_MANAGE, 'any')],
    },
    async (request, reply: FastifyReply) => {
      const apiKeys = await authService.listApiKeys(request.user!.id);
      return sendSuccess(reply, { apiKeys });
    }
  );

  /**
   * POST /api/auth/api-keys
   */
  app.post(
    '/api/auth/api-keys',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(PermissionCode.API_KEY_MANAGE, 'any'),
        validateRequest(CreateApiKeySchema, 'body'),
      ],
    },
    async (request, reply: FastifyReply) => {
      const result = await authService.createApiKey(request.user!.id, request.body as CreateApiKeyInput);
      return sendSuccess(reply, result, 201);
    }
  );

  /**
   * POST /api/auth/api-keys/rotate
   */
  app.post(
    '/api/auth/api-keys/rotate',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(PermissionCode.API_KEY_MANAGE, 'any'),
        validateRequest(RotateApiKeySchema, 'body'),
      ],
    },
    async (request, reply: FastifyReply) => {
      const result = await authService.rotateApiKey(
        request.user!.id,
        request.body as RotateApiKeyInput
      );
      return sendSuccess(reply, result);
    }
  );

  /**
   * DELETE /api/auth/api-keys/:id
   */
  app.delete(
    '/api/auth/api-keys/:id',
    {
      preHandler: [
        authenticateAdmin,
        authorizePermissions(PermissionCode.API_KEY_MANAGE, 'any'),
        validateRequest(UserIdParamSchema, 'params'),
      ],
    },
    async (request, reply: FastifyReply) => {
      const params = request.params as UserIdParam;
      await authService.revokeApiKey(request.user!.id, params.id);
      return sendSuccess(reply, { message: 'API Key 已撤销' });
    }
  );
}
