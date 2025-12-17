/**
 * Production Security Enhancements
 * Prevents sensitive information exposure and debugging in production
 */

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Security measures for production
export const initProductionSecurity = () => {
  if (!isProduction) return;

  // 1. Disable console completely
  const noop = () => {};
  const consoleMethods = [
    'log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
    'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 
    'profileEnd', 'table', 'clear'
  ];

  consoleMethods.forEach(method => {
    console[method] = noop;
  });

  // 2. Prevent console re-enabling
  Object.defineProperty(window, 'console', {
    value: console,
    writable: false,
    configurable: false
  });

  // 3. Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 4. Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.keyCode === 83) {
      e.preventDefault();
      return false;
    }
  });

  // 5. Detect DevTools opening
  let devtools = {
    open: false,
    orientation: null
  };

  const threshold = 160;

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Redirect or show warning
        document.body.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 24px;
            z-index: 999999;
          ">
            <div style="text-align: center;">
              <h1>Access Restricted</h1>
              <p>Developer tools are not allowed on this site.</p>
              <p>Please close developer tools and refresh the page.</p>
            </div>
          </div>
        `;
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // 6. Disable text selection and drag
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // 7. Clear sensitive data from memory
  window.addEventListener('beforeunload', () => {
    // Clear localStorage of sensitive data
    const sensitiveKeys = ['token', 'auth', 'session', 'user', 'password'];
    sensitiveKeys.forEach(key => {
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.toLowerCase().includes(key)) {
          localStorage.removeItem(storageKey);
        }
      });
    });
  });

  // 8. Prevent iframe embedding
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

  // 9. Add security headers via meta tags
  const securityMeta = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
    { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
    { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
  ];

  securityMeta.forEach(meta => {
    const metaTag = document.createElement('meta');
    Object.keys(meta).forEach(key => {
      metaTag.setAttribute(key, meta[key]);
    });
    document.head.appendChild(metaTag);
  });

  console.log = noop; // Final console disable
};

// Initialize security measures
if (isProduction) {
  initProductionSecurity();
}