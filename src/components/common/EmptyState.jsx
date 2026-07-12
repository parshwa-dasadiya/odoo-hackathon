import React from 'react';

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items to show at the moment.',
  action = null,
  icon = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-secondary-300 rounded-xl bg-secondary-50/30 ${className}`}>
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-secondary-100 text-secondary-400 mb-4">
        {icon || (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>
      
      <h3 className="text-sm font-semibold text-secondary-900 mb-1">{title}</h3>
      <p className="text-xs text-secondary-500 max-w-sm mb-5">{description}</p>
      
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default EmptyState;
