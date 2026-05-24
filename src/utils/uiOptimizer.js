/**
 * UI Optimization Utilities
 * Professional-grade performance and UX enhancements
 */

// ===== PERFORMANCE OPTIMIZATIONS =====

/**
 * Debounce function for search inputs and resize events
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoader = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

/**
 * Virtual scrolling for large lists
 */
export class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.scrollTop = 0;
    this.containerHeight = container.clientHeight;
    
    this.init();
  }
  
  init() {
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  handleScroll = throttle(() => {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }, 16);
  
  handleResize = debounce(() => {
    this.containerHeight = this.container.clientHeight;
    this.render();
  }, 100);
  
  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
      this.items.length
    );
    
    // Render visible items
    this.renderVisibleItems(startIndex, endIndex);
  }
}

// ===== UI ENHANCEMENTS =====

/**
 * Smooth scroll to element
 */
export const smoothScrollTo = (element, options = {}) => {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * Copy to clipboard with feedback
 */
export const copyToClipboard = async (text, showToast = true) => {
  try {
    await navigator.clipboard.writeText(text);
    if (showToast && window.toast) {
      window.toast.success('Copied to clipboard!');
    }
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    if (showToast && window.toast) {
      window.toast.error('Failed to copy');
    }
    return false;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format time ago
 */
export const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
};

// ===== ACCESSIBILITY HELPERS =====

/**
 * Focus trap for modals
 */
export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }
  
  getFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return this.element.querySelectorAll(selectors.join(', '));
  }
  
  activate() {
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.firstFocusable?.focus();
  }
  
  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }
  
  handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    }
    
    if (e.key === 'Escape') {
      this.deactivate();
    }
  };
}

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

// ===== ANIMATION HELPERS =====

/**
 * CSS Animation promise wrapper
 */
export const animateElement = (element, animationName, duration = 300) => {
  return new Promise((resolve) => {
    element.style.animationDuration = `${duration}ms`;
    element.classList.add(animationName);
    
    const handleAnimationEnd = () => {
      element.classList.remove(animationName);
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
  });
};

/**
 * Stagger animations for lists
 */
export const staggerAnimation = (elements, animationClass, delay = 100) => {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(animationClass);
    }, index * delay);
  });
};

// ===== RESPONSIVE HELPERS =====

/**
 * Media query matcher
 */
export const createMediaQuery = (query) => {
  const mediaQuery = window.matchMedia(query);
  
  return {
    matches: mediaQuery.matches,
    addListener: (callback) => mediaQuery.addListener(callback),
    removeListener: (callback) => mediaQuery.removeListener(callback)
  };
};

/**
 * Viewport size detector
 */
export const getViewportSize = () => ({
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
});

/**
 * Device type detector
 */
export const getDeviceType = () => {
  const width = getViewportSize().width;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// ===== PERFORMANCE MONITORING =====

/**
 * Performance observer for monitoring
 */
export const createPerformanceObserver = (callback) => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver(callback);
    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    return observer;
  }
  return null;
};

/**
 * Memory usage monitor
 */
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
    };
  }
  return null;
};

// ===== ERROR HANDLING =====

/**
 * Global error handler
 */
export const setupErrorHandling = () => {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error reporting service
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to error reporting service
  });
};

// ===== INITIALIZATION =====

/**
 * Initialize all UI optimizations
 */
export const initializeUIOptimizations = () => {
  // Setup error handling
  setupErrorHandling();
  
  // Add performance classes to body
  document.body.classList.add('optimize-text', 'dark-mode-fix');
  
  // Setup viewport meta tag if missing
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    document.head.appendChild(viewport);
  }
  
  // Setup color scheme
  const colorScheme = document.createElement('meta');
  colorScheme.name = 'color-scheme';
  colorScheme.content = 'light dark';
  document.head.appendChild(colorScheme);
  
  console.log('🚀 UI optimizations initialized');
};

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeUIOptimizations);
}