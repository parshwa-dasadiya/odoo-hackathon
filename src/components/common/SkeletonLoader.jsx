import React from 'react';

export const SkeletonLoader = ({
  variant = 'rect',
  width = 'w-full',
  height = 'h-4',
  count = 1,
  className = '',
}) => {
  const baseStyles = 'bg-secondary-200 animate-pulse-subtle';

  const variants = {
    text: 'rounded-md h-3.5',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  };

  const loaders = Array.from({ length: count });

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {loaders.map((_, i) => (
        <div
          key={i}
          className={`${baseStyles} ${variants[variant]} ${width} ${height} ${className}`}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
