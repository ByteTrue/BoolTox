import type { PermissionCode, RoleSlug } from '@booltox/shared';

export interface AuthContextMetadata {
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName?: string | null;
  isActive: boolean;
  roles: RoleSlug[];
  permissions: PermissionCode[];
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
