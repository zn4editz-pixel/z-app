// Content Moderation Utility
// Uses client-side AI to detect inappropriate content
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

let nsfwModel = null;
let isModelLoading = false;
let modelLoadError = null;

// Initialize NSFW model (lazy loading)
export const initNSFWModel = async () => {
  if (nsfwModel) {
    console.log('✅ NSFW model already loaded');
    return nsfwModel;
  }
  
  if (isModelLoading) {
    console.log('⏳ NSFW model is loading...');
    return null;
  }
  
  isModelLoading = true;
  console.log('🔄 Loading NSFW detection model...');
  
  try {
    // Ensure TensorFlow.js backend is ready
    await tf.ready();
    console.log('✅ TensorFlow.js backend ready:', tf.getBackend());
    
    // Load NSFW model
    nsfwModel = await nsfwjs.load();
    console.log('✅ NSFW detection model loaded successfully');
    modelLoadError = null;
    return nsfwModel;
  } catch (error) {
    console.error('❌ Failed to load NSFW model:', error);
    modelLoadError = error.message;
    return null;
  } finally {
    isModelLoading = false;
  }
};

// Analyze video frame for inappropriate content
export const analyzeFrame = async (videoElement) => {
  try {
    // Initialize model if not loaded
    if (!nsfwModel && !isModelLoading) {
      console.log('🔄 Model not loaded, initializing...');
      await initNSFWModel();
    }
    
    // Wait for model to be ready
    if (isModelLoading) {
      console.log('⏳ Waiting for model to load...');
      return { safe: true, confidence: 0, loading: true };
    }
    
    if (!nsfwModel) {
      console.warn('⚠️ NSFW model not available:', modelLoadError);
      return { safe: true, confidence: 0, error: modelLoadError };
    }

    // Check if video is ready
    if (!videoElement || videoElement.readyState < 2) {
      console.log('⏳ Video not ready yet');
      return { safe: true, confidence: 0, videoNotReady: true };
    }

    console.log('🔍 Analyzing frame...');
    const predictions = await nsfwModel.classify(videoElement);
    
    // Always log predictions for debugging
    console.log('📊 AI Predictions:', predictions.map(p => 
      `${p.className}: ${(p.probability * 100).toFixed(1)}%`
    ).join(', '));
    
    // Log video element state
    console.log('📹 Video state:', {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      readyState: videoElement.readyState,
      paused: videoElement.paused
    });
    
    // Categories: Neutral, Drawing, Hentai, Porn, Sexy
    const inappropriate = predictions.filter(p => 
      ['Hentai', 'Porn'].includes(p.className) && p.probability > 0.3 // Lowered threshold
    );
    
    const suspicious = predictions.filter(p => 
      p.className === 'Sexy' && p.probability > 0.4 // Lowered threshold
    );

    const isInappropriate = inappropriate.length > 0;
    const isSuspicious = suspicious.length > 0;
    
    const result = {
      safe: !isInappropriate && !isSuspicious,
      inappropriate: isInappropriate,
      suspicious: isSuspicious,
      predictions,
      highestRisk: predictions.reduce((max, p) => 
        p.probability > max.probability ? p : max
      ),
    };
    
    if (!result.safe) {
      console.warn('⚠️ UNSAFE CONTENT DETECTED:', result.highestRisk);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Frame analysis error:', error);
    return { safe: true, confidence: 0, error: error.message };
  }
};

// Capture frame from video element
export const captureVideoFrame = (videoElement) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Frame capture error:', error);
    return null;
  }
};

// Auto-moderation configuration
export const MODERATION_CONFIG = {
  enabled: true,
  checkInterval: 5000, // Check every 5 seconds
  silentReportThreshold: 0.50, // 50% confidence - silent report to admin for review (no user action)
  confidenceThreshold: 0.70, // 70% confidence to flag and warn user
  autoReportThreshold: 0.85, // 85% confidence to auto-report and disconnect (high confidence only)
  maxViolations: 3, // Auto-disconnect after 3 violations (more lenient)
};

// Format AI analysis for report
export const formatAIReport = (analysis) => {
  const { highestRisk, predictions } = analysis;
  
  let reason = 'Inappropriate Content Detected';
  let description = `AI detected potentially inappropriate content:\n\n`;
  
  if (highestRisk) {
    description += `Primary Detection: ${highestRisk.className} (${(highestRisk.probability * 100).toFixed(1)}% confidence)\n\n`;
  }
  
  description += 'Full Analysis:\n';
  predictions.forEach(p => {
    description += `- ${p.className}: ${(p.probability * 100).toFixed(1)}%\n`;
  });
  
  description += '\n⚠️ This report was automatically generated by AI content moderation.';
  
  return { reason, description };
};
