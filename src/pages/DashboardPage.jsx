import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useNotification } from '../context/NotificationContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  // Hackathon Presentation Simulation State: 'real', 'simulated_success', 'simulated_loading', 'simulated_error'
  const [simMode, setSimMode] = useState('simulated_success');

  // useFetch call to simulated endpoint.
  // In a real backend environment, this calls GET '/dashboard/summary'.
  // While unreachable, it will trigger the error block.
  const { data: realData, loading: realLoading, error: realError, refetch } = useFetch('/dashboard/summary');

  // Hardcoded premium mock data matching the required stats
  const mockSummaryData = {
    stats: {
      availableAssets: { count: 1254, trend: '+4% from last month' },
      allocatedAssets: { count: 3027, trend: '+12% from last quarter' },
      maintenanceToday: { count: 8, trend: '2 high-priority items' },
      activeBookings: { count: 15, trend: '4 rooms, 11 devices' },
      pendingTransfers: { count: 6, trend: 'Awaiting approvals' },
      upcomingReturns: { count: 14, trend: 'Due in next 7 days' },
    },
    overdueReturns: [
      { id: 'AST-4091', name: 'MacBook Pro M3 Max', user: 'Sarah Connor', dept: 'Engineering', dueDate: '2026-07-10', daysOverdue: 2 },
      { id: 'AST-8291', name: 'Tesla Model Y Keycard', user: 'Kyle Reese', dept: 'Sales', dueDate: '2026-07-11', daysOverdue: 1 },
      { id: 'AST-1082', name: 'Nikon Z8 DSLR Camera', user: 'John Connor', dept: 'Marketing', dueDate: '2026-07-08', daysOverdue: 4 },
    ],
    upcomingReturns: [
      { id: 'AST-1294', name: 'iPad Pro M2 12.9"', user: 'Bob Marley', dept: 'Product Design', dueDate: '2026-07-13', status: 'Due tomorrow' },
      { id: 'AST-7291', name: 'Poly Studio Video Bar', user: 'Marcus Wright', dept: 'Operations', dueDate: '2026-07-15', status: 'Due in 3 days' },
      { id: 'AST-6281', name: 'Dell UltraSharp 32" Monitor', user: 'Kate Brewster', dept: 'Customer Support', dueDate: '2026-07-16', status: 'Due in 4 days' },
    ]
  };

  // Derive active rendering variables based on SimMode
  let isLoading = false;
  let isError = false;
  let dashboardData = null;

  if (simMode === 'real') {
    isLoading = realLoading;
    isError = !!realError;
    dashboardData = realData;
  } else if (simMode === 'simulated_success') {
    isLoading = false;
    isError = false;
    dashboardData = mockSummaryData;
  } else if (simMode === 'simulated_loading') {
    isLoading = true;
    isError = false;
    dashboardData = null;
  } else {
    isLoading = false;
    isError = true;
    dashboardData = null;
  }

  // Handle manual retry trigger
  const handleRetry = () => {
    showToast('info', 'Retrying fetch query...');
    if (simMode === 'real') {
      refetch();
    } else {
      // Simulate refetch in mock state by loading first, then restoring error/success
      const prevMode = simMode;
      setSimMode('simulated_loading');
      setTimeout(() => {
        setSimMode(prevMode);
        showToast('error', 'Mock network retry failed: Could not connect to API server.');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Simulation Banner at top (Removable / visible for Hackathon presentation control) */}
      <div className="bg-secondary-900 border border-secondary-800 text-white rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-500 animate-ping"></span>
          <span className="font-semibold text-secondary-200">Hackathon Sandbox Controls:</span>
          <p className="text-secondary-400">Toggle simulated states to test loading wrappers or API connection failure states.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSimMode('simulated_success'); showToast('success', 'Switched to simulated success data.'); }}
            className={`px-3 py-1 rounded-md font-semibold border transition-all ${
              simMode === 'simulated_success' 
                ? 'bg-primary-600 border-primary-500 text-white' 
                : 'bg-secondary-800 border-secondary-700 hover:bg-secondary-750 text-secondary-300'
            }`}
          >
            Mock Data
          </button>
          <button
            onClick={() => { setSimMode('simulated_loading'); }}
            className={`px-3 py-1 rounded-md font-semibold border transition-all ${
              simMode === 'simulated_loading' 
                ? 'bg-primary-600 border-primary-500 text-white' 
                : 'bg-secondary-800 border-secondary-700 hover:bg-secondary-750 text-secondary-300'
            }`}
          >
            Mock Skeleton
          </button>
          <button
            onClick={() => { setSimMode('simulated_error'); showToast('error', 'Switched to simulated endpoint error.'); }}
            className={`px-3 py-1 rounded-md font-semibold border transition-all ${
              simMode === 'simulated_error' 
                ? 'bg-primary-600 border-primary-500 text-white' 
                : 'bg-secondary-800 border-secondary-700 hover:bg-secondary-750 text-secondary-300'
            }`}
          >
            Mock Connection Error
          </button>
          <button
            onClick={() => { setSimMode('real'); showToast('info', 'Attempting real API client binding...'); }}
            className={`px-3 py-1 rounded-md font-semibold border transition-all ${
              simMode === 'real' 
                ? 'bg-primary-600 border-primary-500 text-white' 
                : 'bg-secondary-800 border-secondary-700 hover:bg-secondary-750 text-secondary-300'
            }`}
          >
            Bind Real Endpoint
          </button>
        </div>
      </div>

      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">AssetFlow ERP Dashboard</h1>
        <p className="text-sm text-secondary-500 mt-1">Real-time statistics of physical inventory, allocations, and compliance tasks.</p>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white border border-secondary-200 rounded-xl p-4 shadow-card">
        <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">Quick Operations</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
            onClick={() => navigate('/assets')}
            icon={
              <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Register Asset
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
            onClick={() => navigate('/bookings')}
            icon={
              <svg className="h-4 w-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            Book Resource
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
            onClick={() => navigate('/maintenance')}
            icon={
              <svg className="h-4 w-4 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          >
            Raise Maintenance
          </Button>
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border border-secondary-200 p-4">
                <SkeletonLoader variant="circle" className="h-8 w-8 mb-3" />
                <SkeletonLoader variant="text" className="h-4 w-2/3 mb-2" />
                <SkeletonLoader variant="text" className="h-8 w-1/2 mb-1" />
                <SkeletonLoader variant="text" className="h-3 w-4/5" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-secondary-200 p-6">
              <SkeletonLoader variant="text" className="h-6 w-1/3 mb-4" />
              <div className="flex flex-col gap-3">
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
              </div>
            </Card>
            <Card className="border border-secondary-200 p-6">
              <SkeletonLoader variant="text" className="h-6 w-1/3 mb-4" />
              <div className="flex flex-col gap-3">
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
                <SkeletonLoader variant="rectangular" className="h-14 w-full rounded-lg" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ERROR / UNREACHABLE STATE */}
      {!isLoading && isError && (
        <Card className="border border-danger-100 bg-gradient-to-tr from-white to-danger-50/10 p-8 text-center shadow-card animate-fade-in-up">
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-danger-50 text-danger-500 flex items-center justify-center border border-danger-100 mb-4 animate-pulse">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-secondary-900 mb-1">Failed to Connect to Endpoint</h3>
            <p className="text-sm text-secondary-500 max-w-md mb-6">
              The query requesting `/api/dashboard/summary` returned a network error shape (status: 503). This is normal when the node backend is offline.
            </p>
            <Button
              variant="danger"
              onClick={handleRetry}
              className="flex items-center gap-1.5 shadow-sm"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                </svg>
              }
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* DATA LOADED SUCCESSFULLY */}
      {!isLoading && !isError && dashboardData && (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            
            {/* Available Assets */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Available</span>
                <div className="h-8 w-8 rounded-lg bg-success-50 text-success-600 flex items-center justify-center border border-success-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.availableAssets.count}</span>
              <p className="text-[11px] text-success-600 font-medium mt-1">{dashboardData.stats.availableAssets.trend}</p>
            </Card>

            {/* Allocated Assets */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Allocated</span>
                <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.allocatedAssets.count}</span>
              <p className="text-[11px] text-primary-600 font-medium mt-1">{dashboardData.stats.allocatedAssets.trend}</p>
            </Card>

            {/* Maintenance Today */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Maintenance</span>
                <div className="h-8 w-8 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center border border-danger-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.maintenanceToday.count}</span>
              <p className="text-[11px] text-danger-600 font-medium mt-1">{dashboardData.stats.maintenanceToday.trend}</p>
            </Card>

            {/* Bookings */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Bookings</span>
                <div className="h-8 w-8 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.activeBookings.count}</span>
              <p className="text-[11px] text-accent-600 font-medium mt-1">{dashboardData.stats.activeBookings.trend}</p>
            </Card>

            {/* Pending Transfers */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Transfers</span>
                <div className="h-8 w-8 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center border border-warning-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.pendingTransfers.count}</span>
              <p className="text-[11px] text-warning-600 font-medium mt-1">{dashboardData.stats.pendingTransfers.trend}</p>
            </Card>

            {/* Upcoming Returns */}
            <Card className="border border-secondary-200 p-4 hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Upcoming Returns</span>
                <div className="h-8 w-8 rounded-lg bg-secondary-100 text-secondary-700 flex items-center justify-center border border-secondary-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-secondary-900">{dashboardData.stats.upcomingReturns.count}</span>
              <p className="text-[11px] text-secondary-500 font-medium mt-1">{dashboardData.stats.upcomingReturns.trend}</p>
            </Card>

          </div>

          {/* Overdue and Upcoming Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Overdue Returns Panel */}
            <Card className="border border-danger-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-danger-500" />
              
              <div className="flex items-center justify-between mb-4 pl-2">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-lg font-bold text-secondary-900">Overdue Returns</h2>
                </div>
                <Badge variant="danger">{dashboardData.overdueReturns.length} Assets</Badge>
              </div>

              <div className="flex flex-col gap-3 pl-2">
                {dashboardData.overdueReturns.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-danger-100 bg-danger-50/20 hover:bg-danger-50/40 transition-all text-sm gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-secondary-800">{item.name}</span>
                        <span className="text-xs text-secondary-400 font-mono">({item.id})</span>
                      </div>
                      <p className="text-xs text-secondary-500 mt-0.5">Held by <span className="font-medium text-secondary-700">{item.user}</span> ({item.dept})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-danger-600 font-semibold">Overdue by {item.daysOverdue} days</p>
                      <p className="text-[11px] text-secondary-400">Due {item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Upcoming Returns Panel */}
            <Card className="border border-secondary-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500" />

              <div className="flex items-center justify-between mb-4 pl-2">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-lg font-bold text-secondary-900">Upcoming Returns</h2>
                </div>
                <Badge variant="primary">{dashboardData.upcomingReturns.length} Assets</Badge>
              </div>

              <div className="flex flex-col gap-3 pl-2">
                {dashboardData.upcomingReturns.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-secondary-100 hover:bg-secondary-50 transition-all text-sm gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-secondary-800">{item.name}</span>
                        <span className="text-xs text-secondary-400 font-mono">({item.id})</span>
                      </div>
                      <p className="text-xs text-secondary-500 mt-0.5">Held by <span className="font-medium text-secondary-700">{item.user}</span> ({item.dept})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary-600 font-semibold">{item.status}</p>
                      <p className="text-[11px] text-secondary-400">Due {item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

        </div>
      )}

    </div>
  );
};

export default DashboardPage;
