// Ultra-Fast Loading Utilities for Stranger Chat

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload WebRTC polyfills if needed
  if (!window.RTCPeerConnection) {
    import('webrtc-adapter');
  }
  
  // Preload audio context for faster audio processing
  if (window.AudioContext || window.webkitAudioContext) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.close(); // Just to initialize the engine
  }
};

// Optimize video element for performance
export const optimizeVideoElement = (videoElement) => {
  if (!videoElement) return;
  
  // Performance optimizations
  videoElement.style.willChange = 'transform';
  videoElement.style.backfaceVisibility = 'hidden';
  videoElement.style.webkitBackfaceVisibility = 'hidden';
  videoElement.style.transform = 'translateZ(0)';
  videoElement.style.imageRendering = 'optimizeSpeed';
  
  // Disable context menu for better UX
  videoElement.oncontextmenu = () => false;
  
  // Prevent selection
  videoElement.style.userSelect = 'none';
  videoElement.style.webkitUserSelect = 'none';
};

// Fast media constraints for instant loading
export const getFastMediaConstraints = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    video: {
      width: { ideal: isMobile ? 320 : 480 },
      height: { ideal: isMobile ? 240 : 360 },
      facingMode: "user",
      frameRate: { ideal: 15, max: 20 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 22050
    }
  };
};

// Debounced state updater for performance
export const createDebouncedUpdater = (setState, delay = 100) => {
  let timeoutId;
  return (value) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setState(value), delay);
  };
};

// Memory-efficient message handler
export const createMessageHandler = (maxMessages = 10) => {
  return (prevMessages, newMessage) => {
    const message = { ...newMessage, id: Date.now() + Math.random() };
    return prevMessages.length >= maxMessages 
      ? [...prevMessages.slice(-(maxMessages - 1)), message]
      : [...prevMessages, message];
  };
};

// Performance monitoring
export const createPerformanceMonitor = () => {
  let lastTime = performance.now();
  let frameCount = 0;
  
  return {
    measureFPS: () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        return fps;
      }
      
      return null;
    },
    
    measureMemory: () => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
        };
      }
      return null;
    }
  };
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Preload critical resources
  preloadCriticalResources();
  
  // Optimize CSS animations
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .performance-optimized {
      will-change: transform;
      backface-visibility: hidden;
      transform: translateZ(0);
    }
    
    .gpu-accelerated {
      transform: translate3d(0, 0, 0);
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
  
  // Enable hardware acceleration for animations
  document.body.style.transform = 'translateZ(0)';
};

export default {
  preloadCriticalResources,
  optimizeVideoElement,
  getFastMediaConstraints,
  createDebouncedUpdater,
  createMessageHandler,
  createPerformanceMonitor,
  initPerformanceOptimizations
};