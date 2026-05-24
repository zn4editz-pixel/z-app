import React, { useEffect, useRef } from 'react';

/**
 * Modern Animated Spinner - Beautiful, smooth, guaranteed to animate
 * Features: Multiple animation layers, theme-responsive, JavaScript fallback
 */
const ModernSpinner = ({ 
  size = 'md', 
  variant = 'default',
  className = '',
  showText = false,
  text = 'Loading...'
}) => {
  const spinnerRef = useRef(null);
  const animationRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    xs: { container: 24, outer: 20, inner: 16, stroke: 2 },
    sm: { container: 32, outer: 28, inner: 22, stroke: 2.5 },
    md: { container: 48, outer: 44, inner: 36, stroke: 3 },
    lg: { container: 64, outer: 60, inner: 48, stroke: 4 },
    xl: { container: 80, outer: 76, inner: 64, stroke: 5 }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // JavaScript animation fallback
  useEffect(() => {
    const element = spinnerRef.current;
    if (!element) return;

    let rotation = 0;
    let pulseScale = 1;
    let pulseDirection = 1;

    const animate = () => {
      rotation += 4; // Smooth rotation
      pulseScale += pulseDirection * 0.02;
      
      if (pulseScale >= 1.1) pulseDirection = -1;
      if (pulseScale <= 0.9) pulseDirection = 1;

      if (rotation >= 360) rotation = 0;

      if (element && element.isConnected) {
        // Apply smooth rotation and subtle pulse
        element.style.transform = `rotate(${rotation}deg) scale(${pulseScale})`;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation after a small delay to ensure CSS has loaded
    const timeout = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-secondary';
      case 'accent':
        return 'text-accent';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      case 'white':
        return 'text-white';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className={`modern-spinner-container ${className}`}>
      {/* Main Spinner */}
      <div 
        className={`modern-spinner ${getVariantClasses()}`}
        style={{ 
          width: config.container, 
          height: config.container 
        }}
      >
        {/* Outer Ring */}
        <div 
          ref={spinnerRef}
          className="modern-spinner-outer"
          style={{
            width: config.outer,
            height: config.outer,
            borderWidth: config.stroke
          }}
        >
          {/* Inner Ring */}
          <div 
            className="modern-spinner-inner"
            style={{
              width: config.inner,
              height: config.inner,
              borderWidth: config.stroke * 0.7
            }}
          />
          
          {/* Center Dot */}
          <div 
            className="modern-spinner-dot"
            style={{
              width: config.stroke * 2,
              height: config.stroke * 2
            }}
          />
        </div>
      </div>

      {/* Loading Text */}
      {showText && (
        <div className="modern-spinner-text">
          {text}
        </div>
      )}
    </div>
  );
};

export default ModernSpinner;