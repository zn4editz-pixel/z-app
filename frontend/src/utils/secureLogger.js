/**
 * Secure Logger - Production-safe logging system
 * Prevents sensitive information from being exposed in production console
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Define what should never be logged in production
const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /auth/i,
  /session/i,
  /cookie/i,
  /bearer/i,
  /jwt/i,
  /api.*key/i,
  /database/i,
  /connection.*string/i
];

// Check if content contains sensitive information
const containsSensitiveInfo = (content) => {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
};

// Sanitize sensitive data
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return SENSITIVE_PATTERNS.reduce((str, pattern) => {
      return str.replace(pattern, '[REDACTED]');
    }, data);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    return sanitized;
  }
  
  return data;
};

// Secure logger class
class SecureLogger {
  constructor() {
    this.isEnabled = isDevelopment;
    this.maxLogLevel = isProduction ? 'error' : 'debug';
  }

  // Only log in development
  debug(...args) {
    if (!isDevelopment) return;
    
    const sanitizedArgs = args.map(arg => 
      containsSensitiveInfo(arg) ? sanitizeData(arg) : arg
    );
    
    console.log('🐛', ...sanitizedArgs);
  }

  // Log info in development, silent in production
  info(...args) {
    if (!isDevelopment) return;
    
    const sanitizedArgs = args.map(arg => 
      containsSensitiveInfo(arg) ? sanitizeData(arg) : arg
    );
    
    console.info('ℹ️', ...sanitizedArgs);
  }

  // Log warnings in development only
  warn(...args) {
    if (!isDevelopment) return;
    
    const sanitizedArgs = args.map(arg => 
      containsSensitiveInfo(arg) ? sanitizeData(arg) : arg
    );
    
    console.warn('⚠️', ...sanitizedArgs);
  }

  // Always log errors but sanitize them
  error(...args) {
    const sanitizedArgs = args.map(arg => 
      containsSensitiveInfo(arg) ? sanitizeData(arg) : arg
    );
    
    if (isProduction) {
      // In production, only log generic error messages
      console.error('An error occurred. Please contact support if this persists.');
      
      // Send to error reporting service (without sensitive data)
      this.reportError(sanitizedArgs);
    } else {
      console.error('❌', ...sanitizedArgs);
    }
  }

  // Performance logging (development only)
  perf(name, duration) {
    if (!isDevelopment) return;
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
  }

  // Network logging (development only)
  network(method, url, status, duration) {
    if (!isDevelopment) return;
    
    // Sanitize URL to remove sensitive query params
    const sanitizedUrl = url.replace(/([?&])(token|key|secret|auth)=[^&]*/gi, '$1$2=[REDACTED]');
    
    console.log(`🌐 ${method} ${sanitizedUrl} - ${status} (${duration}ms)`);
  }

  // Socket events (development only)
  socket(event, data = null) {
    if (!isDevelopment) return;
    
    const sanitizedData = data ? sanitizeData(data) : '';
    console.log(`🔌 Socket: ${event}`, sanitizedData);
  }

  // Report errors to external service (production)
  reportError(args) {
    if (!isProduction) return;
    
    // Here you would send to your error reporting service
    // like Sentry, LogRocket, etc. (without sensitive data)
    try {
      // Example: Send to error reporting service
      // errorReportingService.captureException(args);
    } catch (e) {
      // Silently fail - don't expose error reporting issues
    }
  }

  // Completely disable all logging in production
  disableInProduction() {
    if (isProduction) {
      this.debug = () => {};
      this.info = () => {};
      this.warn = () => {};
      this.perf = () => {};
      this.network = () => {};
      this.socket = () => {};
    }
  }
}

// Create singleton instance
const logger = new SecureLogger();

// Disable all logging in production for maximum security
if (isProduction) {
  logger.disableInProduction();
}

export default logger;

// Convenience exports
export const { debug, info, warn, error, perf, network, socket } = logger;