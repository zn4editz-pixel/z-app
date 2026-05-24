// 🚀 PRODUCTION OPTIMIZER - Complete Performance System
class ProductionOptimizer {
    constructor() {
        this.isProduction = import.meta.env.PROD;
        this.performanceMetrics = {
            loadTime: 0,
            renderTime: 0,
            apiCalls: 0,
            errors: 0
        };
        
        if (this.isProduction) {
            this.initializeOptimizations();
        }
    }

    // 🎯 Initialize all production optimizations
    initializeOptimizations() {
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupCaching();
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupBundleOptimization();
    }

    // 📊 Performance Monitoring
    setupPerformanceMonitoring() {
        // Track page load performance
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.performanceMetrics.loadTime = loadTime;
            
            // Send to analytics if needed
            if (loadTime > 3000) {
                console.warn('⚠️ Slow page load detected:', loadTime + 'ms');
            }
        });

        // Track render performance
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    this.performanceMetrics.renderTime = entry.duration;
                }
            }
        });
        observer.observe({ entryTypes: ['measure'] });
    }

    // 🛡️ Error Tracking
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.performanceMetrics.errors++;
            this.logError('JavaScript Error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.performanceMetrics.errors++;
            this.logError('Promise Rejection', event.reason);
        });
    }

    // 💾 Advanced Caching System
    setupCaching() {
        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        }

        // Memory Cache for API responses
        this.apiCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // 🔄 Lazy Loading System
    setupLazyLoading() {
        // Intersection Observer for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // 🖼️ Image Optimization
    setupImageOptimization() {
        // WebP support detection
        this.supportsWebP = this.checkWebPSupport();
        
        // Automatic image format selection
        this.optimizeImages();
    }

    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.supportsWebP && img.src && !img.src.includes('.webp')) {
                // Convert to WebP if supported
                const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                img.src = webpSrc;
            }
        });
    }

    // 📦 Bundle Optimization
    setupBundleOptimization() {
        // Code splitting detection
        this.trackBundleSize();
        
        // Preload critical resources
        this.preloadCriticalResources();
    }

    trackBundleSize() {
        if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            const jsSize = resources
                .filter(r => r.name.includes('.js'))
                .reduce((total, r) => total + (r.transferSize || 0), 0);
            
            console.log('📦 JavaScript bundle size:', (jsSize / 1024).toFixed(2) + 'KB');
        }
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/api/auth/me',
            '/api/friends',
            '/fonts/main.woff2'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.includes('/api/') ? 'fetch' : 'font';
            if (link.as === 'font') link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // 🔄 API Optimization
    optimizeApiCall(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.apiCache.has(cacheKey)) {
            const cached = this.apiCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return Promise.resolve(cached.data);
            }
        }

        // Make API call with optimization
        return fetch(url, {
            ...options,
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'max-age=300',
                ...options.headers
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Cache successful responses
            this.apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        })
        .catch(error => {
            this.logError('API Error', error);
            throw error;
        });
    }

    // 📝 Error Logging
    logError(type, error) {
        const errorData = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Log to console in development
        if (!this.isProduction) {
            console.error('🚨 Error logged:', errorData);
        }

        // Send to error tracking service in production
        if (this.isProduction) {
            this.sendErrorToService(errorData);
        }
    }

    sendErrorToService(errorData) {
        // Send to your error tracking service
        fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData)
        }).catch(() => {
            // Silently fail if error service is down
        });
    }

    // 📊 Get Performance Report
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.apiCache.size,
            timestamp: new Date().toISOString()
        };
    }

    // 🧹 Cleanup
    cleanup() {
        this.apiCache.clear();
    }
}

// 🚀 Initialize Production Optimizer
const productionOptimizer = new ProductionOptimizer();

// Export for use in components
export default productionOptimizer;

// Global access for debugging
if (typeof window !== 'undefined') {
    window.productionOptimizer = productionOptimizer;
}