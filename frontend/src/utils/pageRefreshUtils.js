/**
 * Page Refresh Utilities
 * Helper functions for managing page refresh states
 */

// Trigger a smooth page refresh with loading animation
export const triggerPageRefresh = () => {
  // Add a small delay to show the loading animation
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

// Trigger navigation with loading state
export const triggerNavigation = (path) => {
  // This will be handled by React Router and our usePageRefresh hook
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Force show loading spinner for testing
export const showLoadingSpinner = (duration = 2000) => {
  // Dispatch a custom event that our spinner can listen to
  window.dispatchEvent(new CustomEvent('forceShowSpinner', { 
    detail: { duration } 
  }));
};

// Keyboard shortcut for refresh (Ctrl+R or Cmd+R)
export const setupRefreshShortcut = () => {
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      triggerPageRefresh();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

export default {
  triggerPageRefresh,
  triggerNavigation,
  showLoadingSpinner,
  setupRefreshShortcut
};