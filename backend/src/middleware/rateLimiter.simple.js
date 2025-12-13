// SIMPLE RATE LIMITING FOR PRODUCTION
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

// Friend request rate limiting
export const friendRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 friend requests per hour
  message: {
    error: 'Friend request rate limit exceeded. Please wait before sending more requests.',
    retryAfter: '1 hour'
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

// Search rate limiting
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Search rate limit exceeded. Please wait before searching again.',
    retryAfter: '1 minute'
  },
});

// Password reset rate limiting
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts. Please try again later.',
    retryAfter: '1 hour'
  },
});

// Registration rate limiting
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    error: 'Registration rate limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
});

export default {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  friendRequestLimiter,
  adminLimiter,
  searchLimiter,
  passwordResetLimiter,
  registrationLimiter,
};