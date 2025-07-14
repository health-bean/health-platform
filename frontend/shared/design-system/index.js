// Health Platform Design System
// Main export file for design system

export { designTokens } from './tokens.js';
export * from './utils.js';
export * from './responsive.js';

// Re-export commonly used utilities
export {
  cn,
  getColor,
  getHealthColor,
  focusRing,
  transition,
  shadow,
  buttonVariants,
  inputVariants,
  cardVariants,
} from './utils.js';

// Re-export responsive utilities
export {
  breakpoints,
  responsivePatterns,
  getResponsiveClass,
  responsive,
  useBreakpoint,
  mediaQueries
} from './responsive.js';
