/**
 * CSS Optimization Utilities
 */

// Critical CSS that should be loaded immediately
export const criticalCSS = `
  /* Critical above-the-fold styles */
  html, body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: oklch(var(--b1));
    color: oklch(var(--bc));
  }
  
  .loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: oklch(var(--b1));
    z-index: 9999;
  }
`;

// Load non-critical CSS asynchronously
export const loadNonCriticalCSS = () => {
  const nonCriticalStyles = [
    '/src/styles/animations.css',
    '/src/styles/responsive.css',
    '/src/styles/mobile.css'
  ];
  
  nonCriticalStyles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  });
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/avatar.png', as: 'image' },
    { href: '/zn4.png', as: 'image' }
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    document.head.appendChild(link);
  });
};