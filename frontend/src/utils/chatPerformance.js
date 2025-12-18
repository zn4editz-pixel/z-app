// Chat Performance Optimizations
export const optimizeScrolling = (container) => {
  if (!container) return;
  
  // Enable hardware acceleration
  container.style.transform = 'translateZ(0)';
  container.style.willChange = 'scroll-position';
  container.style.backfaceVisibility = 'hidden';
  
  // Optimize for touch devices
  container.style.WebkitOverflowScrolling = 'touch';
  container.style.overscrollBehavior = 'contain';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const smoothScrollTo = (element, to, duration = 300) => {
  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();
  
  const animateScroll = (currentTime) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function
    const easeInOutQuad = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;
    
    element.scrollTop = start + change * easeInOutQuad;
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
};
