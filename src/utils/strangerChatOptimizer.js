// Stranger Chat Performance Optimizer
import { debounce, throttle } from 'lodash-es';

// WebRTC Configuration Optimizer
export const getOptimizedRTCConfig = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:a.relay.metered.ca:80",
        username: "87e69d452a19d7be8c0a6c70",
        credential: "uBqeBEI+0xKJYEHm"
      },
      {
        urls: "turn:a.relay.metered.ca:443",
        username: "87e69d452a19d7be8c0a6c70",
        credential: "uBqeBEI+0xKJYEHm"
      }
    ],
    iceCandidatePoolSize: isLowEnd ? 2 : 5,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  };
};

// Media Constraints Optimizer
export const getOptimizedMediaConstraints = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  
  // Base constraints
  let videoConstraints = {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    facingMode: "user",
    frameRate: { ideal: 30, max: 30 }
  };
  
  let audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2
  };
  
  // Optimize for low-end devices
  if (isLowEnd || isSlowConnection) {
    videoConstraints = {
      width: { min: 320, ideal: 640, max: 1280 },
      height: { min: 240, ideal: 480, max: 720 },
      facingMode: "user",
      frameRate: { ideal: 15, max: 24 }
    };
    
    audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1
    };
  }
  
  // Mobile optimizations
  if (isMobile) {
    videoConstraints.frameRate = { ideal: 24, max: 30 };
  }
  
  return {
    video: videoConstraints,
    audio: audioConstraints
  };
};

// Connection Quality Monitor
export class ConnectionQualityMonitor {
  constructor(peerConnection, onQualityChange) {
    this.pc = peerConnection;
    this.onQualityChange = onQualityChange;
    this.stats = [];
    this.monitoring = false;
    this.intervalId = null;
    
    // Throttled quality update to prevent excessive re-renders
    this.updateQuality = throttle(this.onQualityChange, 1000);
  }
  
  start() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.checkQuality();
    }, 2000);
  }
  
  stop() {
    this.monitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  async checkQuality() {
    if (!this.pc || this.pc.connectionState !== 'connected') return;
    
    try {
      const stats = await this.pc.getStats();
      let quality = 'good';
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 0;
          const totalPackets = packetsLost + packetsReceived;
          
          if (totalPackets > 0) {
            const lossRate = packetsLost / totalPackets;
            
            if (lossRate > 0.05) {
              quality = 'poor';
            } else if (lossRate > 0.02) {
              quality = 'fair';
            } else if (lossRate < 0.005) {
              quality = 'excellent';
            }
          }
        }
      });
      
      this.updateQuality(quality);
    } catch (error) {
      console.warn('Failed to get connection stats:', error);
    }
  }
}

// Message Queue for Smooth Chat
export class MessageQueue {
  constructor(onMessage, maxSize = 50) {
    this.queue = [];
    this.onMessage = onMessage;
    this.maxSize = maxSize;
    this.processing = false;
    
    // Debounced message processing
    this.processMessages = debounce(this._processMessages.bind(this), 100);
  }
  
  add(message) {
    this.queue.push({
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date()
    });
    
    // Keep queue size manageable
    if (this.queue.length > this.maxSize) {
      this.queue = this.queue.slice(-this.maxSize);
    }
    
    this.processMessages();
  }
  
  _processMessages() {
    if (this.processing) return;
    
    this.processing = true;
    
    // Process messages in batches for better performance
    const batch = this.queue.splice(0, 10);
    
    if (batch.length > 0) {
      this.onMessage(batch);
    }
    
    this.processing = false;
    
    // Continue processing if there are more messages
    if (this.queue.length > 0) {
      setTimeout(() => this.processMessages(), 50);
    }
  }
  
  clear() {
    this.queue = [];
  }
}

// Video Element Optimizer
export const optimizeVideoElement = (videoElement) => {
  if (!videoElement) return;
  
  // Performance optimizations
  videoElement.style.willChange = 'transform';
  videoElement.style.backfaceVisibility = 'hidden';
  videoElement.style.webkitBackfaceVisibility = 'hidden';
  videoElement.style.transform = 'translateZ(0)';
  
  // Disable context menu for better UX
  videoElement.oncontextmenu = () => false;
  
  // Optimize rendering
  videoElement.style.imageRendering = 'optimizeQuality';
  
  // Prevent selection
  videoElement.style.userSelect = 'none';
  videoElement.style.webkitUserSelect = 'none';
};

// Reaction Animation Optimizer
export class ReactionAnimator {
  constructor(container) {
    this.container = container;
    this.activeAnimations = new Set();
    this.maxConcurrentAnimations = 10;
  }
  
  animate(reaction) {
    // Limit concurrent animations for performance
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      return;
    }
    
    const element = document.createElement('div');
    element.textContent = reaction.emoji;
    element.className = 'absolute bottom-0 animate-float-up text-4xl pointer-events-none';
    element.style.left = `${reaction.x}%`;
    element.style.textShadow = '0 2px 8px rgba(0,0,0,0.5)';
    element.style.zIndex = '30';
    
    this.container.appendChild(element);
    this.activeAnimations.add(element);
    
    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeAnimations.delete(element);
    }, 3000);
  }
  
  clear() {
    this.activeAnimations.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.activeAnimations.clear();
  }
}

// Performance Monitor
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      connectionLatency: 0
    };
    this.callbacks = new Set();
  }
  
  start() {
    this.monitorFPS();
    this.monitorMemory();
  }
  
  monitorFPS() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = (currentTime) => {
      frames++;
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        this.notifyCallbacks();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  monitorMemory() {
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        this.notifyCallbacks();
      }, 5000);
    }
  }
  
  addCallback(callback) {
    this.callbacks.add(callback);
  }
  
  removeCallback(callback) {
    this.callbacks.delete(callback);
  }
  
  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.warn('Performance monitor callback error:', error);
      }
    });
  }
}

// Lazy Loading Utility
export const createLazyLoader = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const src = element.dataset.src;
        
        if (src) {
          element.src = src;
          element.removeAttribute('data-src');
          observer.unobserve(element);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
};

// Device Capability Detection
export const getDeviceCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  return {
    webgl: !!gl,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: navigator.deviceMemory || 1,
    connection: navigator.connection?.effectiveType || 'unknown',
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isLowEnd: (navigator.hardwareConcurrency || 1) <= 2 || (navigator.deviceMemory || 1) <= 2,
    supportsWebRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    supportsWebGL: !!gl
  };
};

// Export all utilities
export default {
  getOptimizedRTCConfig,
  getOptimizedMediaConstraints,
  ConnectionQualityMonitor,
  MessageQueue,
  optimizeVideoElement,
  ReactionAnimator,
  PerformanceMonitor,
  createLazyLoader,
  getDeviceCapabilities
};