import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@features/auth/providers/AuthProvider';

export function AuthGate() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
