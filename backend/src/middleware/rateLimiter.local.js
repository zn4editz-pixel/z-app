// LOCAL DEVELOPMENT RATE LIMITING (NO REDIS)
import rateLimit from 'express-rate-limit';

// General API rate limiting (memory store)
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
  max: 20, // More lenient for local development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Message sending rate limiting
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // More lenient for local development
  message: {
    error: 'Message rate limit exceeded. Please slow down.',
    retryAfter: '1 minute'
  },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // More lenient for local development
  message: {
    error: 'Upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: '5 minutes'
  },
});

// Friend request rate limiting
export const friendRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // More lenient for local development
  message: {
    error: 'Friend request rate limit exceeded. Please wait before sending more requests.',
    retryAfter: '1 hour'
  },
});

export default {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  friendRequestLimiter,
};