# How to Implement AI Content Moderation

## Quick Start (Recommended Approach)

Due to bundle size and performance concerns, here's the **practical implementation**:

### Option 1: Server-Side with Google Cloud Vision (Recommended)

**Pros:**
- No client bundle size increase
- More accurate
- Centralized control
- Better privacy (no client-side model)

**Steps:**

1. **Install Google Cloud Vision**
```bash
cd backend
npm install @google-cloud/vision
```

2. **Get API Key**
- Go to https://console.cloud.google.com
- Enable Vision API
- Create service account
- Download JSON key

3. **Add to backend/.env**
```env
GOOGLE_CLOUD_VISION_KEY_PATH=./google-cloud-key.json
MODERATION_ENABLED=true
MODERATION_THRESHOLD=0.6
```

4. **Create Moderation Service** (backend/src/lib/moderation.js)
```javascript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_VISION_KEY_PATH
});

export const analyzeImage = async (imageBase64) => {
  try {
    const [result] = await client.safeSearchDetection({
      image: { content: imageBase64.split(',')[1] }
    });
    
    const detections = result.safeSearchAnnotation;
    
    // Likelihood: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const isInappropriate = 
      detections.adult === 'LIKELY' || 
      detections.adult === 'VERY_LIKELY' ||
      detections.racy === 'VERY_LIKELY';
    
    return {
      safe: !isInappropriate,
      adult: detections.adult,
      violence: detections.violence,
      racy: detections.racy,
      medical: detections.medical,
      spoof: detections.spoof
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return { safe: true, error: error.message };
  }
};
```

5. **Add Moderation Endpoint** (backend/src/routes/moderation.route.js)
```javascript
import express from 'express';
import { analyzeImage } from '../lib/moderation.js';
import Report from '../models/report.model.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/analyze-frame', protectRoute, async (req, res) => {
  try {
    const { image, reportedUserId } = req.body;
    
    const analysis = await analyzeImage(image);
    
    // Auto-report if inappropriate
    if (!analysis.safe) {
      const report = new Report({
        reporter: req.user._id,
        reportedUser: reportedUserId,
        reason: 'Inappropriate Content (AI Detected)',
        description: `AI Moderation Alert:\n- Adult: ${analysis.adult}\n- Racy: ${analysis.racy}\n- Violence: ${analysis.violence}`,
        category: 'stranger_chat',
        screenshot: image,
        aiGenerated: true,
        aiConfidence: analysis.adult === 'VERY_LIKELY' ? 0.9 : 0.7
      });
      
      await report.save();
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' });
  }
});

export default router;
```

6. **Frontend Integration** (StrangerChatPage.jsx)
```javascript
import { axiosInstance } from '../lib/axios';

// Add to StrangerChatPage component
useEffect(() => {
  if (status !== 'connected' || !remoteVideoRef.current) return;
  
  const moderationInterval = setInterval(async () => {
    try {
      // Capture frame
      const canvas = document.createElement('canvas');
      const video = remoteVideoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const screenshot = canvas.toDataURL('image/jpeg', 0.7);
      
      // Send to server for analysis
      const { data } = await axiosInstance.post('/api/moderation/analyze-frame', {
        image: screenshot,
        reportedUserId: partnerUserId
      });
      
      if (!data.safe) {
        toast.error('Inappropriate content detected. Call will be terminated.');
        handleSkip();
      }
    } catch (error) {
      console.error('Moderation check failed:', error);
    }
  }, 15000); // Check every 15 seconds
  
  return () => clearInterval(moderationInterval);
}, [status, partnerUserId]);
```

### Option 2: Client-Side with NSFW.js (Lighter)

**Pros:**
- No server costs
- Instant detection
- Privacy-friendly

**Cons:**
- Larger bundle size (~5MB)
- Uses device resources

**Steps:**

1. **Install Dependencies**
```bash
cd frontend
npm install nsfwjs @tensorflow/tfjs
```

2. **Use the contentModeration.js utility I created**

3. **Add to StrangerChatPage.jsx**
```javascript
import { analyzeFrame, MODERATION_CONFIG } from '../utils/contentModeration';

useEffect(() => {
  if (status !== 'connected') return;
  
  let violations = 0;
  
  const checkInterval = setInterval(async () => {
    const analysis = await analyzeFrame(remoteVideoRef.current);
    
    if (!analysis.safe) {
      violations++;
      
      if (violations >= MODERATION_CONFIG.maxViolations) {
        // Auto-report
        const screenshot = captureVideoFrame(remoteVideoRef.current);
        socket.emit('stranger:report', {
          reporterId: authUser._id,
          reason: 'AI: Inappropriate Content',
          description: formatAIReport(analysis).description,
          screenshot
        });
        
        toast.error('Inappropriate content detected. Disconnecting.');
        handleSkip();
      } else {
        toast.warning('Warning: Inappropriate content detected');
      }
    }
  }, MODERATION_CONFIG.checkInterval);
  
  return () => clearInterval(checkInterval);
}, [status]);
```

## Recommendation

**For Production: Use Option 1 (Server-Side)**
- More reliable
- Better control
- Professional solution
- Easier to update

**For Testing: Use Option 2 (Client-Side)**
- Quick to implement
- No API costs
- Good for MVP

## Cost Comparison

### Google Cloud Vision
- Free: 1,000 requests/month
- Paid: $1.50 per 1,000 requests
- Estimate: ~$15/month for 10,000 calls

### AWS Rekognition
- Free: 5,000 images/month (first year)
- Paid: $1.00 per 1,000 images

### Client-Side (NSFW.js)
- Free forever
- No API costs
- Uses user's device

## Next Steps

1. Choose your approach
2. Follow the steps above
3. Test thoroughly
4. Add user notifications
5. Update Terms of Service
6. Monitor false positives

## Need Help?

The code structure is ready. You just need to:
1. Install the dependencies
2. Add the API keys (if using server-side)
3. Integrate the code snippets above

Let me know which option you prefer and I can help implement it!
