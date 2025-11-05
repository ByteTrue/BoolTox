import type { AuthUserProfile } from '@booltox/shared';

export interface StoredAuthState {
  user: AuthUserProfile;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const STORAGE_KEY = 'booltox_admin_auth';

function read(): StoredAuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredAuthState;
    if (!parsed.accessToken || !parsed.refreshToken) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse auth storage', error);
    return null;
  }
}

function write(state: StoredAuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clear() {
  localStorage.removeItem(STORAGE_KEY);
}

export const authStorage = {
  get: read,
  set: write,
  clear,
};
