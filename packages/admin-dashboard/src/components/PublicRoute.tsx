import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

export function PublicRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
