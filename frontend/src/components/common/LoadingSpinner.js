import React from 'react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    white: 'border-white',
    gray: 'border-gray-400',
  };

  return (
    <div
      className={clsx(
        'spinner',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    />
  );
};

export default LoadingSpinner;