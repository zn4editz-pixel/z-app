// SIMPLE RATE LIMITING - NO REDIS DEPENDENCY
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Message sending rate limiting
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute per user
  message: {
    error: 'Message rate limit exceeded. Please slow down.',
    retryAfter: '1 minute'
  },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 uploads per 5 minutes
  message: {
    error: 'Upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: '5 minutes'
  },
});

// Admin API rate limiting (more permissive for admin users)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Higher limit for admin operations
  message: {
    error: 'Admin API rate limit exceeded.',
    retryAfter: '15 minutes'
  },
});

export default {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  adminLimiter,
};