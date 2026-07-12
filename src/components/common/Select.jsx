import React from 'react';

export const Select = React.forwardRef(({
  label,
  name,
  options = [],
  error = '',
  touched = false,
  placeholder = '',
  required = false,
  disabled = false,
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
        <select
          ref={ref}
          id={name}
          name={name}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          className={`
            w-full text-sm rounded-lg transition-premium border bg-white appearance-none
            pl-3.5 pr-10 py-2
            focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-secondary-50 disabled:text-secondary-400
            ${hasError 
              ? 'border-danger-500 text-danger-900 focus:border-danger-500 focus:ring-danger-200' 
              : 'border-secondary-200 text-secondary-900 focus:border-primary-500 focus:ring-primary-100'
            }
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom arrow indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-secondary-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

Select.displayName = 'Select';

export default Select;
