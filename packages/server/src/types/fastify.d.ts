import type { PermissionCode, RoleSlug } from '@booltox/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      displayName?: string | null;
      roles: RoleSlug[];
      permissions: PermissionCode[];
      tokenId: string;
    };
  }
}
