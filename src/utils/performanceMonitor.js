// ⚡ Performance Monitor - Real-time performance tracking
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('debug-performance') === 'true';
    
    if (this.isEnabled) {
      this.init();
    }
  }

  init() {
    // ✅ PERFORMANCE: Monitor Core Web Vitals
    this.observeWebVitals();
    
    // ✅ PERFORMANCE: Monitor memory usage
    this.observeMemory();
    
    // ✅ PERFORMANCE: Monitor network requests
    this.observeNetwork();
    
    // ✅ PERFORMANCE: Monitor React renders
    this.observeReactRenders();
  }

  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('CLS', clsValue);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  observeMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('Memory Used', memory.usedJSHeapSize / 1024 / 1024);
        this.recordMetric('Memory Total', memory.totalJSHeapSize / 1024 / 1024);
        this.recordMetric('Memory Limit', memory.jsHeapSizeLimit / 1024 / 1024);
      }, 5000);
    }
  }

  observeNetwork() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        this.recordMetric('Network Request', duration, { url: args[0], status: response.status });
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.recordMetric('Network Error', duration, { url: args[0], error: error.message });
        throw error;
      }
    };
  }

  observeReactRenders() {
    // Hook into React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      hook.onCommitFiberRoot = (id, root, priorityLevel) => {
        const renderTime = performance.now();
        this.recordMetric('React Render', renderTime, { rootId: id });
      };
    }
  }

  recordMetric(name, value, metadata = {}) {
    if (!this.isEnabled) return;

    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only last 100 entries per metric
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Log critical performance issues
    this.checkThresholds(name, value);
  }

  checkThresholds(name, value) {
    const thresholds = {
      'LCP': 2500, // 2.5s
      'FID': 100,  // 100ms
      'CLS': 0.1,  // 0.1
      'Memory Used': 100, // 100MB
      'Network Request': 3000, // 3s
      'React Render': 16 // 16ms (60fps)
    };

    if (thresholds[name] && value > thresholds[name]) {
      console.warn(`⚠️ Performance Issue: ${name} = ${value.toFixed(2)} (threshold: ${thresholds[name]})`);
    }
  }

  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  getAllMetrics() {
    const result = {};
    for (const [name, metrics] of this.metrics) {
      result[name] = {
        current: metrics[metrics.length - 1]?.value || 0,
        average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length || 0,
        max: Math.max(...metrics.map(m => m.value)) || 0,
        min: Math.min(...metrics.map(m => m.value)) || 0,
        count: metrics.length
      };
    }
    return result;
  }

  // ✅ PERFORMANCE: Memory leak detection
  detectMemoryLeaks() {
    if (!('memory' in performance)) return null;

    const memory = performance.memory;
    const memoryMetrics = this.getMetrics('Memory Used');
    
    if (memoryMetrics.length < 10) return null;

    // Check if memory is consistently increasing
    const recent = memoryMetrics.slice(-10);
    const trend = recent.reduce((acc, curr, idx) => {
      if (idx === 0) return acc;
      return acc + (curr.value > recent[idx - 1].value ? 1 : -1);
    }, 0);

    if (trend > 7) { // 7 out of 10 increases
      return {
        type: 'memory_leak',
        severity: 'high',
        message: 'Potential memory leak detected',
        currentUsage: memory.usedJSHeapSize / 1024 / 1024,
        trend: 'increasing'
      };
    }

    return null;
  }

  // ✅ PERFORMANCE: Generate performance report
  generateReport() {
    const metrics = this.getAllMetrics();
    const memoryLeak = this.detectMemoryLeaks();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      issues: memoryLeak ? [memoryLeak] : [],
      recommendations: this.getRecommendations(metrics)
    };
  }

  getRecommendations(metrics) {
    const recommendations = [];

    if (metrics['LCP']?.average > 2500) {
      recommendations.push('Consider optimizing images and reducing bundle size for better LCP');
    }

    if (metrics['Memory Used']?.max > 150) {
      recommendations.push('High memory usage detected. Check for memory leaks');
    }

    if (metrics['React Render']?.average > 16) {
      recommendations.push('React renders are slow. Consider memoization and optimization');
    }

    return recommendations;
  }

  // ✅ PERFORMANCE: Export data for analysis
  exportData() {
    const data = {
      metrics: Object.fromEntries(this.metrics),
      report: this.generateReport(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ✅ PERFORMANCE: Real-time monitoring dashboard
  showDashboard() {
    if (document.getElementById('perf-dashboard')) return;

    const dashboard = document.createElement('div');
    dashboard.id = 'perf-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-height: 400px;
      overflow-y: auto;
    `;

    const updateDashboard = () => {
      const metrics = this.getAllMetrics();
      dashboard.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">⚡ Performance Monitor</div>
        ${Object.entries(metrics).map(([name, data]) => `
          <div style="margin-bottom: 5px;">
            <strong>${name}:</strong> ${data.current.toFixed(2)}
            <div style="font-size: 10px; color: #ccc;">
              Avg: ${data.average.toFixed(2)} | Max: ${data.max.toFixed(2)}
            </div>
          </div>
        `).join('')}
        <button onclick="window.perfMonitor.exportData()" style="margin-top: 10px; padding: 5px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Export Data
        </button>
        <button onclick="document.getElementById('perf-dashboard').remove()" style="margin-top: 5px; margin-left: 5px; padding: 5px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      `;
    };

    updateDashboard();
    setInterval(updateDashboard, 1000);
    document.body.appendChild(dashboard);
  }
}

// ✅ PERFORMANCE: Global instance
const performanceMonitor = new PerformanceMonitor();

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  window.perfMonitor = performanceMonitor;
}

export default performanceMonitor;

// ✅ PERFORMANCE: React hook for component performance
export const usePerformanceMonitor = (componentName) => {
  if (typeof window === 'undefined') return { startTimer: () => () => {}, recordMetric: () => {} };
  
  const renderStart = performance.now();
  
  // Only use React hooks if React is available
  if (typeof React !== 'undefined' && React.useEffect) {
    React.useEffect(() => {
      const renderEnd = performance.now();
      performanceMonitor.recordMetric(`${componentName} Render`, renderEnd - renderStart);
    });
  }

  return {
    startTimer: (name) => {
      const start = performance.now();
      return () => {
        const end = performance.now();
        performanceMonitor.recordMetric(`${componentName} ${name}`, end - start);
      };
    },
    recordMetric: (name, value) => {
      performanceMonitor.recordMetric(`${componentName} ${name}`, value);
    }
  };
};