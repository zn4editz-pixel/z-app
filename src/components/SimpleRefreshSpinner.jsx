import { useState, useEffect } from 'react';

const SimpleRefreshSpinner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show spinner on page refresh
    const handleBeforeUnload = () => {
      setShow(true);
    };

    // Hide spinner when page loads
    const handleLoad = () => {
      setShow(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #ff9933',
          borderRadius: '50%',
          animation: 'simple-refresh-spin 1s linear infinite'
        }}
      />
      <style>
        {`
          @keyframes simple-refresh-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SimpleRefreshSpinner;