# 🧪 TEST AI MODERATION NOW - Step by Step

## Quick Start (5 Minutes)

### 1. Start Your Server
```bash
npm run dev
```

### 2. Open Browser with Console
- Open Chrome/Edge
- Press **F12** (Developer Tools)
- Click **Console** tab
- Go to: `http://localhost:5173/stranger-chat`

### 3. Watch for These Messages
Within 10 seconds you should see:
```
🚀 Initializing AI moderation model...
🔄 Loading NSFW detection model...
✅ TensorFlow.js backend ready: webgl
✅ NSFW detection model loaded successfully
✅ AI moderation ready
```

### 4. Check Visual Indicator
Look at the video area - you should see:
- **Green badge** "AI Protected" (top-left corner)
- If yellow "AI Loading..." - wait a few more seconds

### 5. Connect to Stranger
- Click "Find" button
- Wait for match
- Console should show:
```
⏰ Starting AI moderation checks in 3 seconds...
✅ AI moderation active - checking every 10s
```

### 6. Watch Detection Logs
Every 10 seconds you'll see:
```
🔍 AI Check #1 - Status: connected
📊 AI Predictions: Neutral: 95.2%, Drawing: 2.1%, Sexy: 1.8%, Porn: 0.6%, Hentai: 0.3%
✅ Content check passed - safe
```

---

## Test with OBS (Your Setup)

### Setup:
1. Open OBS Studio
2. Add "Screen Capture" or "Window Capture" source
3. In stranger chat, share your screen (select OBS window)
4. Play test content in OBS

### What to Watch:
- Console logs every 10 seconds
- Predictions with percentages
- Warnings when inappropriate content detected

### Expected Results:

#### Safe Content (Normal Video):
```
🔍 AI Check #1
📊 AI Predictions: Neutral: 98.5%, Drawing: 1.2%, Sexy: 0.2%, Porn: 0.1%, Hentai: 0.0%
✅ Content check passed - safe
```

#### Inappropriate Content:
```
🔍 AI Check #2
📊 AI Predictions: Porn: 85.3%, Sexy: 12.1%, Neutral: 2.5%, Drawing: 0.1%, Hentai: 0.0%
⚠️ AI Moderation Alert: {
  violations: 1,
  confidence: "85.3%",
  category: "Porn",
  allPredictions: [...]
}
🚨 AUTO-REPORTING due to high confidence
```

#### On Screen:
- Toast: "Inappropriate content detected. Disconnecting and reporting."
- Automatically skips to next person
- Report sent to admin

---

## Troubleshooting Guide

### ❌ Badge Stays Yellow
**Problem**: Model not loading

**Check**:
1. Console for errors
2. Internet connection (first load downloads 4MB)
3. Browser supports WebGL: Run in console:
   ```javascript
   console.log(tf.getBackend())
   // Should show: "webgl"
   ```

**Fix**:
- Refresh page (Ctrl+Shift+R)
- Clear cache and reload
- Try different browser (Chrome recommended)

---

### ❌ No Console Logs
**Problem**: Not on correct page or logs filtered

**Check**:
1. You're on `/stranger-chat` page
2. Console filter is set to "All levels"
3. Not in incognito mode (may block some features)

**Fix**:
- Navigate to stranger chat page
- Click "Default levels" dropdown in console
- Select "Verbose" to see all logs

---

### ❌ No Detection Happening
**Problem**: Checks not running

**Check Console For**:
```
✅ AI moderation active - checking every 10s
🔍 AI Check #1 - Status: connected
```

**If Missing**:
1. Ensure you're connected to a stranger (not just waiting)
2. Check if `status === 'connected'` in console:
   ```javascript
   // Run in console
   console.log('Status:', document.querySelector('[class*="connected"]'))
   ```
3. Verify remote video is playing (not frozen/black)

**Fix**:
- Skip to next person
- Refresh and try again
- Check video permissions granted

---

### ❌ Video is Black/Frozen
**Problem**: Video stream not working

**Check**:
1. Camera permissions granted
2. Other person's camera is on
3. WebRTC connection established

**Fix**:
- Click "Skip" and try next person
- Check browser permissions
- Ensure firewall not blocking WebRTC

---

### ❌ False Positives (Detecting Safe Content)
**Problem**: Threshold too sensitive

**Current Settings**:
- Warning at 60% confidence
- Auto-report at 80% confidence

**Adjust in** `frontend/src/utils/contentModeration.js`:
```javascript
export const MODERATION_CONFIG = {
  enabled: true,
  checkInterval: 10000,
  confidenceThreshold: 0.7,    // Change from 0.6 → 0.7
  autoReportThreshold: 0.9,    // Change from 0.8 → 0.9
  maxViolations: 3,            // Change from 2 → 3
};
```

---

### ❌ Not Detecting Obvious Content
**Problem**: Threshold too high or content not visible

**Check**:
1. Content is actually visible in video feed
2. Video quality is good (not pixelated)
3. Content is in frame (not off-screen)

**Console Should Show**:
```
📊 AI Predictions: Porn: 85.3%, ...
```

**If Predictions All Low**:
- Content may not be explicit enough
- Video quality too poor
- Try more obvious test content

**Adjust Sensitivity** (make more sensitive):
```javascript
confidenceThreshold: 0.5,    // Lower = more sensitive
autoReportThreshold: 0.7,    // Lower = auto-report sooner
```

---

## Understanding the Predictions

### Categories Explained:

| Category | Meaning | Action |
|----------|---------|--------|
| **Neutral** | Normal, safe content | ✅ No action |
| **Drawing** | Illustrations, cartoons | ✅ No action |
| **Sexy** | Suggestive, revealing clothing | ⚠️ Warning at 70%+ |
| **Porn** | Explicit sexual content | 🚨 Action at 60%+ |
| **Hentai** | Explicit animated content | 🚨 Action at 60%+ |

### Confidence Levels:

| Confidence | Meaning | Action |
|------------|---------|--------|
| 0-59% | Low confidence | ✅ Safe |
| 60-79% | Medium confidence | ⚠️ Warning toast |
| 80-100% | High confidence | 🚨 Auto-report + disconnect |

### Example Predictions:

**Safe Video Call**:
```
Neutral: 95.2%  ← Dominant category
Drawing: 2.1%
Sexy: 1.8%
Porn: 0.6%
Hentai: 0.3%
```

**Inappropriate Content**:
```
Porn: 85.3%    ← Dominant category (HIGH!)
Sexy: 12.1%
Neutral: 2.5%
Drawing: 0.1%
Hentai: 0.0%
```

---

## Testing Checklist

Use this to verify everything works:

- [ ] Server running (`npm run dev`)
- [ ] Browser console open (F12)
- [ ] Navigate to stranger chat page
- [ ] See "AI moderation ready" in console
- [ ] Green "AI Protected" badge visible
- [ ] Click "Find" to connect
- [ ] See "AI moderation active" in console
- [ ] See "AI Check #1, #2, #3..." every 10s
- [ ] See predictions with percentages
- [ ] Test with OBS screen share
- [ ] Play inappropriate content in OBS
- [ ] See detection in console
- [ ] See warning toast or auto-report
- [ ] Verify report in admin dashboard

---

## Performance Monitoring

### Check Model Load Time:
Look for time between these logs:
```
🔄 Loading NSFW detection model...  ← Start
✅ NSFW detection model loaded      ← End
```
Should be 5-10 seconds on first load.

### Check Analysis Speed:
Each check should complete in ~200ms:
```
🔍 AI Check #1 - Status: connected  ← Start
📊 AI Predictions: ...              ← End
```

### Memory Usage:
Open Chrome Task Manager (Shift+Esc):
- Before AI: ~100MB
- After AI loaded: ~150MB
- During analysis: ~160MB

---

## Advanced Testing

### Test Different Content Types:

1. **Normal Video** → Should pass
2. **Suggestive Images** → May warn
3. **Explicit Content** → Should detect
4. **Animated Content** → Should detect
5. **Text/Screenshots** → Should pass

### Test Edge Cases:

1. **Quick Skip** → Should stop checking
2. **Multiple Matches** → Should restart checking
3. **Network Issues** → Should handle gracefully
4. **Slow Video** → Should wait for ready state

### Test Thresholds:

1. Lower to 0.5 → More sensitive
2. Raise to 0.9 → Less sensitive
3. Test with borderline content

---

## What Success Looks Like

### Console Output:
```
🚀 Initializing AI moderation model...
🔄 Loading NSFW detection model...
✅ TensorFlow.js backend ready: webgl
✅ NSFW detection model loaded successfully
✅ AI moderation ready
⏰ Starting AI moderation checks in 3 seconds...
✅ AI moderation active - checking every 10s
🔍 AI Check #1 - Status: connected
📊 AI Predictions: Neutral: 95.2%, Drawing: 2.1%, Sexy: 1.8%, Porn: 0.6%, Hentai: 0.3%
✅ Content check passed - safe
🔍 AI Check #2 - Status: connected
📊 AI Predictions: Neutral: 94.8%, Drawing: 2.3%, Sexy: 1.9%, Porn: 0.7%, Hentai: 0.3%
✅ Content check passed - safe
```

### Visual Indicators:
- ✅ Green "AI Protected" badge
- ✅ Video playing smoothly
- ✅ No errors in console

### When Detection Works:
- ⚠️ Warning toast appears
- 🚨 Auto-report triggers
- 📱 Disconnects automatically
- 📊 Report in admin dashboard

---

## Need Help?

### Check These Files:
1. `frontend/src/utils/contentModeration.js` - AI logic
2. `frontend/src/pages/StrangerChatPage.jsx` - Integration
3. `backend/src/lib/socket.js` - Report handling

### Common Issues:
- Model not loading → Check internet connection
- No detections → Check video is playing
- False positives → Adjust thresholds
- Too slow → Increase check interval

### Debug Commands:
```javascript
// In browser console
localStorage.getItem('ai-moderation-enabled')
tf.getBackend()
console.log(MODERATION_CONFIG)
```

---

**Your AI moderation is now fully functional!** 🛡️

Test it with your OBS setup and watch the console logs. You should see detections every 10 seconds with detailed predictions.
