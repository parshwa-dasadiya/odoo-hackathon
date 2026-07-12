import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/DashboardPage';
import AssetsPage from '../pages/AssetsPage';
import AllocationPage from '../pages/AllocationPage';
import BookingsPage from '../pages/BookingsPage';
import MaintenancePage from '../pages/MaintenancePage';
import AuditsPage from '../pages/AuditsPage';
import ReportsPage from '../pages/ReportsPage';
import OrgSetupPage from '../pages/OrgSetupPage';
import LogsPage from '../pages/LogsPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { navPermissions } from './navPermissions';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes wrapped in AuthLayout */}
      <Route path="/login" element={
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      } />
      <Route path="/signup" element={
        <AuthLayout>
          <SignupPage />
        </AuthLayout>
      } />
      <Route path="/forgot-password" element={
        <AuthLayout>
          <ForgotPasswordPage />
        </AuthLayout>
      } />

      {/* Protected Routes wrapped in ProtectedRoute + AppLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/dashboard']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/assets']}>
            <AssetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets/allocation"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/assets/allocation']}>
            <AllocationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/bookings']}>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/maintenance']}>
            <MaintenancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audits"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/audits']}>
            <AuditsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/reports']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/setup']}>
            <OrgSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute allowedRoles={navPermissions['/logs']}>
            <LogsPage />
          </ProtectedRoute>
        }
      />

      {/* Standard standalone 403 screen inside AppLayout shell */}
      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        }
      />

      {/* Default Fallback Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
