import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  icon: Icon, 
  children, 
  className = '',
  ...props 
}) => {
  const variants = {
    primary: '!bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: '!bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300',
    success: '!bg-green-600 hover:bg-green-700 text-white border-green-600',
    danger: '!bg-red-600 hover:bg-red-700 text-white border-red-600',
    warning: '!bg-orange-600 hover:bg-orange-700 text-white border-orange-600',
    ghost: '!bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    outline: '!bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
    'outline-primary': '!bg-transparent hover:bg-blue-50 text-blue-600 border-blue-300 hover:border-blue-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  // Force background colors with inline styles to override CSS reset
  const getInlineStyles = () => {
    const styles = {};
    
    switch (variant) {
      case 'primary':
        styles.backgroundColor = '#2563eb';
        styles.color = 'white';
        break;
      case 'secondary':
        styles.backgroundColor = '#f3f4f6';
        styles.color = '#374151';
        break;
      case 'success':
        styles.backgroundColor = '#16a34a';
        styles.color = 'white';
        break;
      case 'danger':
        styles.backgroundColor = '#dc2626';
        styles.color = 'white';
        break;
      case 'warning':
        styles.backgroundColor = '#ea580c';
        styles.color = 'white';
        break;
      case 'ghost':
        styles.backgroundColor = 'transparent';
        styles.color = '#374151';
        break;
      case 'outline':
        styles.backgroundColor = 'transparent';
        styles.color = '#374151';
        break;
      case 'outline-primary':
        styles.backgroundColor = 'transparent';
        styles.color = '#2563eb';
        break;
      default:
        break;
    }
    
    return styles;
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={getInlineStyles()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin mr-2" />}
      {!loading && Icon && <Icon size={16} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;