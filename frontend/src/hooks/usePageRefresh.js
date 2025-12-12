import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to detect page refresh and navigation loading states
 */
export const usePageRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(true); // Start as true to show spinner on initial load
  const [isNavigating, setIsNavigating] = useState(false);
  const [isForceShowing, setIsForceShowing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Always show spinner on initial mount (page refresh/load)
    setIsRefreshing(true);
    
    // Hide after a short delay to ensure smooth loading
    const initialTimer = setTimeout(() => {
      setIsRefreshing(false);
    }, 800);

    // Handle page load completion
    const handleLoad = () => {
      setTimeout(() => {
        setIsRefreshing(false);
        setIsNavigating(false);
      }, 500);
    };

    // Handle before page unload (refresh/navigation)
    const handleBeforeUnload = () => {
      setIsRefreshing(true);
    };

    // Handle page show (back/forward navigation)
    const handlePageShow = () => {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    };

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, might be returning from another tab
        setTimeout(() => {
          setIsRefreshing(false);
          setIsNavigating(false);
          setIsForceShowing(false);
        }, 100);
      }
    };

    // Handle custom force show spinner event
    const handleForceShowSpinner = (event) => {
      setIsForceShowing(true);
      const duration = event.detail?.duration || 2000;
      
      setTimeout(() => {
        setIsForceShowing(false);
      }, duration);
    };

    // Add event listeners
    window.addEventListener('load', handleLoad);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('forceShowSpinner', handleForceShowSpinner);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('forceShowSpinner', handleForceShowSpinner);
    };
  }, []);

  // Handle route changes (navigation)
  useEffect(() => {
    setIsNavigating(true);
    
    // Hide navigation spinner after route change
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return {
    isRefreshing,
    isNavigating,
    isForceShowing,
    isLoading: isRefreshing || isNavigating || isForceShowing
  };
};