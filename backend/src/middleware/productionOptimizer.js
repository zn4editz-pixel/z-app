// 🚀 BACKEND PRODUCTION OPTIMIZER
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';

class BackendOptimizer {
    constructor() {
        this.cache = new NodeCache({ 
            stdTTL: 600, // 10 minutes default
            checkperiod: 120 // Check for expired keys every 2 minutes
        });
        
        this.performanceMetrics = {
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    // 🛡️ Security Middleware
    getSecurityMiddleware() {
        return [
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        fontSrc: ["'self'", "https://fonts.gstatic.com"],
                        imgSrc: ["'self'", "data:", "https:", "blob:"],
                        scriptSrc: ["'self'"],
                        connectSrc: ["'self'", "wss:", "ws:"],
                    },
                },
                crossOriginEmbedderPolicy: false
            }),
            
            // Rate limiting
            rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // Limit each IP to 100 requests per windowMs
                message: {
                    error: 'Too many requests from this IP, please try again later.'
                },
                standardHeaders: true,
                legacyHeaders: false,
            })
        ];
    }

    // 📦 Compression Middleware
    getCompressionMiddleware() {
        return compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            level: 6, // Compression level (1-9)
            threshold: 1024 // Only compress responses > 1KB
        });
    }

    // 📊 Performance Monitoring Middleware
    getPerformanceMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            // Track request
            this.performanceMetrics.requests++;
            
            // Override res.json to track response time
            const originalJson = res.json;
            res.json = function(data) {
                const responseTime = Date.now() - startTime;
                
                // Update average response time
                const totalRequests = this.performanceMetrics.requests;
                this.performanceMetrics.avgResponseTime = 
                    ((this.performanceMetrics.avgResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
                
                // Log slow requests
                if (responseTime > 1000) {
                    console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
                }
                
                return originalJson.call(this, data);
            }.bind(this);
            
            next();
        };
    }

    // 💾 Caching Middleware
    getCacheMiddleware(ttl = 300) { // 5 minutes default
        return (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }
            
            const key = `cache_${req.originalUrl}`;
            const cached = this.cache.get(key);
            
            if (cached) {
                this.performanceMetrics.cacheHits++;
                console.log(`✅ Cache hit: ${req.originalUrl}`);
                return res.json(cached);
            }
            
            this.performanceMetrics.cacheMisses++;
            
            // Override res.json to cache the response
            const originalJson = res.json;
            res.json = function(data) {
                // Cache successful responses
                if (res.statusCode === 200) {
                    this.cache.set(key, data, ttl);
                    console.log(`💾 Cached: ${req.originalUrl}`);
                }
                return originalJson.call(this, data);
            }.bind(this);
            
            next();
        };
    }

    // 🔄 Database Query Optimizer
    optimizeQuery(query, params = []) {
        const queryKey = `query_${Buffer.from(query).toString('base64')}`;
        const cached = this.cache.get(queryKey);
        
        if (cached) {
            this.performanceMetrics.cacheHits++;
            return Promise.resolve(cached);
        }
        
        this.performanceMetrics.cacheMisses++;
        
        // Execute query and cache result
        return new Promise((resolve, reject) => {
            // This would be your actual database query execution
            // For now, we'll just return a placeholder
            const result = { cached: false, query, params };
            this.cache.set(queryKey, result, 300); // Cache for 5 minutes
            resolve(result);
        });
    }

    // 🚨 Error Handling Middleware
    getErrorMiddleware() {
        return (error, req, res, next) => {
            this.performanceMetrics.errors++;
            
            console.error('🚨 Server Error:', {
                message: error.message,
                stack: error.stack,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            
            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            res.status(error.status || 500).json({
                error: true,
                message: isDevelopment ? error.message : 'Internal server error',
                ...(isDevelopment && { stack: error.stack })
            });
        };
    }

    // 📊 Health Check Endpoint
    getHealthCheck() {
        return (req, res) => {
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: `${Math.floor(uptime / 60)} minutes`,
                memory: {
                    used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                    total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
                },
                performance: this.performanceMetrics,
                cache: {
                    keys: this.cache.keys().length,
                    stats: this.cache.getStats()
                }
            });
        };
    }

    // 🧹 Cache Management
    clearCache(pattern = null) {
        if (pattern) {
            const keys = this.cache.keys().filter(key => key.includes(pattern));
            this.cache.del(keys);
            return keys.length;
        } else {
            this.cache.flushAll();
            return 'all';
        }
    }

    // 📈 Performance Report
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            cacheStats: this.cache.getStats(),
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
}

// Create singleton instance
const backendOptimizer = new BackendOptimizer();

export default backendOptimizer;