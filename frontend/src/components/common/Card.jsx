import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  extra,
  className = '',
  bodyClassName = '',
  ...props
}) => {
  const hasHeader = title || subtitle || extra;

  return (
    <div
      className={`bg-white rounded-xl shadow-card overflow-hidden transition-premium hover:shadow-premium ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-secondary-900 leading-6">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs text-secondary-500">{subtitle}</p>}
          </div>
          {extra && <div className="flex-shrink-0">{extra}</div>}
        </div>
      )}
      <div className={`px-6 py-5 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
