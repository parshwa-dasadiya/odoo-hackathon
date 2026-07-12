import React from 'react';

export const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  error = '',
  touched = false,
  placeholder = '',
  required = false,
  disabled = false,
  icon = null,
  onChange,
  onBlur,
  className = '',
  ...props
}, ref) => {
  const hasError = error && touched;
  
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold text-secondary-700 tracking-wide uppercase select-none flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-danger-500">*</span>}
          </span>
        </label>
      )}
      
      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`
            w-full text-sm rounded-lg transition-premium border bg-white
            ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2
            focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-secondary-50 disabled:text-secondary-400
            ${hasError 
              ? 'border-danger-500 text-danger-900 placeholder-danger-300 focus:border-danger-500 focus:ring-danger-200' 
              : 'border-secondary-200 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-100'
            }
          `}
          {...props}
        />
      </div>
      
      {hasError && (
        <span className="text-xs text-danger-500 font-medium flex items-center gap-1 animate-fade-in-up mt-0.5">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
