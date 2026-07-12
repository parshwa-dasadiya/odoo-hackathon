import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary-50 font-sans relative">
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-secondary-900/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
          role="button"
          aria-label="Close sidebar drawer"
          tabIndex={0}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Topbar 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsOpenMobile={setIsMobileSidebarOpen}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
