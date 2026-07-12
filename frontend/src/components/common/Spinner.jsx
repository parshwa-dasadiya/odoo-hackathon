import React from 'react';

export const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    xs: 'h-3.5 w-3.5 stroke-[3px]',
    sm: 'h-4 w-4 stroke-[2.5px]',
    md: 'h-5 w-5 stroke-[2px]',
    lg: 'h-8 w-8 stroke-[2px]',
  };

  const colors = {
    primary: 'text-primary-600',
    white: 'text-white',
    secondary: 'text-secondary-400',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Spinner;
