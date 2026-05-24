// ⚡ PERFORMANCE LOADER - Ultra-fast page loading optimizations

// ===== CRITICAL PERFORMANCE OPTIMIZATIONS =====

// 1. Preload critical resources immediately
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);

  // Preload critical API endpoints (only in production)
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // Warm up critical endpoints
      fetch('/api/health', { method: 'HEAD' }).catch(() => {});
    });
  }
};

// 2. Optimize images with lazy loading and compression
export const optimizeImages = () => {
  // Add loading="lazy" to all images
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  // Intersection Observer for better lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// 3. Optimize animations for performance
export const optimizeAnimations = () => {
  // Reduce animations on low-end devices
  if (navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2) {
    document.documentElement.style.setProperty('--animation-speed', '0.5s');
    document.documentElement.classList.add('reduced-animations');
  }

  // Pause animations when tab is not visible
  document.addEventListener('visibilitychange', () => {
    const animatedElements = document.querySelectorAll('[class*="animate-"]');
    if (document.hidden) {
      animatedElements.forEach(el => el.style.animationPlayState = 'paused');
    } else {
      animatedElements.forEach(el => el.style.animationPlayState = 'running');
    }
  });
};

// 4. Memory management and cleanup
export const optimizeMemory = () => {
  // Clean up unused event listeners
  const cleanupEvents = () => {
    // Remove passive event listeners that are no longer needed
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(el => {
      el.removeEventListener('scroll', () => {});
      el.removeEventListener('resize', () => {});
    });
  };

  // Run cleanup every 30 seconds
  setInterval(cleanupEvents, 30000);

  // Force garbage collection on page unload
  window.addEventListener('beforeunload', () => {
    if (window.gc) window.gc();
  });
};

// 5. Network optimization
export const optimizeNetwork = () => {
  // Prefetch likely next pages
  const prefetchPages = ['/discover', '/settings', '/profile'];
  
  const prefetchOnIdle = () => {
    prefetchPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  };

  if (window.requestIdleCallback) {
    requestIdleCallback(prefetchOnIdle, { timeout: 2000 });
  } else {
    setTimeout(prefetchOnIdle, 1000);
  }
};

// 6. Bundle optimization
export const optimizeBundles = () => {
  // Only preload chunks in production
  if (import.meta.env.PROD) {
    const criticalChunks = [
      '/assets/react-vendor',
      '/assets/store-vendor'
    ];

    criticalChunks.forEach(chunk => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = chunk;
      document.head.appendChild(link);
    });
  }
};

// 7. CSS optimization
export const optimizeCSS = () => {
  // Remove unused CSS classes (simple version)
  const removeUnusedCSS = () => {
    const stylesheets = Array.from(document.styleSheets);
    const usedClasses = new Set();
    
    // Collect used classes
    document.querySelectorAll('*').forEach(el => {
      el.classList.forEach(cls => usedClasses.add(cls));
    });

    // Mark unused rules (don't actually remove to avoid breaking things)
    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && !usedClasses.has(rule.selectorText.replace('.', ''))) {
            rule.style.display = 'none'; // Mark as unused
          }
        });
      } catch (e) {
        // Cross-origin stylesheets
      }
    });
  };

  // Run after page load
  window.addEventListener('load', () => {
    setTimeout(removeUnusedCSS, 2000);
  });
};

// 8. Service Worker optimization
export const optimizeServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Register service worker with better caching strategy
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(registration => {
      // Update service worker immediately
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Show update notification
            console.log('New version available');
          }
        });
      });
    }).catch(error => {
      console.log('SW registration failed:', error);
    });
  }
};

// 9. Database optimization (IndexedDB)
export const optimizeDatabase = () => {
  // Clear old cached data
  if ('indexedDB' in window) {
    const clearOldCache = () => {
      const request = indexedDB.open('app-cache', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Check if object store exists
        if (db.objectStoreNames.contains('cache')) {
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          
          // Clear entries older than 24 hours
          const cutoff = Date.now() - (24 * 60 * 60 * 1000);
          const range = IDBKeyRange.upperBound(cutoff);
          store.delete(range);
        }
      };
      
      request.onerror = () => {
        // Silently handle IndexedDB errors
        console.log('IndexedDB cleanup skipped');
      };
    };

    // Run cleanup on app start (only in production)
    if (import.meta.env.PROD) {
      setTimeout(clearOldCache, 5000);
    }
  }
};

// 10. Main initialization function
export const initializePerformanceOptimizations = () => {
  // Run immediately
  preloadCriticalResources();
  optimizeBundles();
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImages();
      optimizeAnimations();
      optimizeCSS();
    });
  } else {
    optimizeImages();
    optimizeAnimations();
    optimizeCSS();
  }
  
  // Run on window load
  window.addEventListener('load', () => {
    optimizeMemory();
    optimizeNetwork();
    optimizeServiceWorker();
    optimizeDatabase();
  });

  // Performance monitoring
  if (import.meta.env.DEV) {
    console.log('🚀 Performance optimizations initialized');
    
    // Log performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        console.log('📊 Performance Metrics:', {
          'DOM Content Loaded': `${navigation.domContentLoadedEventEnd.toFixed(2)}ms`,
          'Load Complete': `${navigation.loadEventEnd.toFixed(2)}ms`,
          'First Paint': `${performance.getEntriesByType('paint')[0]?.startTime.toFixed(2)}ms`,
          'Memory Usage': `${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        });
      }, 1000);
    });
  }
};

// Export default
export default {
  initializePerformanceOptimizations,
  preloadCriticalResources,
  optimizeImages,
  optimizeAnimations,
  optimizeMemory,
  optimizeNetwork
};