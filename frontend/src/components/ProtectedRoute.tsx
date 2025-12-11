import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'dispatcher' | 'driver';
  requireAdmin?: boolean;
  requireOperator?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireAdmin, requireOperator }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin, isOperator } = useAuth();

  if (isLoading) {
    return <div className="loading">Lade...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check role requirements
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" />;
  }

  if (requireOperator && !isOperator()) {
    return <Navigate to="/" />;
  }

  if (requiredRole && user.role !== requiredRole && !isAdmin()) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
