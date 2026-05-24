import React from 'react';

/**
 * Isolated Spinner - Completely self-contained with inline styles
 * This bypasses all CSS conflicts and guarantees animation
 */
const IsolatedSpinner = ({ 
  show = true, 
  progress = 0, 
  message = "Loading...",
  onComplete = null 
}) => {
  if (!show) return null;

  // Inline styles to bypass all CSS conflicts
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '300px',
    maxWidth: '400px'
  };

  const spinnerStyle = {
    width: '80px',
    height: '80px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'isolated-spin 1s linear infinite',
    willChange: 'transform'
  };

  const messageStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    margin: 0
  };

  const progressStyle = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6',
    margin: 0
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
    width: `${progress}%`
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Spinning Circle */}
        <div style={spinnerStyle}></div>
        
        {/* Message */}
        <div style={messageStyle}>{message}</div>
        
        {/* Progress */}
        <div style={progressStyle}>{Math.round(progress)}%</div>
        
        {/* Progress Bar */}
        <div style={progressBarStyle}>
          <div style={progressFillStyle}></div>
        </div>
        
        {/* Loading Dots */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                animation: `isolated-pulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Inline CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes isolated-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes isolated-pulse {
            0%, 80%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% { 
              transform: scale(1.2);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};

export default IsolatedSpinner;