import { Navigate, Outlet } from 'react-router-dom';

export function SuperAdminRoute() {
  const token = localStorage.getItem('superAdminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
