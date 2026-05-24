// 🚀 ADMIN PANEL PERFORMANCE OPTIMIZER
import { useCallback, useMemo, useRef, useState } from 'react';

// Debounce function for API calls
export const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);
    
    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

// Memoized chart data processor
export const useOptimizedChartData = (rawData, type) => {
    return useMemo(() => {
        if (!rawData || !Array.isArray(rawData)) return [];
        
        switch (type) {
            case 'area':
                return rawData.map(item => ({
                    ...item,
                    value: Math.round(item.value || 0)
                }));
            case 'line':
                return rawData.filter((_, index) => index % 2 === 0); // Reduce data points for performance
            case 'pie':
                return rawData.slice(0, 5); // Limit pie chart segments
            default:
                return rawData;
        }
    }, [rawData, type]);
};

// Performance monitoring
export const usePerformanceMonitor = (componentName) => {
    const renderCount = useRef(0);
    const startTime = useRef(Date.now());
    
    renderCount.current += 1;
    
    if (renderCount.current % 10 === 0) {
        const elapsed = Date.now() - startTime.current;
        console.log(`🔍 ${componentName}: ${renderCount.current} renders in ${elapsed}ms`);
    }
};

// Optimized animation frame scheduler
export const useAnimationFrame = (callback, deps = []) => {
    const requestRef = useRef();
    
    const animate = useCallback(() => {
        callback();
        requestRef.current = requestAnimationFrame(animate);
    }, deps);
    
    return {
        start: () => {
            requestRef.current = requestAnimationFrame(animate);
        },
        stop: () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
    };
};

// Memory usage optimizer
export const useMemoryOptimizer = () => {
    const cleanup = useCallback(() => {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear any cached data older than 5 minutes
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('admin_cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && (now - data.timestamp) > fiveMinutes) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    }, []);
    
    return { cleanup };
};

// Optimized data fetcher with caching
export const useOptimizedFetch = (url, options = {}) => {
    const cache = useRef(new Map());
    const { cacheTime = 30000, retryCount = 3 } = options;
    
    return useCallback(async (params = {}) => {
        const cacheKey = `${url}_${JSON.stringify(params)}`;
        const cached = cache.current.get(cacheKey);
        
        // Return cached data if still valid
        if (cached && (Date.now() - cached.timestamp) < cacheTime) {
            return cached.data;
        }
        
        // Fetch new data with retry logic
        let lastError;
        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options,
                    ...params
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Cache the result
                cache.current.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
                
                return data;
            } catch (error) {
                lastError = error;
                if (i < retryCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        
        throw lastError;
    }, [url, cacheTime, retryCount, options]);
};

// Reduce motion for accessibility
export const useReducedMotion = () => {
    return useMemo(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);
};

// Optimized event listeners
export const useOptimizedEventListener = (eventName, handler, element = window) => {
    const savedHandler = useRef();
    
    savedHandler.current = handler;
    
    const eventListener = useCallback((event) => {
        savedHandler.current(event);
    }, []);
    
    return {
        addEventListener: () => {
            element.addEventListener(eventName, eventListener, { passive: true });
        },
        removeEventListener: () => {
            element.removeEventListener(eventName, eventListener);
        }
    };
};

// Performance-optimized state updater
export const useOptimizedState = (initialState) => {
    const [state, setState] = useState(initialState);
    const pendingUpdates = useRef([]);
    const updateTimeout = useRef(null);
    
    const batchedSetState = useCallback((update) => {
        pendingUpdates.current.push(update);
        
        if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
        }
        
        updateTimeout.current = setTimeout(() => {
            setState(prevState => {
                let newState = prevState;
                pendingUpdates.current.forEach(update => {
                    newState = typeof update === 'function' ? update(newState) : update;
                });
                pendingUpdates.current = [];
                return newState;
            });
        }, 16); // ~60fps
    }, []);
    
    return [state, batchedSetState];
};