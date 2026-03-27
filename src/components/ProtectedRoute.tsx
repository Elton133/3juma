import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  loginPath: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, loginPath }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
