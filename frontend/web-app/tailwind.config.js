/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/components/**/*.{js,ts,jsx,tsx}", // More specific path to avoid node_modules
    "../shared/utils/**/*.{js,ts,jsx,tsx}",     // More specific path to avoid node_modules
  ],
  theme: {
    extend: {
      colors: {
        // FILO Primary - Warm Sage (chronic illness friendly)
        primary: {
          50: '#f7f8f6',
          100: '#e8ebe6',
          200: '#d1d8cc',
          300: '#b4c4a8',
          400: '#8fa67e',
          500: '#7a9268',
          600: '#6b7f5a',
          700: '#5a6b4d',
          800: '#4a5640',
          900: '#3a4233',
        },
        
        // FILO Accent - Warm Terracotta (earthy, not harsh)
        accent: {
          50: '#faf7f5',
          100: '#f0e6e0',
          200: '#e0ccc1',
          300: '#ccaa99',
          400: '#b8896f',
          500: '#a67c52',
          600: '#8f6b47',
          700: '#785a3d',
          800: '#614a33',
          900: '#4a3929',
        },
        
        // FILO Neutral - Warm cream and gray-brown
        neutral: {
          50: '#fdfcfa',
          100: '#f8f6f3',
          200: '#f0ede8',
          300: '#e5e1db',
          400: '#d4cfc7',
          500: '#b8b3aa',
          600: '#9a9590',
          700: '#7d7873',
          800: '#5f5c57',
          900: '#3d3b37',
        },
        
        // FILO Protocol Colors - Soft sage for allowed
        allowed: {
          50: '#f6f8f5',
          100: '#e6ebe3',
          200: '#cdd6c7',
          300: '#afc2a5',
          400: '#8fa67e',
          500: '#7a9268',
          600: '#6b7f5a',
          700: '#5a6b4d',
          800: '#4a5640',
          900: '#3a4233',
        },
        
        avoid: {
          50: '#faf6f4',
          100: '#f0e3dd',
          200: '#e0c7bb',
          300: '#cc9f8f',
          400: '#b8775f',
          500: '#a6634a',
          600: '#8f5540',
          700: '#784736',
          800: '#61392c',
          900: '#4a2c22',
        },
        
        warning: {
          50: '#fdfcfa',
          100: '#faf8f5',
          200: '#f5f2ed',
          300: '#f0ece5',
          400: '#ebe6dd',
          500: '#e6e0d5',
          600: '#d4c8b8',
          700: '#c2b09b',
          800: '#a8967e',
          900: '#8e7c61',
        },
        
        info: {
          50: '#f9f8f6',
          100: '#f0ede8',
          200: '#e3ddd5',
          300: '#d1c7ba',
          400: '#b8aa99',
          500: '#a6967e',
          600: '#8f7f6b',
          700: '#786b5a',
          800: '#615649',
          900: '#4a4238',
        },
        
        // Legacy mappings for backward compatibility
        secondary: {
          50: '#f0fff0',
          100: '#ccf2cc',
          200: '#99e699',
          300: '#66d966',
          400: '#339933',
          500: '#336633',
          600: '#336633',
          700: '#2d5529',
          800: '#264426',
          900: '#1f331f',
        },
        
        error: {
          50: '#fff0f0',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#cc3333',
          500: '#993333',
          600: '#993333',
          700: '#802929',
          800: '#661f1f',
          900: '#4d1616',
        },
        
        success: {
          50: '#f0fff0',
          100: '#ccf2cc',
          200: '#99e699',
          300: '#66d966',
          400: '#339933',
          500: '#336633',
          600: '#336633',
          700: '#2d5529',
          800: '#264426',
          900: '#1f331f',
        },
        
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Chronic illness accessibility spacing
      spacing: {
        '11': '2.75rem', // 44px - minimum touch target
      },
      
      // Enhanced line heights for readability
      lineHeight: {
        'relaxed': '1.75',
      },
      
      // Animation durations for gentle transitions
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
