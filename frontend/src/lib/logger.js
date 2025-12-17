/**
 * Production-safe logger utility
 * Automatically disabled in production builds
 */

const isDev = import.meta.env.DEV;

export const logger = {
    log: (...args) => isDev && console.log(...args),
    info: (...args) => isDev && console.info(...args),
    warn: (...args) => isDev && console.warn(...args),
    debug: (...args) => isDev && console.debug(...args),
    error: (...args) => console.error(...args), // Always show errors
    table: (...args) => isDev && console.table(...args),
};

// For cases where you need to force logging (like critical errors)
export const forceLog = (...args) => console.log(...args);

export default logger;
