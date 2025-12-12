import { useState, useEffect } from 'react';

const PageRefreshSpinner = () => {
  const [isVisible, setIsVisible] = useState(false); // Start hidden

  useEffect(() => {
    // Only show spinner if page is actually loading/refreshing
    const isPageLoading = document.readyState === 'loading';
    
    if (isPageLoading) {
      setIsVisible(true);
      // Hide after page loads
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }

    // Show spinner only on actual page refresh
    const handleBeforeUnload = () => {
      setIsVisible(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Don't show spinner if page is already loaded and user is just using the app
  if (!isVisible || document.readyState === 'complete') return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 153, 51, 0.2)',
        borderTop: '3px solid #ff9933',
        borderRadius: '50%',
        animation: 'refresh-spin 1s linear infinite',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}></div>
      
      <style>{`
        @keyframes refresh-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PageRefreshSpinner;