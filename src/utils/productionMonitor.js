// 📊 Production Performance Monitor
// Real-time performance tracking and optimization

class ProductionMonitor {
	constructor() {
		this.metrics = {
			pageLoads: 0,
			apiCalls: 0,
			errors: 0,
			performance: {
				lcp: 0, // Largest Contentful Paint
				fid: 0, // First Input Delay
				cls: 0, // Cumulative Layout Shift
				ttfb: 0 // Time to First Byte
			},
			memory: {
				used: 0,
				total: 0,
				limit: 0
			},
			network: {
				online: navigator.onLine,
				effectiveType: null,
				downlink: null
			}
		};
		
		this.observers = new Map();
		this.isMonitoring = false;
		
		if (typeof window !== 'undefined') {
			this.init();
		}
	}

	init() {
		if (this.isMonitoring) return;
		this.isMonitoring = true;

		// Track page loads
		this.metrics.pageLoads++;
		
		// Monitor Core Web Vitals
		this.initWebVitals();
		
		// Monitor memory usage
		this.initMemoryMonitor();
		
		// Monitor network status
		this.initNetworkMonitor();
		
		// Monitor API performance
		this.initAPIMonitor();
		
		// Monitor errors
		this.initErrorTracking();
		
		// Report metrics periodically (production only)
		if (import.meta.env.PROD) {
			this.startReporting();
		}
	}

	initWebVitals() {
		// Largest Contentful Paint
		if ('PerformanceObserver' in window) {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				this.metrics.performance.lcp = lastEntry.startTime;
			});
			lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
			this.observers.set('lcp', lcpObserver);

			// First Input Delay
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach(entry => {
					this.metrics.performance.fid = entry.processingStart - entry.startTime;
				});
			});
			fidObserver.observe({ entryTypes: ['first-input'] });
			this.observers.set('fid', fidObserver);

			// Cumulative Layout Shift
			const clsObserver = new PerformanceObserver((list) => {
				let clsValue = 0;
				const entries = list.getEntries();
				entries.forEach(entry => {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				});
				this.metrics.performance.cls = clsValue;
			});
			clsObserver.observe({ entryTypes: ['layout-shift'] });
			this.observers.set('cls', clsObserver);
		}

		// Time to First Byte
		if (performance.timing) {
			this.metrics.performance.ttfb = performance.timing.responseStart - performance.timing.navigationStart;
		}
	}

	initMemoryMonitor() {
		if (performance.memory) {
			const updateMemory = () => {
				this.metrics.memory = {
					used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
					total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
					limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
				};
			};

			updateMemory();
			setInterval(updateMemory, 30000); // Every 30 seconds
		}
	}

	initNetworkMonitor() {
		// Network status
		const updateNetworkStatus = () => {
			this.metrics.network.online = navigator.onLine;
		};

		window.addEventListener('online', updateNetworkStatus);
		window.addEventListener('offline', updateNetworkStatus);

		// Network quality (if supported)
		if ('connection' in navigator) {
			const connection = navigator.connection;
			this.metrics.network.effectiveType = connection.effectiveType;
			this.metrics.network.downlink = connection.downlink;

			connection.addEventListener('change', () => {
				this.metrics.network.effectiveType = connection.effectiveType;
				this.metrics.network.downlink = connection.downlink;
			});
		}
	}

	initAPIMonitor() {
		// Intercept fetch requests
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			const start = performance.now();
			this.metrics.apiCalls++;
			
			try {
				const response = await originalFetch(...args);
				const duration = performance.now() - start;
				
				// Log slow API calls (dev only)
				if (import.meta.env.DEV && duration > 1000) {
					console.warn(`🐌 Slow API call: ${args[0]} took ${duration.toFixed(2)}ms`);
				}
				
				return response;
			} catch (error) {
				this.metrics.errors++;
				throw error;
			}
		};
	}

	initErrorTracking() {
		// Global error handler
		window.addEventListener('error', (event) => {
			this.metrics.errors++;
			
			if (import.meta.env.DEV) {
				console.error('Global error:', event.error);
			}
		});

		// Unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.metrics.errors++;
			
			if (import.meta.env.DEV) {
				console.error('Unhandled promise rejection:', event.reason);
			}
		});
	}

	startReporting() {
		// Report metrics every 5 minutes in production
		setInterval(() => {
			this.reportMetrics();
		}, 5 * 60 * 1000);
	}

	reportMetrics() {
		// In production, you could send these to your analytics service
		const report = {
			...this.metrics,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		// For now, just store in localStorage for debugging
		const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
		reports.push(report);
		
		// Keep only last 10 reports
		if (reports.length > 10) {
			reports.shift();
		}
		
		localStorage.setItem('performanceReports', JSON.stringify(reports));
	}

	getMetrics() {
		return { ...this.metrics };
	}

	getPerformanceScore() {
		const { lcp, fid, cls } = this.metrics.performance;
		
		// Calculate score based on Core Web Vitals thresholds
		let score = 100;
		
		// LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
		if (lcp > 4000) score -= 30;
		else if (lcp > 2500) score -= 15;
		
		// FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
		if (fid > 300) score -= 25;
		else if (fid > 100) score -= 10;
		
		// CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
		if (cls > 0.25) score -= 25;
		else if (cls > 0.1) score -= 10;
		
		// Memory usage penalty
		if (this.metrics.memory.used > 100) score -= 10;
		
		// Error penalty
		if (this.metrics.errors > 5) score -= 10;
		
		return Math.max(0, score);
	}

	getRecommendations() {
		const recommendations = [];
		const { lcp, fid, cls } = this.metrics.performance;
		
		if (lcp > 2500) {
			recommendations.push({
				type: 'performance',
				priority: 'high',
				message: 'Largest Contentful Paint is slow. Consider optimizing images and reducing server response time.'
			});
		}
		
		if (fid > 100) {
			recommendations.push({
				type: 'performance',
				priority: 'medium',
				message: 'First Input Delay is high. Consider reducing JavaScript execution time.'
			});
		}
		
		if (cls > 0.1) {
			recommendations.push({
				type: 'performance',
				priority: 'medium',
				message: 'Cumulative Layout Shift detected. Ensure images and ads have dimensions.'
			});
		}
		
		if (this.metrics.memory.used > 100) {
			recommendations.push({
				type: 'memory',
				priority: 'high',
				message: 'High memory usage detected. Check for memory leaks.'
			});
		}
		
		if (this.metrics.errors > 3) {
			recommendations.push({
				type: 'error',
				priority: 'critical',
				message: 'Multiple errors detected. Check console for details.'
			});
		}
		
		return recommendations;
	}

	cleanup() {
		// Disconnect all observers
		this.observers.forEach(observer => observer.disconnect());
		this.observers.clear();
		this.isMonitoring = false;
	}
}

// Create singleton instance
const monitor = new ProductionMonitor();

// Export utilities
export const getPerformanceMetrics = () => monitor.getMetrics();
export const getPerformanceScore = () => monitor.getPerformanceScore();
export const getRecommendations = () => monitor.getRecommendations();
export const reportMetrics = () => monitor.reportMetrics();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
	const [metrics, setMetrics] = useState(monitor.getMetrics());
	const [score, setScore] = useState(monitor.getPerformanceScore());
	
	useEffect(() => {
		const interval = setInterval(() => {
			setMetrics(monitor.getMetrics());
			setScore(monitor.getPerformanceScore());
		}, 5000);
		
		return () => clearInterval(interval);
	}, []);
	
	return { metrics, score, recommendations: getRecommendations() };
};

export default monitor;