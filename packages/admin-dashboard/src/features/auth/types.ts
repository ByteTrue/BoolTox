import type { AuthUserProfile } from '@booltox/shared';

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse {
  user: AuthUserProfile;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}
