/**
 * Simple Refresh Manager - Safe and minimal
 * Only handles manual spinner control, no automatic detection
 */

class SimpleRefreshManager {
  constructor() {
    this.listeners = new Set();
    this.isRefreshing = false;
  }

  // Public API for manual control
  showSpinner(message = 'Loading...') {
    this.isRefreshing = true;
    this.notifyListeners('start', { message, progress: 0 });
  }

  hideSpinner() {
    this.isRefreshing = false;
    this.notifyListeners('complete', { progress: 100, message: 'Complete!' });
    
    setTimeout(() => {
      this.notifyListeners('hide');
    }, 600);
  }

  setProgress(progress, message) {
    if (!this.isRefreshing) return;
    
    this.notifyListeners('progress', { 
      progress: Math.min(100, Math.max(0, progress)), 
      message 
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback({ type, ...data });
      } catch (error) {
        console.error('Refresh manager listener error:', error);
      }
    });
  }

  isCurrentlyRefreshing() {
    return this.isRefreshing;
  }
}

// Create singleton instance
const simpleRefreshManager = new SimpleRefreshManager();

export default simpleRefreshManager;

// Export convenience functions
export const showRefreshSpinner = (message) => simpleRefreshManager.showSpinner(message);
export const hideRefreshSpinner = () => simpleRefreshManager.hideSpinner();
export const setRefreshProgress = (progress, message) => simpleRefreshManager.setProgress(progress, message);
export const subscribeToRefresh = (callback) => simpleRefreshManager.subscribe(callback);