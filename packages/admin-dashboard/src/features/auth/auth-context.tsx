import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthUserProfile, PermissionCode } from '@booltox/shared';
import { authStorage } from '../../storage/auth-storage';
import { authEvents } from '../../storage/auth-events';
import { authApi } from './api';
import type { AuthResponse, LoginPayload } from './types';

interface AuthState {
  user: AuthUserProfile | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
}

interface AuthContextValue {
  user: AuthUserProfile | null;
  permissions: PermissionCode[];
  isAuthenticated: boolean;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshToken: null,
  refreshTokenExpiresAt: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [initializing, setInitializing] = useState(true);
  const refreshingRef = useRef(false);

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    const { user, tokens } = response;
    const record = {
      user,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    };
    authStorage.set(record);
    setState(record);
  }, []);

  useEffect(() => {
    const stored = authStorage.get();
    if (stored) {
      setState({
        user: stored.user,
        accessToken: stored.accessToken,
        accessTokenExpiresAt: stored.accessTokenExpiresAt,
        refreshToken: stored.refreshToken,
        refreshTokenExpiresAt: stored.refreshTokenExpiresAt,
      });
    }
    setInitializing(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    const refreshToken = state.refreshToken;
    authStorage.clear();
    setState(initialState);
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
  }, [state.refreshToken]);

  const refreshSession = useCallback(async (): Promise<AuthResponse | null> => {
    if (refreshingRef.current) {
      return null;
    }
    const stored = authStorage.get();
    if (!stored?.refreshToken) {
      throw new Error('Missing refresh token');
    }
    try {
      refreshingRef.current = true;
      const response = await authApi.refresh(stored.refreshToken);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      authStorage.clear();
      setState(initialState);
      throw error;
    } finally {
      refreshingRef.current = false;
    }
  }, [applyAuthResponse]);

  useEffect(() => {
    const unsubscribeRefresh = authEvents.onRefresh(async () => {
      await refreshSession();
    });
    const unsubscribeExpired = authEvents.onExpired(() => {
      void logout();
    });

    return () => {
      unsubscribeRefresh();
      unsubscribeExpired();
    };
  }, [logout, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      permissions: state.user?.permissions ?? [],
      isAuthenticated: Boolean(state.user && state.accessToken),
      initializing,
      login,
      logout,
      refreshSession,
    }),
    [state, initializing, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
