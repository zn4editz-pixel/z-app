import React, { useState, useEffect } from 'react';
import SimpleWorkingSpinner from './SimpleWorkingSpinner';
import simpleRefreshManager from '../utils/simpleRefreshManager';

/**
 * Refresh Spinner Provider - Global refresh spinner management
 * Integrates with the refresh manager to show/hide spinner automatically
 */
const RefreshSpinnerProvider = ({ children }) => {
  const [spinnerState, setSpinnerState] = useState({
    show: false,
    progress: 0,
    message: 'Loading...'
  });

  useEffect(() => {
    // Subscribe to refresh manager events
    const unsubscribe = simpleRefreshManager.subscribe((event) => {
      switch (event.type) {
        case 'start':
          setSpinnerState({
            show: true,
            progress: event.progress || 0,
            message: event.message || 'Loading...'
          });
          break;
          
        case 'progress':
          setSpinnerState(prev => ({
            ...prev,
            progress: event.progress || prev.progress,
            message: event.message || prev.message
          }));
          break;
          
        case 'complete':
          setSpinnerState(prev => ({
            ...prev,
            progress: 100,
            message: event.message || 'Complete!'
          }));
          break;
          
        case 'hide':
          setSpinnerState({
            show: false,
            progress: 0,
            message: 'Loading...'
          });
          break;
          
        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  const handleSpinnerComplete = () => {
    // Called when spinner animation completes
    setSpinnerState(prev => ({
      ...prev,
      show: false
    }));
  };

  return (
    <>
      {children}
      <SimpleWorkingSpinner
        show={spinnerState.show}
        progress={spinnerState.progress}
        message={spinnerState.message}
        onComplete={handleSpinnerComplete}
      />
    </>
  );
};

export default RefreshSpinnerProvider;