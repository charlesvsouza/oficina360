import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}