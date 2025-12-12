import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage refresh spinner state and progress
 * Provides smooth progress tracking and automatic completion
 */
export const useRefreshSpinner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Loading...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Start refresh with custom message
  const startRefresh = useCallback((customMessage = 'Refreshing...') => {
    setMessage(customMessage);
    setProgress(0);
    setIsVisible(true);
    setIsRefreshing(true);
    
    // Simulate initial progress
    setTimeout(() => setProgress(10), 100);
  }, []);

  // Update progress manually
  const updateProgress = useCallback((newProgress, newMessage) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  }, []);

  // Complete refresh
  const completeRefresh = useCallback(() => {
    setProgress(100);
    setMessage('Complete!');
    
    setTimeout(() => {
      setIsVisible(false);
      setIsRefreshing(false);
      setProgress(0);
      setMessage('Loading...');
    }, 800);
  }, []);

  // Auto-progress simulation for page refreshes
  useEffect(() => {
    if (!isRefreshing || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until manual completion
        
        // Simulate realistic loading progress
        const increment = Math.random() * 15 + 5;
        return Math.min(90, prev + increment);
      });
    }, 200 + Math.random() * 300); // Variable timing for realism

    return () => clearInterval(interval);
  }, [isRefreshing, progress]);

  // Listen for page refresh events
  useEffect(() => {
    const handleBeforeUnload = () => {
      startRefresh('Refreshing page...');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRefreshing) {
        // Page became visible again, complete the refresh
        setTimeout(() => completeRefresh(), 500);
      }
    };

    // Listen for manual refresh (Ctrl+R, F5, etc.)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        startRefresh('Refreshing page...');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [startRefresh, completeRefresh, isRefreshing]);

  return {
    isVisible,
    progress,
    message,
    isRefreshing,
    startRefresh,
    updateProgress,
    completeRefresh,
    // Convenience methods
    startLoading: (msg) => startRefresh(msg || 'Loading...'),
    startSaving: () => startRefresh('Saving...'),
    startUploading: () => startRefresh('Uploading...'),
    startConnecting: () => startRefresh('Connecting...'),
  };
};