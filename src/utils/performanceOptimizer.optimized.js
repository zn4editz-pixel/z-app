// ⚡ Performance Optimizer - Production Optimized Version
// Utilities for optimizing React performance

import { useCallback, useEffect, useRef, useState } from 'react';

// Debounce hook for expensive operations
export const useDebounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

// Throttle hook for frequent events
export const useThrottle = (value, limit) => {
	const [throttledValue, setThrottledValue] = useState(value);
	const lastRan = useRef(Date.now());

	useEffect(() => {
		const handler = setTimeout(() => {
			if (Date.now() - lastRan.current >= limit) {
				setThrottledValue(value);
				lastRan.current = Date.now();
			}
		}, limit - (Date.now() - lastRan.current));

		return () => {
			clearTimeout(handler);
		};
	}, [value, limit]);

	return throttledValue;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const targetRef = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			setIsIntersecting(entry.isIntersecting);
		}, options);

		const currentTarget = targetRef.current;
		if (currentTarget) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [options]);

	return [targetRef, isIntersecting];
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
	const [scrollTop, setScrollTop] = useState(0);
	
	const startIndex = Math.floor(scrollTop / itemHeight);
	const endIndex = Math.min(
		startIndex + Math.ceil(containerHeight / itemHeight) + 1,
		items.length
	);
	
	const visibleItems = items.slice(startIndex, endIndex);
	const totalHeight = items.length * itemHeight;
	const offsetY = startIndex * itemHeight;

	return {
		visibleItems,
		totalHeight,
		offsetY,
		onScroll: (e) => setScrollTop(e.target.scrollTop)
	};
};

// Memoized component wrapper
export const withMemo = (Component, areEqual) => {
	return React.memo(Component, areEqual);
};

// Performance monitoring utility (dev only)
export const measurePerformance = (name, fn) => {
	if (!import.meta.env.DEV) return fn();
	
	const start = performance.now();
	const result = fn();
	const end = performance.now();
	
	console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
	
	return result;
};

// Async performance monitoring (dev only)
export const measurePerformanceAsync = async (name, fn) => {
	if (!import.meta.env.DEV) return await fn();
	
	const start = performance.now();
	const result = await fn();
	const end = performance.now();
	
	console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
	
	return result;
};

// Image lazy loading with intersection observer
export const useLazyImage = (src, placeholder = '') => {
	const [imageSrc, setImageSrc] = useState(placeholder);
	const [imageRef, isIntersecting] = useIntersectionObserver({
		threshold: 0.1,
		rootMargin: '50px'
	});

	useEffect(() => {
		if (isIntersecting && src) {
			const img = new Image();
			img.onload = () => setImageSrc(src);
			img.src = src;
		}
	}, [isIntersecting, src]);

	return [imageRef, imageSrc];
};

// Optimized event handler
export const useOptimizedCallback = (callback, deps, delay = 0) => {
	const timeoutRef = useRef(null);
	
	return useCallback((...args) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		
		timeoutRef.current = setTimeout(() => {
			callback(...args);
		}, delay);
	}, deps);
};

// Memory usage monitor (dev only)
export const useMemoryMonitor = () => {
	const [memoryInfo, setMemoryInfo] = useState(null);

	useEffect(() => {
		if (!import.meta.env.DEV || !performance.memory) return;

		const interval = setInterval(() => {
			setMemoryInfo({
				used: Math.round(performance.memory.usedJSHeapSize / 1048576),
				total: Math.round(performance.memory.totalJSHeapSize / 1048576),
				limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
			});
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	return memoryInfo;
};

// Bundle size analyzer (dev only)
export const analyzeBundleSize = () => {
	if (!import.meta.env.DEV) return;
	
	const scripts = Array.from(document.querySelectorAll('script[src]'));
	const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
	
	console.group('📦 Bundle Analysis');
	console.log('Scripts:', scripts.length);
	console.log('Stylesheets:', styles.length);
	console.groupEnd();
};

// Performance observer for Core Web Vitals
export const useWebVitals = () => {
	const [vitals, setVitals] = useState({});

	useEffect(() => {
		if (!import.meta.env.DEV) return;

		// Largest Contentful Paint
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1];
			setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
		});

		observer.observe({ entryTypes: ['largest-contentful-paint'] });

		// First Input Delay
		const fidObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			entries.forEach(entry => {
				setVitals(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
			});
		});

		fidObserver.observe({ entryTypes: ['first-input'] });

		return () => {
			observer.disconnect();
			fidObserver.disconnect();
		};
	}, []);

	return vitals;
};

export default {
	useDebounce,
	useThrottle,
	useIntersectionObserver,
	useVirtualScroll,
	withMemo,
	measurePerformance,
	measurePerformanceAsync,
	useLazyImage,
	useOptimizedCallback,
	useMemoryMonitor,
	analyzeBundleSize,
	useWebVitals
};