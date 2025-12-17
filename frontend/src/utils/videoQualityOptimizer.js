/**
 * Video Quality Optimizer for 4K Video Calls
 * Adaptive quality based on connection speed and device capabilities
 */

// Connection speed detection
export const detectConnectionSpeed = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  return {
    effectiveType: connection?.effectiveType || '4g',
    downlink: connection?.downlink || 10, // Mbps
    rtt: connection?.rtt || 100, // Round trip time in ms
    saveData: connection?.saveData || false
  };
};

// Get optimal video constraints based on connection
export const getOptimalVideoConstraints = (connectionInfo = null) => {
  const conn = connectionInfo || detectConnectionSpeed();
  const { downlink, effectiveType, saveData, rtt } = conn;
  
  // Don't use high quality if user has data saver on
  if (saveData) {
    return {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
      frameRate: { ideal: 15, max: 24 }
    };
  }
  
  // Ultra-high quality for 5G and high-speed connections
  if (downlink >= 50 && (effectiveType === '5g' || rtt < 50)) {
    console.log('🚀 Using 4K Ultra quality (5G/Ultra-fast connection detected)');
    return {
      width: { ideal: 3840, max: 3840 },
      height: { ideal: 2160, max: 2160 },
      facingMode: "user",
      frameRate: { ideal: 60, max: 60 },
      aspectRatio: 16/9
    };
  }
  
  // 4K for high-speed connections (25+ Mbps, low latency)
  if (downlink >= 25 && rtt < 100) {
    console.log('🎥 Using 4K quality (High-speed connection detected)');
    return {
      width: { ideal: 3840, max: 3840 },
      height: { ideal: 2160, max: 2160 },
      facingMode: "user",
      frameRate: { ideal: 30, max: 60 },
      aspectRatio: 16/9
    };
  }
  
  // 1440p for good connections (15+ Mbps)
  if (downlink >= 15) {
    console.log('📺 Using 1440p quality (Good connection detected)');
    return {
      width: { ideal: 2560, max: 2560 },
      height: { ideal: 1440, max: 1440 },
      facingMode: "user",
      frameRate: { ideal: 30, max: 30 },
      aspectRatio: 16/9
    };
  }
  
  // 1080p for moderate connections (10+ Mbps)
  if (downlink >= 10) {
    console.log('🎬 Using 1080p quality (Moderate connection detected)');
    return {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      facingMode: "user",
      frameRate: { ideal: 30, max: 30 },
      aspectRatio: 16/9
    };
  }
  
  // 720p for slower connections (5+ Mbps)
  if (downlink >= 5) {
    console.log('📹 Using 720p quality (Slower connection detected)');
    return {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      facingMode: "user",
      frameRate: { ideal: 24, max: 30 },
      aspectRatio: 16/9
    };
  }
  
  // 480p fallback for very slow connections
  console.log('📱 Using 480p quality (Slow connection detected)');
  return {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user",
    frameRate: { ideal: 24, max: 30 },
    aspectRatio: 4/3
  };
};

// Get optimal audio constraints
export const getOptimalAudioConstraints = (connectionInfo = null) => {
  const conn = connectionInfo || detectConnectionSpeed();
  const { downlink, saveData } = conn;
  
  // Basic audio for data saver mode
  if (saveData) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1
    };
  }
  
  // High-quality stereo audio for good connections
  if (downlink >= 10) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000, // CD quality
      channelCount: 2, // Stereo
      latency: 0.01 // Low latency
    };
  }
  
  // Standard quality audio
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 1
  };
};

// Enhanced WebRTC configuration for 4K
export const getEnhanced4KRTCConfig = () => ({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.stunprotocol.org:3478" },
    // Additional STUN servers for better global connectivity
    { urls: "stun:stun.ekiga.net" },
    { urls: "stun:stun.ideasip.com" }
  ],
  iceCandidatePoolSize: 20, // More candidates for better connectivity
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all',
  sdpSemantics: 'unified-plan'
});

// Optimize video element for better performance
export const optimizeVideoElement = (videoElement) => {
  if (!videoElement) return;
  
  // Performance optimizations
  videoElement.style.willChange = 'transform';
  videoElement.style.transform = 'translateZ(0)'; // Force hardware acceleration
  videoElement.style.backfaceVisibility = 'hidden';
  
  // Quality settings
  videoElement.setAttribute('playsinline', 'true');
  videoElement.setAttribute('webkit-playsinline', 'true');
  videoElement.muted = false; // Allow audio
  
  // Auto-play settings
  videoElement.autoplay = true;
  videoElement.controls = false;
};

// Monitor connection quality and adapt
export const monitorConnectionQuality = (peerConnection, onQualityChange) => {
  if (!peerConnection) return;
  
  const checkQuality = async () => {
    try {
      const stats = await peerConnection.getStats();
      let inboundRtp = null;
      let outboundRtp = null;
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          inboundRtp = report;
        }
        if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          outboundRtp = report;
        }
      });
      
      if (inboundRtp) {
        const quality = {
          packetsLost: inboundRtp.packetsLost || 0,
          packetsReceived: inboundRtp.packetsReceived || 0,
          bytesReceived: inboundRtp.bytesReceived || 0,
          frameWidth: inboundRtp.frameWidth || 0,
          frameHeight: inboundRtp.frameHeight || 0,
          framesPerSecond: inboundRtp.framesPerSecond || 0
        };
        
        // Calculate quality score
        const lossRate = quality.packetsLost / (quality.packetsReceived + quality.packetsLost);
        const isHighQuality = quality.frameWidth >= 1920 && quality.framesPerSecond >= 25;
        const isLowLatency = lossRate < 0.01;
        
        let qualityLevel = 'poor';
        if (isHighQuality && isLowLatency) qualityLevel = 'excellent';
        else if (isHighQuality || isLowLatency) qualityLevel = 'good';
        else if (lossRate < 0.05) qualityLevel = 'fair';
        
        onQualityChange(qualityLevel, quality);
      }
    } catch (error) {
      console.warn('Failed to get connection stats:', error);
    }
  };
  
  // Check quality every 5 seconds
  const interval = setInterval(checkQuality, 5000);
  return () => clearInterval(interval);
};

// Get quality description for UI
export const getQualityDescription = (connectionInfo) => {
  const conn = connectionInfo || detectConnectionSpeed();
  const { downlink, effectiveType } = conn;
  
  if (downlink >= 50 && effectiveType === '5g') {
    return { level: '4K Ultra', color: 'text-green-500', description: '4K 60fps - Ultra High Quality' };
  }
  if (downlink >= 25) {
    return { level: '4K', color: 'text-green-400', description: '4K 30fps - High Quality' };
  }
  if (downlink >= 15) {
    return { level: '1440p', color: 'text-blue-400', description: '1440p 30fps - Very Good Quality' };
  }
  if (downlink >= 10) {
    return { level: '1080p', color: 'text-blue-300', description: '1080p 30fps - Good Quality' };
  }
  if (downlink >= 5) {
    return { level: '720p', color: 'text-yellow-400', description: '720p 24fps - Standard Quality' };
  }
  return { level: '480p', color: 'text-orange-400', description: '480p 24fps - Basic Quality' };
};

export default {
  detectConnectionSpeed,
  getOptimalVideoConstraints,
  getOptimalAudioConstraints,
  getEnhanced4KRTCConfig,
  optimizeVideoElement,
  monitorConnectionQuality,
  getQualityDescription
};