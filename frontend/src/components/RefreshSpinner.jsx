import React, { useEffect, useState, useRef } from 'react';

/**
 * Refresh Spinner - JavaScript-powered, guaranteed rotating spinner
 * Uses JavaScript animations to bypass ALL CSS conflicts
 */
const RefreshSpinner = ({ 
  show = true, 
  progress = 0, 
  message = "Refreshing...",
  onComplete = null 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const outerRingRef = useRef(null);
  const innerRingRef = useRef(null);
  const centerDotRef = useRef(null);
  const dotsRef = useRef([]);

  // JavaScript animation for spinners
  useEffect(() => {
    if (!show) return;

    let outerRotation = 0;
    let innerRotation = 360;
    let pulseScale = 1;
    let pulseDirection = 1;
    let animationId;

    const animate = () => {
      // Outer ring rotation
      outerRotation += 2;
      if (outerRotation >= 360) outerRotation = 0;
      
      // Inner ring counter-rotation
      innerRotation -= 3;
      if (innerRotation <= 0) innerRotation = 360;
      
      // Pulse animation
      pulseScale += pulseDirection * 0.01;
      if (pulseScale >= 1.2) pulseDirection = -1;
      if (pulseScale <= 0.8) pulseDirection = 1;

      // Apply transformations
      if (outerRingRef.current) {
        outerRingRef.current.style.transform = `rotate(${outerRotation}deg)`;
      }
      if (innerRingRef.current) {
        innerRingRef.current.style.transform = `rotate(${innerRotation}deg)`;
      }
      if (centerDotRef.current) {
        centerDotRef.current.style.transform = `translate(-50%, -50%) scale(${pulseScale})`;
      }

      // Animate dots
      dotsRef.current.forEach((dot, index) => {
        if (dot) {
          const bounceOffset = Math.sin((Date.now() / 200) + (index * 0.5)) * 4;
          const scaleOffset = 0.8 + Math.abs(Math.sin((Date.now() / 300) + (index * 0.7))) * 0.4;
          dot.style.transform = `translateY(${bounceOffset}px) scale(${scaleOffset})`;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [show]);

  // Smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const increment = Math.min(5, progress - displayProgress);
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(100, prev + increment));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  // Handle completion
  useEffect(() => {
    if (displayProgress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, onComplete]);

  if (!show) return null;

  // Inline styles to bypass ALL CSS conflicts
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '320px',
    maxWidth: '400px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const spinnerContainerStyle = {
    position: 'relative',
    width: '100px',
    height: '100px'
  };

  const outerRingStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: '6px solid #e5e7eb',
    borderTop: '6px solid #3b82f6',
    borderRight: '6px solid #8b5cf6',
    borderRadius: '50%',
    willChange: 'transform'
  };

  const innerRingStyle = {
    position: 'absolute',
    top: '12px',
    left: '12px',
    width: 'calc(100% - 24px)',
    height: 'calc(100% - 24px)',
    border: '3px solid transparent',
    borderBottom: '3px solid #06b6d4',
    borderLeft: '3px solid #10b981',
    borderRadius: '50%',
    willChange: 'transform'
  };

  const centerDotStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '20px',
    height: '20px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
  };

  const messageStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    margin: 0,
    letterSpacing: '-0.025em'
  };

  const progressStyle = {
    fontSize: '36px',
    fontWeight: '700',
    color: '#3b82f6',
    margin: 0,
    textShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
  };

  const progressBarContainerStyle = {
    width: '100%',
    height: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '5px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const progressBarFillStyle = {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
    borderRadius: '5px',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: `${displayProgress}%`,
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
  };

  const dotsContainerStyle = {
    display: 'flex',
    gap: '8px'
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* JavaScript-Powered Spinning Animation */}
        <div style={spinnerContainerStyle}>
          <div ref={outerRingRef} style={outerRingStyle}></div>
          <div ref={innerRingRef} style={innerRingStyle}></div>
          <div ref={centerDotRef} style={centerDotStyle}></div>
        </div>
        
        {/* Message */}
        <div style={messageStyle}>{message}</div>
        
        {/* Progress */}
        <div style={progressStyle}>{Math.round(displayProgress)}%</div>
        
        {/* Progress Bar */}
        <div style={progressBarContainerStyle}>
          <div style={progressBarFillStyle}></div>
        </div>
        
        {/* JavaScript-Animated Loading Dots */}
        <div style={dotsContainerStyle}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={el => dotsRef.current[i] = el}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                willChange: 'transform'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RefreshSpinner;