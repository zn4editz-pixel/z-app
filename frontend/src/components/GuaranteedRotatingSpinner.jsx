import React from 'react';

/**
 * Guaranteed Rotating Spinner - Uses CSS transforms and will-change
 * This is the most basic spinner possible that MUST work
 */
const GuaranteedRotatingSpinner = ({ 
  show = true, 
  progress = 0, 
  message = "Loading...",
  size = 80 
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          minWidth: '280px'
        }}
      >
        {/* Pure CSS Spinner */}
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            margin: '0 auto 20px auto',
            willChange: 'transform',
            transformOrigin: 'center',
            animation: 'guaranteed-rotate 1s linear infinite'
          }}
        />
        
        {/* Message */}
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#333',
          marginBottom: '10px'
        }}>
          {message}
        </div>
        
        {/* Progress */}
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#3498db' 
        }}>
          {Math.round(progress)}%
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#f0f0f0',
          borderRadius: '3px',
          marginTop: '15px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3498db',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      {/* Inline CSS with highest specificity */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes guaranteed-rotate {
            0% { 
              transform: rotate(0deg) !important; 
              -webkit-transform: rotate(0deg) !important;
              -moz-transform: rotate(0deg) !important;
              -ms-transform: rotate(0deg) !important;
            }
            25% { 
              transform: rotate(90deg) !important; 
              -webkit-transform: rotate(90deg) !important;
              -moz-transform: rotate(90deg) !important;
              -ms-transform: rotate(90deg) !important;
            }
            50% { 
              transform: rotate(180deg) !important; 
              -webkit-transform: rotate(180deg) !important;
              -moz-transform: rotate(180deg) !important;
              -ms-transform: rotate(180deg) !important;
            }
            75% { 
              transform: rotate(270deg) !important; 
              -webkit-transform: rotate(270deg) !important;
              -moz-transform: rotate(270deg) !important;
              -ms-transform: rotate(270deg) !important;
            }
            100% { 
              transform: rotate(360deg) !important; 
              -webkit-transform: rotate(360deg) !important;
              -moz-transform: rotate(360deg) !important;
              -ms-transform: rotate(360deg) !important;
            }
          }
          
          /* Force animation to run regardless of any CSS conflicts */
          [style*="guaranteed-rotate"] {
            animation-play-state: running !important;
            animation-duration: 1s !important;
            animation-timing-function: linear !important;
            animation-iteration-count: infinite !important;
            animation-name: guaranteed-rotate !important;
            animation-fill-mode: none !important;
            animation-delay: 0s !important;
            animation-direction: normal !important;
          }
        `
      }} />
    </div>
  );
};

export default GuaranteedRotatingSpinner;