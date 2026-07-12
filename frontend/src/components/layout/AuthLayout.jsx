import React from 'react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-secondary-50 font-sans">
      
      {/* Left Pane - Branding Panel (Collapses on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-secondary-950 via-primary-900 to-secondary-950 text-white p-12 flex-col justify-between overflow-hidden">
        
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Glowing backdrop blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
            <span className="ml-2 text-xs font-medium text-primary-200 border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 rounded-full select-none">
              v1.0
            </span>
          </div>
        </div>

        {/* Tagline / Middle Hero Section */}
        <div className="relative z-10 my-auto max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight leading-tight text-white mb-6">
            The modern operating system for <span className="text-primary-300">enterprise assets</span>.
          </h1>
          <p className="text-secondary-300 text-base leading-relaxed">
            Track physical inventory, manage employee allocations, book rooms and vehicles, and route maintenance requests through automated audit trails. 
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-secondary-400">
          <span>&copy; {new Date().getFullYear()} AssetFlow Technologies Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-premium">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-premium">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Pane - Form Card Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        {/* Floating circles on mobile background */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          {/* Logo visible on Mobile only */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-secondary-900">AssetFlow</span>
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
