// File: frontend/shared/components/ui/Badge.jsx

import React from 'react';
import { cn } from '../../design-system';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  secondary: 'bg-gray-100 text-gray-600 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  default: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm'
};

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className,
  ...props 
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
