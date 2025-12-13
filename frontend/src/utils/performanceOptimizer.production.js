// 🚀 PRODUCTION PERFORMANCE OPTIMIZER
import { useEffect, useCallback, useMemo } from 'react';

// 1. Memory Management
export const useMemoryOptimizer = () => {
  useEffect(() => {
    // Clear unused cache every 5 minutes
    const interval = setInterval(() => {
      // Clear old localStorage entries
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.expires && item.expires < now) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });

      // Clear old sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      });
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
};

// 2. Image Optimization
export const useImageOptimizer = () => {
  const optimizeImage = useCallback((file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return { optimizeImage };
};

// 3. Network Optimization
export const useNetworkOptimizer = () => {
  const batchRequests = useCallback((requests, batchSize = 5) => {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    return batches.reduce(async (prev, batch) => {
      await prev;
      return Promise.all(batch);
    }, Promise.resolve());
  }, []);

  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  return { batchRequests, debounce };
};

// 4. Component Performance
export const useMemoizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

export const useMemoizedValue = (factory, deps) => {
  return useMemo(factory, deps);
};

// 5. Bundle Size Optimization
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(() => 
    importFunc().then(module => ({
      default: module.default || module
    }))
  );
};

// 6. Performance Monitoring
export const usePerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const loadTime = entry.loadEventEnd - entry.loadEventStart;
            if (loadTime > 3000) {
              console.warn('⚠️ Slow page load detected:', loadTime + 'ms');
            }
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'measure'] });

      return () => observer.disconnect();
    }
  }, []);
};

// 7. Database Query Optimization
export const optimizeQuery = (query, cacheKey, ttl = 300000) => {
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, expires } = JSON.parse(cached);
      if (expires > Date.now()) {
        return Promise.resolve(data);
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  return query().then(data => {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data,
      expires: Date.now() + ttl
    }));
    return data;
  });
};

// 8. Socket Optimization
export const useSocketOptimizer = (socket) => {
  useEffect(() => {
    if (!socket) return;

    // Batch socket emissions
    const emissionQueue = [];
    let emissionTimeout;

    const batchEmit = (event, data) => {
      emissionQueue.push({ event, data });
      
      clearTimeout(emissionTimeout);
      emissionTimeout = setTimeout(() => {
        if (emissionQueue.length > 0) {
          socket.emit('batch', emissionQueue);
          emissionQueue.length = 0;
        }
      }, 50); // 50ms batch window
    };

    return () => {
      clearTimeout(emissionTimeout);
    };
  }, [socket]);
};

// 9. Production Error Handling
export const useProductionErrorHandler = () => {
  useEffect(() => {
    const handleError = (error) => {
      // Only log critical errors in production
      if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);
};

// 10. Complete Performance Hook
export const useProductionOptimizations = () => {
  useMemoryOptimizer();
  usePerformanceMonitor();
  useProductionErrorHandler();
};