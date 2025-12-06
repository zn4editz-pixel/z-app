# 🤖 AI Moderation Testing Guide

## Quick Start

### Step 1: Start Your App
```bash
fix-and-start.bat
```

Wait for both frontend and backend to start.

---

## 🎯 What to Test

### Test 1: Image Moderation (Messages)

1. **Login as two different users** (use two browsers or incognito)
2. **Start a chat** between them
3. **Send images**:
   - ✅ Normal images (should work fine)
   - ⚠️ Inappropriate images (should be flagged)

**What happens:**
- Image is analyzed before sending
- If inappropriate (>60% confidence): Warning shown
- If very inappropriate (>80% confidence): Auto-reported to admin
- Message still sends but admin gets notified

---

### Test 2: Video Call Moderation

1. **Login as two users**
2. **Go to Stranger Chat** or start a private call
3. **Start video call**
4. **Open browser console** (F12)

**What to watch for:**
- Every 10 seconds, AI checks video frames
- Console shows: "AI Moderation: Checking frame..."
- If inappropriate content detected:
  - Warning 1: Alert shown
  - Warning 2: Final warning
  - Warning 3: Call auto-disconnects

**Test scenarios:**
- Normal video: No warnings
- Show inappropriate content: Triggers warnings
- 3 violations: Auto-disconnect

---

### Test 3: Admin Dashboard

1. **Login as admin** (user with admin role)
2. **Go to Admin Panel** → **AI Moderation tab**
3. **Check the dashboard**:
   - Total AI reports
   - Pending reports
   - Recent violations
   - User violation history

**What you'll see:**
- All auto-generated AI reports
- Confidence scores
- Violation types (image/video)
- User details

---

## 🔧 Configuration

Location: `frontend/src/utils/contentModeration.js`

```javascript
MODERATION_CONFIG = {
  enabled: true,              // Turn on/off
  checkInterval: 10000,       // Check every 10 seconds
  confidenceThreshold: 0.6,   // 60% = flag as inappropriate
  autoReportThreshold: 0.8,   // 80% = auto-report to admin
  maxViolations: 2            // Max warnings before disconnect
}
```

**To adjust sensitivity:**
- Lower threshold = More strict (flags more)
- Higher threshold = Less strict (flags less)

---

## 📊 Expected Results

### Normal Content
```
✅ No warnings
✅ No reports
✅ Smooth experience
```

### Inappropriate Content (60-79% confidence)
```
⚠️ Warning shown to user
⚠️ Logged in console
❌ NOT auto-reported (manual review needed)
```

### Very Inappropriate (80%+ confidence)
```
🚨 Warning shown
🚨 Auto-reported to admin
🚨 Admin notification created
```

### Multiple Violations (3+)
```
🔴 Call disconnected
🔴 Report sent to admin
🔴 User flagged for review
```

---

## 🐛 Troubleshooting

### AI not working?
1. Check console for errors
2. Verify dependencies installed:
   ```bash
   cd frontend
   npm list nsfwjs @tensorflow/tfjs
   ```
3. If missing, install:
   ```bash
   npm install nsfwjs @tensorflow/tfjs
   ```

### Model loading slow?
- First load downloads AI model (~10MB)
- Subsequent loads are cached
- Check network tab in DevTools

### False positives?
- Adjust `confidenceThreshold` higher (e.g., 0.7 or 0.8)
- AI isn't perfect, some false flags are normal

---

## 🎮 Quick Test Commands

### Check Dependencies
```bash
cd frontend
npm list nsfwjs @tensorflow/tfjs
```

### View Console Logs
Press `F12` in browser → Console tab

Look for:
- "AI Moderation: Checking frame..."
- "AI Moderation Alert"
- "Violation count: X"

---

## 📝 Test Checklist

- [ ] Image moderation works in chat
- [ ] Video moderation checks every 10 seconds
- [ ] Warnings appear on violations
- [ ] Auto-disconnect after 3 violations
- [ ] Admin receives AI reports
- [ ] AI Moderation panel shows reports
- [ ] Confidence scores displayed
- [ ] Can approve/reject AI reports

---

## 💡 Tips

1. **Use real test images** - AI needs actual content to analyze
2. **Check browser console** - Most info appears there
3. **Test with different confidence levels** - See what works best
4. **Monitor admin dashboard** - See reports in real-time
5. **Test on different devices** - Mobile vs desktop behavior

---

## 🚀 Production Notes

Before going live:
- Set appropriate thresholds for your use case
- Test with real-world content
- Monitor false positive rate
- Have manual review process ready
- Consider privacy implications
- Add user appeals process

---

Need help? Check the console logs or admin dashboard for detailed information!
