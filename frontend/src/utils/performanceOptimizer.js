/**
 * Performance Optimization Utilities
 * Ensures supersonic fast loading even on slow internet
 */

// 1. Debounce function for expensive operations
export const debounce = (func, wait = 300) => {
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

// 2. Throttle function for scroll/resize events
export const throttle = (func, limit = 100) => {
	let inThrottle;
	return function(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
};

// 3. Lazy load images with intersection observer
export const lazyLoadImages = () => {
	const images = document.querySelectorAll('img[data-src]');
	
	const imageObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const img = entry.target;
				img.src = img.dataset.src;
				img.removeAttribute('data-src');
				observer.unobserve(img);
			}
		});
	}, {
		rootMargin: '50px' // Start loading 50px before entering viewport
	});

	images.forEach(img => imageObserver.observe(img));
};

// 4. Preload critical resources
export const preloadCriticalResources = () => {
	const criticalResources = [
		{ href: '/avatar.png', as: 'image' },
		// Add more critical resources here
	];

	criticalResources.forEach(resource => {
		const link = document.createElement('link');
		link.rel = 'preload';
		link.href = resource.href;
		link.as = resource.as;
		document.head.appendChild(link);
	});
};

// 5. Optimize animations - Pause when tab is hidden
export const optimizeAnimations = () => {
	let animationsPaused = false;

	document.addEventListener('visibilitychange', () => {
		if (document.hidden && !animationsPaused) {
			// Pause all CSS animations
			document.body.style.animationPlayState = 'paused';
			animationsPaused = true;
		} else if (!document.hidden && animationsPaused) {
			// Resume animations
			document.body.style.animationPlayState = 'running';
			animationsPaused = false;
		}
	});
};

// 6. Request Idle Callback wrapper for non-critical tasks
export const runWhenIdle = (callback) => {
	if ('requestIdleCallback' in window) {
		requestIdleCallback(callback, { timeout: 2000 });
	} else {
		setTimeout(callback, 1);
	}
};

// 7. Batch DOM updates
export const batchDOMUpdates = (updates) => {
	requestAnimationFrame(() => {
		updates.forEach(update => update());
	});
};

// 8. Optimize scroll performance
export const optimizeScroll = () => {
	let ticking = false;

	const handleScroll = () => {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				// Your scroll handling code here
				ticking = false;
			});
			ticking = true;
		}
	};

	window.addEventListener('scroll', handleScroll, { passive: true });
	return () => window.removeEventListener('scroll', handleScroll);
};

// 9. Reduce motion for users who prefer it
export const respectReducedMotion = () => {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	
	if (prefersReducedMotion) {
		document.documentElement.style.setProperty('--animation-duration', '0.01ms');
		document.documentElement.style.setProperty('--transition-duration', '0.01ms');
	}
};

// 10. Memory cleanup utility
export const cleanupMemory = () => {
	// Clear any cached data that's no longer needed
	if ('caches' in window) {
		caches.keys().then(names => {
			names.forEach(name => {
				if (name.includes('old-') || name.includes('temp-')) {
					caches.delete(name);
				}
			});
		});
	}
};

// 11. Optimize network requests
export const optimizeNetworkRequests = () => {
	// Use HTTP/2 Server Push hints
	const link = document.createElement('link');
	link.rel = 'preconnect';
	link.href = import.meta.env.VITE_API_URL || 'http://localhost:5001';
	document.head.appendChild(link);
};

// 12. Initialize all optimizations
export const initPerformanceOptimizations = () => {
	// Run immediately
	respectReducedMotion();
	optimizeNetworkRequests();
	optimizeAnimations();
	
	// Run when idle
	runWhenIdle(() => {
		lazyLoadImages();
		preloadCriticalResources();
	});
	
	// Cleanup old data periodically
	setInterval(cleanupMemory, 5 * 60 * 1000); // Every 5 minutes
};

// 13. Performance monitoring
export const monitorPerformance = () => {
	if ('performance' in window && 'PerformanceObserver' in window) {
		// Monitor Long Tasks
		try {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.duration > 50) {
						console.warn('Long task detected:', entry.duration, 'ms');
					}
				}
			});
			observer.observe({ entryTypes: ['longtask'] });
		} catch (e) {
			// Long task API not supported
		}

		// Monitor Layout Shifts
		try {
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.hadRecentInput) continue;
					console.log('Layout shift:', entry.value);
				}
			});
			clsObserver.observe({ entryTypes: ['layout-shift'] });
		} catch (e) {
			// Layout shift API not supported
		}
	}
};

export default {
	debounce,
	throttle,
	lazyLoadImages,
	preloadCriticalResources,
	optimizeAnimations,
	runWhenIdle,
	batchDOMUpdates,
	optimizeScroll,
	respectReducedMotion,
	cleanupMemory,
	optimizeNetworkRequests,
	initPerformanceOptimizations,
	monitorPerformance
};
