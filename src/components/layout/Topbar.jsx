import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import { getNotifications, saveNotifications } from '../../utils/mockDb';

export const Topbar = ({ isSidebarCollapsed, setIsSidebarCollapsed, setIsOpenMobile }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync notifications with localStorage custom events
  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getNotifications());
    };
    handleUpdate();
    window.addEventListener('assetflow-notifications-updated', handleUpdate);
    return () => window.removeEventListener('assetflow-notifications-updated', handleUpdate);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe user initial helper
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = new Date('2026-07-12T09:54:00Z') - date; // Compare to current standard baseline
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toISOString().split('T')[0];
  };

  return (
    <header className="h-16 bg-white border-b border-secondary-200 px-4 sm:px-6 flex items-center justify-between z-20 shadow-sm select-none">
      
      {/* Left side: Hamburger Toggle & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile drawer toggle */}
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-1.5 rounded-lg hover:bg-secondary-50 text-secondary-500 hover:text-secondary-800 md:hidden transition-premium focus:outline-none"
          aria-label="Open sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar Collapse switch (Desktop) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary-50 text-secondary-500 hover:text-secondary-800 hidden md:block transition-premium focus:outline-none"
          aria-label={isSidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>

        <h2 className="text-sm font-bold text-secondary-800 select-text">AssetFlow ERP</h2>
      </div>

      {/* Center: Search input */}
      <div className="max-w-md w-full mx-6 hidden sm:block">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            readOnly
            placeholder="Quick search... (Press Ctrl + K)"
            className="pl-9 pr-4 py-1.5 w-full bg-secondary-50 border border-secondary-200 rounded-lg text-xs text-secondary-750 placeholder-secondary-400 focus:outline-none cursor-not-allowed"
          />
        </div>
      </div>

      {/* Right side: Notifications & User profile */}
      <div className="flex items-center gap-3.5">
        
        {/* Search icon for mobile screen */}
        <button className="p-1.5 rounded-lg hover:bg-secondary-50 text-secondary-500 sm:hidden transition-premium focus:outline-none">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-lg transition-premium relative focus:outline-none ${
              showNotifications ? 'bg-secondary-50 text-secondary-800' : 'hover:bg-secondary-50 text-secondary-500 hover:text-secondary-800'
            }`}
            aria-label="View notifications"
          >
            <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Unread notification indicator */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-secondary-200 rounded-xl shadow-popover overflow-hidden z-30 animate-fade-in-up">
              <div className="px-4 py-3 bg-secondary-50 border-b border-secondary-200 flex items-center justify-between">
                <span className="font-semibold text-secondary-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-750 focus:outline-none"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto divide-y divide-secondary-100">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 rounded-full bg-secondary-100 text-secondary-400 flex items-center justify-center mb-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-semibold text-secondary-800 mb-0.5">No notifications yet</h4>
                    <p className="text-[11px] text-secondary-400">We'll alert you when handovers or maintenance logs change.</p>
                  </div>
                ) : (
                  notifications.slice(0, 4).map((notif) => (
                    <div key={notif.id} className={`p-3 text-xs leading-normal transition-premium ${notif.read ? 'bg-white text-secondary-600' : 'bg-primary-50/15 text-secondary-850 font-medium'}`}>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-bold text-secondary-750 text-[11px]">{notif.type}</span>
                        <span className="text-[9px] text-secondary-400 font-mono whitespace-nowrap">{getRelativeTime(notif.date)}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-secondary-100 p-2.5 text-center bg-secondary-50/50">
                <a
                  href="/logs"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-750 transition-premium"
                >
                  View All Activity & Notifications
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 hover:bg-secondary-50 rounded-lg transition-premium focus:outline-none"
            aria-label="Open user profile settings menu"
          >
            {/* Colored Initial Avatar */}
            <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              {getUserInitial()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-secondary-800 line-clamp-1 leading-none mb-0.5">{user?.name || 'Sarah Connor'}</p>
              <p className="text-[10px] text-secondary-400 font-semibold uppercase tracking-wider leading-none">{user?.role || 'Admin'}</p>
            </div>
            <svg className="h-3.5 w-3.5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Menu Popover */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white border border-secondary-200 rounded-xl shadow-popover py-1.5 z-30 animate-fade-in-up">
              <div className="px-4 py-2 border-b border-secondary-100 text-xs sm:hidden">
                <p className="font-bold text-secondary-800">{user?.name || 'Sarah Connor'}</p>
                <p className="text-secondary-400 mt-0.5">{user?.role || 'Admin'}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition-premium focus:outline-none"
              >
                Sign Out / Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
