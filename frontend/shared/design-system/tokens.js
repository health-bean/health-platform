// Health Platform Design System - Design Tokens
// Centralized design values for consistent UI

// FILO Brand Colors - Warm, chronic illness-friendly palette
export const filoColors = {
  // Primary warm sage - no blue light, gentle on eyes
  primary: {
    50: '#f7f8f6',   // Very light sage
    100: '#e8ebe6',  // Light sage
    200: '#d1d8cc',  // Soft sage
    300: '#b4c4a8',  // Medium sage
    400: '#8fa67e',  // Warm sage
    500: '#7a9268',  // Core sage
    600: '#6b7f5a',  // Deeper sage
    700: '#5a6b4d',  // Deep sage
    800: '#4a5640',  // Very deep sage
    900: '#3a4233'   // Darkest sage
  },
  
  // Warm terracotta for reintroduction - earthy, not harsh
  accent: {
    50: '#faf7f5',   // Very light terracotta
    100: '#f0e6e0',  // Light terracotta
    200: '#e0ccc1',  // Soft terracotta
    300: '#ccaa99',  // Medium terracotta
    400: '#b8896f',  // Warm terracotta
    500: '#a67c52',  // Core terracotta
    600: '#8f6b47',  // Deeper terracotta
    700: '#785a3d',  // Deep terracotta
    800: '#614a33',  // Very deep terracotta
    900: '#4a3929'   // Darkest terracotta
  },
  
  // Warm cream and gray-brown neutrals - no harsh contrasts
  neutral: {
    50: '#fdfcfa',   // Warm cream background
    100: '#f8f6f3',  // Light warm cream
    200: '#f0ede8',  // Soft warm gray
    300: '#e5e1db',  // Medium warm gray
    400: '#d4cfc7',  // Warm beige
    500: '#b8b3aa',  // Medium gray-brown
    600: '#9a9590',  // Dark gray-brown
    700: '#7d7873',  // Deeper gray-brown
    800: '#5f5c57',  // Very dark gray-brown
    900: '#3d3b37'   // Darkest warm charcoal
  }
};

// FILO Protocol Colors - Exact hex colors specified
export const extendedColors = {
  // Soft sage for allowed foods - gentle, not bright green
  allowed: {
    50: '#f6f8f5',   // Very light sage
    100: '#e6ebe3',  // Light sage
    200: '#cdd6c7',  // Soft sage
    300: '#afc2a5',  // Medium sage
    400: '#8fa67e',  // Warm sage
    500: '#7a9268',  // Core sage (matches primary)
    600: '#6b7f5a',  // Deeper sage
    700: '#5a6b4d',  // Deep sage
    800: '#4a5640',  // Very deep sage
    900: '#3a4233'   // Darkest sage
  },
  
  // Warm terracotta for avoid foods - earthy red-brown, not harsh red
  avoid: {
    50: '#faf6f4',   // Very light terracotta
    100: '#f0e3dd',  // Light terracotta
    200: '#e0c7bb',  // Soft terracotta
    300: '#cc9f8f',  // Medium terracotta
    400: '#b8775f',  // Warm terracotta
    500: '#a6634a',  // Core terracotta
    600: '#8f5540',  // Deeper terracotta
    700: '#784736',  // Deep terracotta
    800: '#61392c',  // Very deep terracotta
    900: '#4a2c22'   // Darkest terracotta
  },
  
  // Light cream for warnings - gentle and chronic illness-friendly
  warning: {
    50: '#FFFEF9',   // Much lighter cream
    100: '#faf8f5',  // Very light cream
    200: '#f5f2ed',  // Light warm cream
    300: '#f0ece5',  // Soft cream
    400: '#ebe6dd',  // Medium cream
    500: '#e6e0d5',  // Core warning cream
    600: '#d4c8b8',  // Slightly darker cream
    700: '#c2b09b',  // Warm beige
    800: '#a8967e',  // Deeper beige
    900: '#8e7c61'   // Darkest warm beige
  },
  
  // Warm gray-brown for info - no blue light
  info: {
    50: '#f9f8f6',   // Very light warm gray
    100: '#f0ede8',  // Light warm gray
    200: '#e3ddd5',  // Soft warm gray
    300: '#d1c7ba',  // Medium warm gray
    400: '#b8aa99',  // Warm brown-gray
    500: '#a6967e',  // Core warm gray
    600: '#8f7f6b',  // Deeper warm gray
    700: '#786b5a',  // Deep warm gray
    800: '#615649',  // Very deep warm gray
    900: '#4a4238'   // Darkest warm gray
  }
};

export const designTokens = {
  // FILO Color Palette - Chronic illness optimized
  colors: {
    // Core FILO brand colors
    primary: filoColors.primary,
    accent: filoColors.accent,
    neutral: filoColors.neutral,
    
    // FILO Protocol Colors
    allowed: extendedColors.allowed,   // Green for protocol allowed
    avoid: extendedColors.avoid,       // Red for protocol forbidden
    warning: extendedColors.warning,   // Yellow for warnings
    info: extendedColors.info,         // Blue for info
    
    // Legacy mappings for backward compatibility
    secondary: extendedColors.allowed,  // Map to allowed green
    error: extendedColors.avoid,        // Map to avoid red
    success: extendedColors.allowed,    // Map to allowed green
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    // Neutrals - Clean & Professional
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Special Health Colors
    health: {
      symptom: '#ef4444',    // Red for symptoms
      improvement: '#22c55e', // Green for improvements
      neutral: '#6b7280',     // Gray for neutral
      medication: '#8b5cf6',  // Purple for medications
      supplement: '#06b6d4',  // Cyan for supplements
      food: '#f59e0b',        // Amber for foods
    }
  },
  
  // Typography optimized for readability and chronic illness
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'], // High readability
      mono: ['JetBrains Mono', 'monospace']
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.25rem' }],  // Increased line height
      sm: ['0.875rem', { lineHeight: '1.5rem' }],  // Increased line height
      base: ['1rem', { lineHeight: '1.5rem' }],    // Standard readable line height
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',    // For headings
      normal: '1.5',    // For body text - easier to read
      relaxed: '1.75'   // For long-form content
    },
    
    contrast: {
      minimum: '4.5:1', // WCAG AA compliance
      enhanced: '7:1'   // WCAG AAA for better accessibility
    }
  },
  
  // Spacing Scale - 8px base
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  // Shadows - Subtle & Professional
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Chronic illness-friendly semantic mappings
  semantic: {
    status: {
      info: 'primary',      // FILO teal
      success: 'sage',      // Soft sage green
      warning: 'amber',     // Warm amber
      error: 'coral'        // Muted coral
    },
    health: {
      symptom: 'coral',     // Gentle coral instead of harsh red
      improvement: 'sage',  // Soft sage instead of bright green
      medication: 'lavender', // Calming lavender
      supplement: 'primary', // FILO brand teal
      food: 'accent',       // FILO terracotta
      neutral: 'neutral'    // Warm cream/gray
    },
    protocol: {
      allowed: 'sage',      // Soft green = safe to eat
      avoid: 'coral',       // Muted coral = avoid for now
      reintroduction: 'amber', // Warm amber = try carefully
      unknown: 'neutral'    // Neutral = not specified
    }
  },

  // Layout patterns optimized for chronic illness users
  layout: {
    spacing: {
      section: '1.5rem',    // 24px - generous spacing reduces cognitive load
      card: '1rem',         // 16px - comfortable card spacing
      form: '0.75rem',      // 12px - form field spacing
      tight: '0.5rem'       // 8px - minimal spacing
    },
    containers: {
      maxWidth: '28rem',    // 448px - mobile-first, easy to scan
      padding: '1rem',      // 16px - comfortable touch targets
      margin: '0 auto',     // Centered content
      background: 'neutral-50' // FILO cream background
    },
    accessibility: {
      minTouchTarget: '44px',  // Minimum touch target for motor difficulties
      focusRingWidth: '2px',   // Visible focus indicators
      animationDuration: '200ms' // Gentle transitions, not jarring
    }
  },

  // Component-Specific Tokens - Enhanced for accessibility
  components: {
    button: {
      height: {
        sm: '2.75rem',   // 44px minimum for accessibility
        md: '2.75rem',   // 44px minimum for accessibility
        lg: '3rem',      // 48px
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.625rem 1rem',
        lg: '0.75rem 1.5rem',
      },
      minTouchTarget: '44px', // Chronic illness accessibility
    },
    
    input: {
      height: {
        sm: '2.75rem',   // 44px minimum for accessibility
        md: '2.75rem',   // 44px minimum for accessibility
        lg: '3rem',      // 48px
      },
      padding: '0.625rem 0.75rem',
      minTouchTarget: '44px',
    },
    
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      background: 'neutral-50', // FILO cream background
    },
  },
  
  // Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};
