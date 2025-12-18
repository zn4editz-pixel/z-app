/**
 * Production-safe logger utility
 * Automatically disabled in production builds
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

// For cases where you need to force logging (like critical errors)
export const forceLog = (...args) => {
  console.log(...args);
};

export default logger;
