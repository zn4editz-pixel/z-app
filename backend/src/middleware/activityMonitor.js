
// Simple in-memory monitoring for server metrics
export const monitorStats = {
    requestsPerMinute: 0,
    activeConnections: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    responseTimes: [], // Keep last 100 response times
    startTime: Date.now()
};

// Reset requests per minute every 60 seconds
setInterval(() => {
    monitorStats.requestsPerMinute = 0;
}, 60000);

export const activityMonitor = (req, res, next) => {
    const start = Date.now();

    // Increment active connections
    monitorStats.activeConnections++;
    monitorStats.requestsPerMinute++;
    monitorStats.totalRequests++;

    // Hook into response finish
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Decrement active connections
        monitorStats.activeConnections = Math.max(0, monitorStats.activeConnections - 1);

        // Update average response time (moving average)
        monitorStats.responseTimes.push(duration);
        if (monitorStats.responseTimes.length > 100) {
            monitorStats.responseTimes.shift();
        }

        const sum = monitorStats.responseTimes.reduce((a, b) => a + b, 0);
        monitorStats.averageResponseTime = sum / monitorStats.responseTimes.length;
    });

    next();
};
