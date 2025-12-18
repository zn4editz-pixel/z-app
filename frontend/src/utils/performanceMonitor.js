/**
 * Performance Monitor - Track and optimize app performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      networkRequests: [],
      errors: [],
    };
    this.init();
  }
  init() {
    // Monitor render performance
    this.observeRenderPerformance();
    // Monitor memory usage
    this.observeMemoryUsage();
    // Monitor network requests
    this.observeNetworkRequests();
    // Monitor errors
    this.observeErrors();
  }
  observeRenderPerformance() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "measure") {
            this.metrics.renderTimes.push({
              name: entry.name,
              duration: entry.duration,
              timestamp: Date.now(),
            });
          }
        });
      });
      observer.observe({ entryTypes: ["measure"] });
    }
  }
  observeMemoryUsage() {
    if ("memory" in performance) {
      setInterval(() => {
        this.metrics.memoryUsage.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        });
        // Keep only last 100 entries
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
      }, 10000); // Every 10 seconds
    }
  }
  observeNetworkRequests() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (
            entry.entryType === "navigation" ||
            entry.entryType === "resource"
          ) {
            this.metrics.networkRequests.push({
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize || 0,
              timestamp: Date.now(),
            });
          }
        });
      });
      observer.observe({ entryTypes: ["navigation", "resource"] });
    }
  }
  observeErrors() {
    window.addEventListener("error", (event) => {
      this.metrics.errors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      this.metrics.errors.push({
        message: event.reason?.message || "Unhandled Promise Rejection",
        type: "promise",
        timestamp: Date.now(),
      });
    });
  }
  getMetrics() {
    return this.metrics;
  }
  getPerformanceScore() {
    const avgRenderTime =
      this.metrics.renderTimes.length > 0
        ? this.metrics.renderTimes.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          ) / this.metrics.renderTimes.length
        : 0;
    const memoryUsage =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
        : null;
    const errorCount = this.metrics.errors.length;
    return {
      renderPerformance:
        avgRenderTime < 16 ? "good" : avgRenderTime < 33 ? "fair" : "poor",
      memoryUsage: memoryUsage
        ? memoryUsage.used / memoryUsage.limit < 0.5
          ? "good"
          : "high"
        : "unknown",
      errorCount,
      overall:
        errorCount === 0 && avgRenderTime < 16
          ? "excellent"
          : "needs-improvement",
    };
  }
  logReport() {
    console.group("📊 Performance Report");
    console.groupEnd();
  }
}
// Initialize performance monitor in development
if (import.meta.env.DEV) {
  const monitor = new PerformanceMonitor();
  // Log report every 30 seconds
  setInterval(() => {
    monitor.logReport();
  }, 30000);
  // Make available globally for debugging
  window.performanceMonitor = monitor;
}
export default PerformanceMonitor;
