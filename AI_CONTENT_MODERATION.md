# AI Content Moderation System

## Overview
Automated content moderation system for video calls using AI to detect inappropriate content.

## How It Works

### 1. Client-Side Detection (NSFW.js)
- **Privacy-First**: Analysis happens in the user's browser
- **No Server Upload**: Video frames are analyzed locally
- **TensorFlow.js**: Uses machine learning models
- **Categories Detected**:
  - Neutral (safe content)
  - Drawing (illustrations)
  - Hentai (explicit anime)
  - Porn (explicit content)
  - Sexy (suggestive content)

### 2. Detection Process
1. **Frame Capture**: Every 10 seconds during video calls
2. **AI Analysis**: Local ML model analyzes the frame
3. **Confidence Scoring**: 0-100% confidence for each category
4. **Threshold Check**: 
   - 60%+ = Flag as suspicious
   - 80%+ = Auto-report to admin

### 3. Actions Taken
- **Low Risk (60-79%)**: Warning to user
- **High Risk (80%+)**: Auto-report + disconnect
- **Multiple Violations**: Temporary ban

## Implementation

### Installation
```bash
npm install nsfwjs @tensorflow/tfjs
```

### Usage in StrangerChatPage
```javascript
import { analyzeFrame, captureVideoFrame, MODERATION_CONFIG } from '../utils/contentModeration';

// Start monitoring
useEffect(() => {
  if (status === 'connected' && remoteVideoRef.current) {
    const interval = setInterval(async () => {
      const analysis = await analyzeFrame(remoteVideoRef.current);
      
      if (!analysis.safe) {
        handleInappropriateContent(analysis);
      }
    }, MODERATION_CONFIG.checkInterval);
    
    return () => clearInterval(interval);
  }
}, [status]);
```

## Configuration

### Adjust Sensitivity
Edit `MODERATION_CONFIG` in `contentModeration.js`:

```javascript
export const MODERATION_CONFIG = {
  enabled: true,
  checkInterval: 10000, // Check frequency (ms)
  confidenceThreshold: 0.6, // Flag threshold
  autoReportThreshold: 0.8, // Auto-report threshold
  maxViolations: 2, // Max violations before ban
};
```

## Privacy & Legal

### Privacy Considerations
- ✅ All analysis happens client-side
- ✅ No video data sent to external servers
- ✅ Only screenshots sent when reporting
- ✅ Users should be notified of monitoring

### Legal Compliance
- Add to Terms of Service
- Display monitoring notice
- Comply with GDPR/privacy laws
- Allow users to opt-out (with restrictions)

### Recommended Notice
```
"For safety, our AI system monitors video calls for inappropriate 
content. Analysis happens on your device. Violations may result in 
automatic reporting to moderators."
```

## Limitations

### False Positives
- May flag innocent content
- Art, medical content, etc.
- Manual review recommended

### False Negatives
- May miss some violations
- Depends on camera angle
- User reports still important

### Performance
- Requires modern browser
- Uses device GPU/CPU
- May impact older devices

## Alternative APIs

### Google Cloud Vision API
```javascript
// Server-side option
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const [result] = await client.safeSearchDetection(imageBuffer);
const detections = result.safeSearchAnnotation;
// adult, violence, racy, etc.
```

### AWS Rekognition
```javascript
// Server-side option
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();

const params = {
  Image: { Bytes: imageBuffer },
  MinConfidence: 60
};

const result = await rekognition.detectModerationLabels(params).promise();
```

## Future Enhancements

1. **Multi-Model Approach**: Combine multiple AI models
2. **Behavioral Analysis**: Detect patterns over time
3. **Audio Moderation**: Detect inappropriate language
4. **Age Verification**: Ensure users are adults
5. **Blur/Block**: Auto-blur inappropriate content

## Testing

### Test Mode
Set `MODERATION_CONFIG.enabled = false` to disable during development.

### Manual Testing
1. Use test images with known content
2. Check console logs for predictions
3. Verify auto-report functionality
4. Test false positive handling

## Support

For issues or questions:
- Check browser console for errors
- Ensure TensorFlow.js is loaded
- Verify video element is accessible
- Test with different browsers

## Disclaimer

AI moderation is not 100% accurate. It should supplement, not replace, 
human moderation and user reporting systems.
