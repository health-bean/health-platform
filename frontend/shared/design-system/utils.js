// Design System Utilities
// Helper functions for consistent styling

import { designTokens } from './tokens.js';

// Class name utility (similar to clsx/classnames)
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Get color value from design tokens
export const getColor = (colorPath) => {
  const keys = colorPath.split('.');
  let value = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || colorPath;
};

// Generate component variants
export const createVariants = (baseClasses, variants) => {
  return (variant = 'default') => {
    const variantClasses = variants[variant] || variants.default || '';
    return cn(baseClasses, variantClasses);
  };
};

// Responsive utility
export const responsive = (values) => {
  const breakpoints = ['sm', 'md', 'lg', 'xl'];
  let classes = '';
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'base') {
      classes += ` ${value}`;
    } else if (breakpoints.includes(breakpoint)) {
      classes += ` ${breakpoint}:${value}`;
    }
  });
  
  return classes.trim();
};

// Health-specific color utilities
export const getHealthColor = (type, shade = 500) => {
  const healthColors = {
    symptom: designTokens.colors.error[shade],
    improvement: designTokens.colors.success[shade],
    medication: '#8b5cf6',
    supplement: '#06b6d4',
    food: designTokens.colors.accent[shade],
    neutral: designTokens.colors.gray[shade],
  };
  
  return healthColors[type] || healthColors.neutral;
};

// Component size utilities
export const getComponentSize = (component, size = 'md') => {
  return designTokens.components[component]?.[size] || size;
};

// Focus ring utility for accessibility
export const focusRing = (color = 'primary') => {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`;
};

// Transition utility
export const transition = (properties = 'all', duration = 'normal') => {
  const dur = designTokens.animation.duration[duration] || duration;
  const easing = designTokens.animation.easing.ease;
  return `transition-${properties} duration-${dur} ${easing}`;
};

// Shadow utility
export const shadow = (size = 'base') => {
  const shadows = {
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  return shadows[size] || shadows.base;
};

// Spacing utility
export const spacing = (value) => {
  return designTokens.spacing[value] || value;
};

// Typography utility
export const typography = (size = 'base', weight = 'normal') => {
  const sizeClass = `text-${size}`;
  const weightClass = `font-${weight}`;
  return cn(sizeClass, weightClass);
};

// Health status color mapping
export const getStatusColor = (status) => {
  const statusColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-green-500 bg-green-50',
    fair: 'text-yellow-600 bg-yellow-50',
    poor: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  
  return statusColors[status] || statusColors.fair;
};

// Form validation state colors
export const getValidationColor = (state) => {
  const validationColors = {
    success: 'border-green-500 focus:ring-green-500',
    error: 'border-red-500 focus:ring-red-500',
    warning: 'border-yellow-500 focus:ring-yellow-500',
    default: 'border-gray-300 focus:ring-primary-500',
  };
  
  return validationColors[state] || validationColors.default;
};

// Button variant generator
export const buttonVariants = createVariants(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-primary-600 underline-offset-4 hover:underline focus:ring-primary-500',
  }
);

// Input variant generator
export const inputVariants = createVariants(
  'flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    default: 'border-gray-300 focus:ring-primary-500',
    success: 'border-green-500 focus:ring-green-500',
    error: 'border-red-500 focus:ring-red-500',
    warning: 'border-yellow-500 focus:ring-yellow-500',
  }
);

// Card variant generator
export const cardVariants = createVariants(
  'rounded-lg border bg-white shadow-sm',
  {
    default: 'border-gray-200',
    elevated: 'border-gray-200 shadow-md',
    outlined: 'border-gray-300 shadow-none',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  }
);

export default {
  cn,
  getColor,
  createVariants,
  responsive,
  getHealthColor,
  getComponentSize,
  focusRing,
  transition,
  shadow,
  spacing,
  typography,
  getStatusColor,
  getValidationColor,
  buttonVariants,
  inputVariants,
  cardVariants,
};
