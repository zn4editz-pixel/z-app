// ⚡ FRONTEND PERFORMANCE OPTIMIZER
// Utilities for optimizing React performance

import { useCallback, useEffect, useRef, useState } from 'react';

// Debounce hook for expensive operations
export const useDebounce = (value, delay = 500) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
};

// Throttle hook for frequent events
export const useThrottle = (callback, delay = 1000) => {
	const lastRun = useRef(Date.now());

	return useCallback((...args) => {
		const now = Date.now();
		if (now - lastRun.current >= delay) {
			callback(...args);
			lastRun.current = now;
		}
	}, [callback, delay]);
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (options = {}) => {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const targetRef = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			setIsIntersecting(entry.isIntersecting);
		}, options);

		const current = targetRef.current;
		if (current) {
			observer.observe(current);
		}

		return () => {
			if (current) {
				observer.unobserve(current);
			}
		};
	}, [options]);

	return [targetRef, isIntersecting];
};

// Request batching for API calls
class RequestBatcher {
	constructor(batchFn, delay = 50) {
		this.batchFn = batchFn;
		this.delay = delay;
		this.queue = [];
		this.timeout = null;
	}

	add(request) {
		return new Promise((resolve, reject) => {
			this.queue.push({ request, resolve, reject });
			
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			
			this.timeout = setTimeout(() => {
				this.flush();
			}, this.delay);
		});
	}

	async flush() {
		if (this.queue.length === 0) return;
		
		const batch = this.queue.splice(0);
		try {
			const results = await this.batchFn(batch.map(item => item.request));
			batch.forEach((item, index) => {
				item.resolve(results[index]);
			});
		} catch (error) {
			batch.forEach(item => {
				item.reject(error);
			});
		}
	}
}

export const createBatcher = (batchFn, delay) => new RequestBatcher(batchFn, delay);

// Memoization with expiry
export class MemoCache {
	constructor(ttl = 60000) {
		this.cache = new Map();
		this.ttl = ttl;
	}

	get(key) {
		const item = this.cache.get(key);
		if (!item) return null;
		
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}
		
		return item.value;
	}

	set(key, value) {
		this.cache.set(key, {
			value,
			timestamp: Date.now()
		});
	}

	clear() {
		this.cache.clear();
	}

	size() {
		return this.cache.size;
	}
}

// Virtual scrolling helper
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
	const [scrollTop, setScrollTop] = useState(0);
	
	const visibleStart = Math.floor(scrollTop / itemHeight);
	const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
	
	const visibleItems = items.slice(
		Math.max(0, visibleStart - 5), // Buffer
		Math.min(items.length, visibleEnd + 5)
	);
	
	const offsetY = visibleStart * itemHeight;
	
	return {
		visibleItems,
		offsetY,
		totalHeight: items.length * itemHeight,
		onScroll: (e) => setScrollTop(e.target.scrollTop)
	};
};

// Image lazy loading with placeholder
export const useLazyImage = (src, placeholder = '') => {
	const [imageSrc, setImageSrc] = useState(placeholder);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const img = new Image();
		img.src = src;
		
		img.onload = () => {
			setImageSrc(src);
			setIsLoading(false);
		};
		
		img.onerror = () => {
			setIsLoading(false);
		};
	}, [src]);

	return { imageSrc, isLoading };
};

// Prevent unnecessary re-renders
export const useShallowCompare = (value) => {
	const ref = useRef(value);
	
	if (JSON.stringify(ref.current) !== JSON.stringify(value)) {
		ref.current = value;
	}
	
	return ref.current;
};

// Batch state updates
export const useBatchedState = (initialState) => {
	const [state, setState] = useState(initialState);
	const updates = useRef({});
	const timeout = useRef(null);

	const batchedSetState = useCallback((updates) => {
		Object.assign(updates.current, updates);
		
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		
		timeout.current = setTimeout(() => {
			setState(prev => ({ ...prev, ...updates.current }));
			updates.current = {};
		}, 16); // Next frame
	}, []);

	return [state, batchedSetState];
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
	const start = performance.now();
	const result = fn();
	const end = performance.now();
	
	console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
	
	return result;
};

// Async performance monitoring
export const measurePerformanceAsync = async (name, fn) => {
	const start = performance.now();
	const result = await fn();
	const end = performance.now();
	
	console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
	
	return result;
};

export default {
	useDebounce,
	useThrottle,
	useIntersectionObserver,
	createBatcher,
	MemoCache,
	useVirtualScroll,
	useLazyImage,
	useShallowCompare,
	useBatchedState,
	measurePerformance,
	measurePerformanceAsync
};
