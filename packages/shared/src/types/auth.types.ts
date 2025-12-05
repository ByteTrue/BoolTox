/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

export enum RoleSlug {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  SUPPORT = 'support',
  VIEWER = 'viewer',
}

export enum PermissionCode {
  RELEASE_READ = 'releases.read',
  RELEASE_WRITE = 'releases.write',
  MODULE_READ = 'modules.read',
  MODULE_WRITE = 'modules.write',
  ANNOUNCEMENT_READ = 'announcements.read',
  ANNOUNCEMENT_WRITE = 'announcements.write',
  LOG_READ = 'logs.read',
  LOG_WRITE = 'logs.write',
  GITHUB_SYNC = 'system.github.sync',
  USER_MANAGE = 'users.manage',
  ROLE_MANAGE = 'roles.manage',
  API_KEY_MANAGE = 'apikeys.manage',
}

export const ALL_PERMISSION_CODES: PermissionCode[] = [
  PermissionCode.RELEASE_READ,
  PermissionCode.RELEASE_WRITE,
  PermissionCode.MODULE_READ,
  PermissionCode.MODULE_WRITE,
  PermissionCode.ANNOUNCEMENT_READ,
  PermissionCode.ANNOUNCEMENT_WRITE,
  PermissionCode.LOG_READ,
  PermissionCode.LOG_WRITE,
  PermissionCode.GITHUB_SYNC,
  PermissionCode.USER_MANAGE,
  PermissionCode.ROLE_MANAGE,
  PermissionCode.API_KEY_MANAGE,
];

export type RolePermissionsMatrix = Record<RoleSlug, PermissionCode[]>;

export interface AuthUserProfile {
  id: string;
  email: string;
  displayName?: string | null;
  roles: RoleSlug[];
  permissions: PermissionCode[];
  isActive: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  tokenType: 'access';
  jti: string;
  roles: RoleSlug[];
  permissions: PermissionCode[];
  iat?: number;
  exp?: number;
}
