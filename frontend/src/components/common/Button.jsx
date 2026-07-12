import React from 'react';
import Spinner from './Spinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm border border-transparent',
    secondary: 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50 hover:text-secondary-900 shadow-sm',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm border border-transparent',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm border border-transparent',
    ghost: 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const spinnerColors = {
    primary: 'white',
    secondary: 'secondary',
    accent: 'white',
    danger: 'white',
    ghost: 'secondary',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} color={spinnerColors[variant]} />}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex items-center justify-center">{icon}</span>
      )}
      
      <span className="truncate">{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex items-center justify-center">{icon}</span>
      )}
    </button>
  );
};

export default Button;
