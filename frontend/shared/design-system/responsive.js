// File: frontend/shared/design-system/responsive.js
// Responsive design utilities and breakpoints

// Tailwind CSS breakpoints for reference
export const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices (large desktops)
  '2xl': '1536px' // 2X large devices (larger desktops)
};

// Common responsive patterns
export const responsivePatterns = {
  // Container patterns
  container: {
    mobile: 'max-w-sm mx-auto px-4',
    tablet: 'max-w-4xl mx-auto px-6',
    desktop: 'max-w-6xl mx-auto px-8'
  },
  
  // Grid patterns
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    cards: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
    list: 'grid grid-cols-1 gap-3'
  },
  
  // Flex patterns
  flex: {
    stack: 'flex flex-col space-y-4',
    stackSm: 'flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4 space-y-4',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    wrap: 'flex flex-wrap gap-2'
  },
  
  // Spacing patterns
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    content: 'p-4 sm:p-6 lg:p-8',
    bottomSafe: 'pb-20 sm:pb-4', // Safe area for mobile navigation
  },
  
  // Text patterns
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-lg sm:text-xl lg:text-2xl',
    truncate: 'truncate',
    clamp: 'line-clamp-2 sm:line-clamp-3'
  }
};

// Responsive helper functions
export const getResponsiveClass = (pattern, variant = 'default') => {
  return responsivePatterns[pattern]?.[variant] || '';
};

// Mobile-first responsive utilities
export const responsive = {
  // Hide/show at different breakpoints
  hideOnMobile: 'hidden sm:block',
  hideOnDesktop: 'block sm:hidden',
  showOnTablet: 'hidden md:block lg:hidden',
  
  // Common responsive combinations
  mobileStack: 'flex flex-col sm:flex-row',
  mobileCenter: 'text-center sm:text-left',
  mobileFull: 'w-full sm:w-auto',
  
  // Safe areas for mobile
  mobileSafe: 'pb-safe-bottom',
  headerSafe: 'pt-safe-top'
};

// Responsive breakpoint utilities for JavaScript
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'sm';
  
  const width = window.innerWidth;
  
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

// Media query helpers
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`
};

export default {
  breakpoints,
  responsivePatterns,
  getResponsiveClass,
  responsive,
  useBreakpoint,
  mediaQueries
};
