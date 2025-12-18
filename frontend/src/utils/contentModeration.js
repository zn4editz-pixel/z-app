// Content Moderation Utility
// Uses client-side AI to detect inappropriate content
// TensorFlow and NSFWJS are loaded dynamically to reduce initial bundle size
let tf = null;
let nsfwjs = null;
let nsfwModel = null;
let isModelLoading = false;
let modelLoadError = null;
// Dynamically load TensorFlow and NSFWJS
const loadDependencies = async () => {
  if (!tf) {
    tf = await import("@tensorflow/tfjs");
  }
  if (!nsfwjs) {
    nsfwjs = await import("nsfwjs");
  }
  return { tf, nsfwjs };
};
// Initialize NSFW model (lazy loading)
export const initNSFWModel = async () => {
  if (nsfwModel) return nsfwModel;
  if (isModelLoading) return null;
  isModelLoading = true;
  try {
    const { tf: tfModule, nsfwjs: nsfwModule } = await loadDependencies();
    await tfModule.ready();
    nsfwModel = await nsfwModule.load();
    modelLoadError = null;
    return nsfwModel;
  } catch (error) {
    modelLoadError = error.message;
    return null;
  } finally {
    isModelLoading = false;
  }
};
// Analyze video frame for inappropriate content
export const analyzeFrame = async (videoElement) => {
  try {
    if (!videoElement) {
      return { safe: true, confidence: 0, error: "No video element provided" };
    }
    // Initialize model if not loaded
    if (!nsfwModel && !isModelLoading) {
      await initNSFWModel();
    }
    // Wait for model with timeout
    let waitTime = 0;
    while (isModelLoading && waitTime < 10000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitTime += 100;
    }
    if (!nsfwModel) {
      return {
        safe: true,
        confidence: 0,
        error: modelLoadError || "Model not available",
      };
    }
    // Check if video is ready
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return { safe: true, confidence: 0, videoNotReady: true };
    }
    const predictions = await nsfwModel.classify(videoElement);
    // Find specific categories
    const getProbability = (className) => {
      const pred = predictions.find((p) => p.className === className);
      return pred ? pred.probability : 0;
    };
    const pornProb = getProbability("Porn");
    const hentaiProb = getProbability("Hentai");
    const sexyProb = getProbability("Sexy");
    const neutralProb = getProbability("Neutral");
    const drawingProb = getProbability("Drawing");
    // ✅ STRICT LOGIC: Only flag ACTUAL explicit content
    // Porn or Hentai above 70% = EXPLICIT (auto-report + disconnect)
    const isExplicit = pornProb > 0.7 || hentaiProb > 0.7;
    // Porn or Hentai between 50-70% = DOUBTFUL (blur + warn, report to admin for review)
    const isDoubtful = !isExplicit && (pornProb > 0.5 || hentaiProb > 0.5);
    // Sexy content above 80% ONLY if Neutral/Drawing is low = SUSPICIOUS (just warn)
    const isSuspicious =
      !isExplicit &&
      !isDoubtful &&
      sexyProb > 0.8 &&
      neutralProb < 0.3 &&
      drawingProb < 0.3;
    // Determine action
    let action = "none";
    let category = "safe";
    let confidence = 0;
    if (isExplicit) {
      action = "report_disconnect"; // Auto-report and disconnect
      category =
        pornProb > hentaiProb ? "Pornography" : "Hentai/Explicit Animation";
      confidence = Math.max(pornProb, hentaiProb);
    } else if (isDoubtful) {
      action = "blur_warn"; // Blur video, warn user, send to admin for review
      category = "Potentially Explicit (Review Required)";
      confidence = Math.max(pornProb, hentaiProb);
    } else if (isSuspicious) {
      action = "warn_only"; // Just show warning toast, no blur, no report
      category = "Suggestive Content";
      confidence = sexyProb;
    }
    const result = {
      safe: !isExplicit && !isDoubtful,
      explicit: isExplicit,
      doubtful: isDoubtful,
      suspicious: isSuspicious,
      action,
      category,
      confidence,
      predictions,
      shouldReport: isExplicit || isDoubtful, // Only these go to admin
      shouldDisconnect: isExplicit, // Only explicit auto-disconnects
      shouldBlur: isExplicit || isDoubtful, // Blur for explicit and doubtful
      shouldWarn: isExplicit || isDoubtful || isSuspicious, // Warn for all unsafe
    };
    return result;
  } catch (error) {
    return { safe: true, confidence: 0, error: error.message };
  }
};
// Capture frame from video element
export const captureVideoFrame = (videoElement) => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch (error) {
    return null;
  }
};
// Auto-moderation configuration
export const MODERATION_CONFIG = {
  enabled: true,
  silentMode: true, // ✅ No toasts/warnings shown to users
  checkInterval: 5000, // Check every 5 seconds
  // Thresholds
  explicitThreshold: 0.7, // 70%+ = explicit (disconnect + report)
  doubtfulThreshold: 0.5, // 50-70% = doubtful (blur + report for review)
  suspiciousThreshold: 0.8, // 80%+ sexy = suspicious (warn only)
  maxViolations: 2, // Disconnect after 2 explicit violations
};
// Format AI analysis for report
export const formatAIReport = (analysis) => {
  const { category, confidence, predictions, action } = analysis;
  let reason = "AI Content Moderation Alert";
  let description = "";
  if (analysis.explicit) {
    reason = "Explicit Content Detected";
    description = `🚨 EXPLICIT CONTENT DETECTED\n\nCategory: ${category}\nConfidence: ${(confidence * 100).toFixed(1)}%\nAction Taken: Auto-disconnect and Report\n\n`;
  } else if (analysis.doubtful) {
    reason = "Potentially Explicit Content (Review Required)";
    description = `⚠️ DOUBTFUL CONTENT - NEEDS REVIEW\n\nCategory: ${category}\nConfidence: ${(confidence * 100).toFixed(1)}%\nAction Taken: Blur + Warning\n\n`;
  }
  if (predictions) {
    description += "AI Analysis:\n";
    predictions.forEach((p) => {
      const bar = "█".repeat(Math.round(p.probability * 10));
      description += `${p.className}: ${bar} ${(p.probability * 100).toFixed(1)}%\n`;
    });
  }
  description +=
    "\n⚠️ This report was automatically generated by AI moderation.";
  return { reason, description };
};
