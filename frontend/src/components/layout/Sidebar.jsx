import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { navPermissions } from '../../routes/navPermissions';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isOpenMobile, setIsOpenMobile }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const userRole = user?.role || 'Employee';

  // Navigation Items grouping
  const menuGroups = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11V11a2 2 0 01-2 2H5" />
            </svg>
          ),
        }
      ]
    },
    {
      title: 'Assets',
      items: [
        {
          label: 'Asset Directory',
          path: '/assets',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          label: 'Allocations & Transfers',
          path: '/assets/allocation',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
        }
      ]
    },
    {
      title: 'Resources',
      items: [
        {
          label: 'Resource Bookings',
          path: '/bookings',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: 'Maintenance',
      items: [
        {
          label: 'Maintenance Logs',
          path: '/maintenance',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        }
      ]
    },
    {
      title: 'Compliance & Audits',
      items: [
        {
          label: 'Compliance Audits',
          path: '/audits',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Reports & Analytics',
          path: '/reports',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9 0v-8a2 2 0 00-2-2h-2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          ),
        },
        {
          label: 'Organization Setup',
          path: '/setup',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          label: 'Activity Logs',
          path: '/logs',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      ]
    }
  ];

  // Helper check if role is allowed
  const hasAccess = (path) => {
    const allowed = navPermissions[path];
    if (!allowed) return true; // default public
    return allowed.includes(userRole);
  };

  const sidebarBase = 'bg-secondary-950 text-white h-screen flex flex-col border-r border-secondary-800 transition-all duration-300 z-30 select-none';
  const sidebarResponsive = isOpenMobile 
    ? 'fixed inset-y-0 left-0 w-64 translate-x-0' 
    : 'fixed inset-y-0 left-0 w-64 -translate-x-full md:relative md:translate-x-0';

  const handleLinkClick = (path) => {
    navigate(path);
    if (isOpenMobile) {
      setIsOpenMobile(false);
    }
  };

  return (
    <aside className={`${sidebarBase} ${sidebarResponsive} ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}>
      
      {/* Brand Header */}
      <div className={`h-16 flex items-center gap-3 px-6 border-b border-secondary-800/80 ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}>
        <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => handleLinkClick('/dashboard')}>
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        {(!isCollapsed || isOpenMobile) && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <span className="font-bold tracking-tight text-white text-base">AssetFlow</span>
            <span className="text-[10px] text-accent-400 font-semibold bg-accent-500/10 border border-accent-500/20 px-1.5 py-0.5 rounded-full select-none">ERP</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {menuGroups.map((group, groupIdx) => {
          // Filter items by permission
          const allowedItems = group.items.filter(item => hasAccess(item.path));
          if (allowedItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1.5">
              {/* Group Title */}
              {(!isCollapsed || isOpenMobile) ? (
                <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-wider px-3 select-none">
                  {group.title}
                </p>
              ) : (
                <div className="h-px bg-secondary-800 mx-2" />
              )}

              {/* Group Items */}
              <nav className="space-y-0.5">
                {allowedItems.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleLinkClick(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-premium font-medium text-left ${
                        isActive 
                          ? 'bg-primary-600 text-white font-semibold shadow-sm' 
                          : 'text-secondary-400 hover:text-white hover:bg-secondary-850/50'
                      } ${isCollapsed && !isOpenMobile ? 'md:justify-center md:px-0 md:w-10 md:mx-auto' : ''}`}
                      title={isCollapsed && !isOpenMobile ? item.label : undefined}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'}`}>
                        {item.icon}
                      </span>
                      {(!isCollapsed || isOpenMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Collapse Trigger Footer (Desktop only) */}
      <div className="p-4 border-t border-secondary-800/80 hidden md:block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-secondary-900 hover:bg-secondary-850 text-secondary-400 hover:text-white transition-premium border border-secondary-800/40"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`h-4.5 w-4.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
