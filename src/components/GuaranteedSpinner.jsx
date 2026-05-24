import React from 'react';

/**
 * Guaranteed Loading Spinner - Always animates, never gets stuck
 * 
 * @param {Object} props
 * @param {string} props.size - Size: 'xs', 'sm', 'md', 'lg', 'xl' or custom size
 * @param {string} props.color - Color: 'primary', 'secondary', 'accent', 'white', etc.
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.center - Whether to center the spinner
 */
const GuaranteedSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  style = {},
  center = false 
}) => {
  // Size mappings
  const sizeMap = {
    xs: { width: '16px', height: '16px', borderWidth: '2px' },
    sm: { width: '20px', height: '20px', borderWidth: '2px' },
    md: { width: '32px', height: '32px', borderWidth: '3px' },
    lg: { width: '48px', height: '48px', borderWidth: '4px' },
    xl: { width: '64px', height: '64px', borderWidth: '5px' }
  };

  // Color mappings
  const colorMap = {
    primary: 'hsl(var(--p))',
    secondary: 'hsl(var(--s))',
    accent: 'hsl(var(--a))',
    success: 'hsl(var(--su))',
    warning: 'hsl(var(--wa))',
    error: 'hsl(var(--er))',
    white: 'white',
    black: 'black'
  };

  const sizeStyle = sizeMap[size] || sizeMap.md;
  const borderTopColor = colorMap[color] || colorMap.primary;

  const spinnerStyle = {
    ...sizeStyle,
    borderTopColor,
    ...style
  };

  const containerClass = center ? 'loading-spinner-container flex justify-center items-center' : 'loading-spinner-container';

  return (
    <div className={`${containerClass} ${className}`}>
      <div 
        className="loading-spinner-ring" 
        style={spinnerStyle}
      />
    </div>
  );
};

export default GuaranteedSpinner;