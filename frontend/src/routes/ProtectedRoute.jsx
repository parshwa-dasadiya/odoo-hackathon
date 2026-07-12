import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  // Show a blank/skeleton state while restoring session from localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-secondary-500">Restoring session...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'Employee';
    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Render children wrapped in standard AppLayout
  return <AppLayout>{children}</AppLayout>;
};

export default ProtectedRoute;
