/**
 * Refresh Spinner Utilities
 * Simple functions to control the refresh spinner manually
 */

import { showRefreshSpinner, hideRefreshSpinner, setRefreshProgress } from './simpleRefreshManager';

/**
 * Show a loading spinner with automatic progress simulation
 * @param {string} message - Loading message
 * @param {number} duration - Duration in milliseconds (default: 2000)
 */
export const showLoadingSpinner = (message = 'Loading...', duration = 2000) => {
  showRefreshSpinner(message);
  
  // Simulate progress
  const steps = 10;
  const stepDuration = duration / steps;
  
  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      const progress = (i / steps) * 90; // Stop at 90%
      setRefreshProgress(progress, message);
      
      // Complete on last step
      if (i === steps) {
        setTimeout(() => hideRefreshSpinner(), 200);
      }
    }, stepDuration * i);
  }
};

/**
 * Show spinner for async operations
 * @param {Promise} promise - Promise to wait for
 * @param {string} message - Loading message
 */
export const showSpinnerForPromise = async (promise, message = 'Loading...') => {
  showRefreshSpinner(message);
  
  try {
    const result = await promise;
    hideRefreshSpinner();
    return result;
  } catch (error) {
    hideRefreshSpinner();
    throw error;
  }
};

/**
 * Show spinner for form submissions
 * @param {string} message - Loading message (default: 'Saving...')
 */
export const showSaveSpinner = (message = 'Saving...') => {
  showLoadingSpinner(message, 1500);
};

/**
 * Show spinner for uploads
 * @param {string} message - Loading message (default: 'Uploading...')
 */
export const showUploadSpinner = (message = 'Uploading...') => {
  showLoadingSpinner(message, 3000);
};

/**
 * Show spinner for API calls
 * @param {string} message - Loading message (default: 'Processing...')
 */
export const showApiSpinner = (message = 'Processing...') => {
  showLoadingSpinner(message, 2000);
};

// Export the core functions for direct use
export { showRefreshSpinner, hideRefreshSpinner, setRefreshProgress };