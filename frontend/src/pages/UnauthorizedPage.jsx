import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-fade-in-up">
      <Card className="max-w-md w-full border border-secondary-200 text-center p-8 bg-white shadow-premium">
        <div className="flex flex-col items-center">
          {/* Animated lock / caution icon */}
          <div className="h-16 w-16 bg-danger-50 text-danger-500 rounded-full border border-danger-100 flex items-center justify-center mb-6">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-secondary-900 tracking-tight mb-2">403</h1>
          <h2 className="text-lg font-semibold text-secondary-800 mb-3">Access Denied</h2>
          <p className="text-sm text-secondary-500 mb-6 max-w-sm">
            Your current account role <span className="font-semibold text-secondary-800 bg-secondary-100 px-2 py-0.5 rounded-md">{user?.role || 'Guest'}</span> does not have the permissions required to view this module.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
