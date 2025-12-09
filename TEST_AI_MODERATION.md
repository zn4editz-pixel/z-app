# Test AI Moderation System

## Quick Test Guide

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Test Manual Reporting

**Steps:**
1. Open two browser windows (Window A and Window B)
2. Login with different accounts in each window
3. Both go to Stranger Chat page
4. Wait for them to match
5. In Window A, click the "Report" button (red button with warning icon)
6. Select a reason (e.g., "Nudity or Sexual Content")
7. Submit the report

**Expected Result:**
- ✅ Screenshot captured shows Window B's video (the partner)
- ✅ Report submitted successfully
- ✅ Admin panel shows:
  - Reporter: User A (with green ring)
  - Violator: User B (with red ring)
  - Screenshot: User B's video

### 3. Test AI Auto-Detection

**Steps:**
1. Open two browser windows
2. Start stranger chat in both
3. In Window B, show test content that might trigger AI:
   - Use test images/videos
   - Or use browser dev tools to simulate

**Expected AI Behavior:**

**50-69% Confidence (Silent Report):**
- ✅ No notification to users
- ✅ Report sent to admin panel for review
- ✅ Users can continue chatting

**70-84% Confidence (Warning):**
- ✅ Warning toast appears in Window A
- ✅ Violation counter increases (1/3, 2/3, 3/3)
- ✅ After 3 violations, auto-disconnect

**85%+ Confidence (Auto-Report):**
- ✅ Error toast: "Inappropriate content detected"
- ✅ Auto-disconnect immediately
- ✅ Report sent to admin panel
- ✅ Screenshot of Window B's video captured

### 4. Check Admin Panel

**Access Admin Panel:**
1. Login as admin user
2. Go to Admin Dashboard
3. Click "AI Moderation" tab

**Verify Display:**
- ✅ Reporter column shows correct user (green ring, "✓ Reporter" label)
- ✅ Violator column shows correct user (red ring, "⚠ Violator" label)
- ✅ Violation Evidence shows screenshot (blurred, hover to view)
- ✅ AI Category shows detected type (Porn, Hentai, Sexy)
- ✅ Confidence shows percentage with progress bar
- ✅ Status shows pending/reviewed/action_taken/dismissed

### 5. Test Actions

**Admin Actions:**
1. Click "Review" to mark as reviewed
2. Click "Action" to mark action taken
3. Click "Dismiss" to dismiss the report
4. Click "View Full Evidence" to see full screenshot

**Expected:**
- ✅ Status updates immediately
- ✅ Report moves to appropriate category
- ✅ Stats update in real-time

## Console Logs to Watch

### Frontend Console (Window A - Reporter):
```
🔍 AI Check #1 - Status: connected
📊 AI Predictions: Neutral: 95.0%, Porn: 3.0%, Sexy: 2.0%
✅ Content check passed - safe

🔍 AI Check #2 - Status: connected
📊 AI Predictions: Porn: 87.0%, Sexy: 10.0%, Neutral: 3.0%
⚠️ AI Moderation Alert: { violations: 1, confidence: '87.0%', category: 'Porn' }
🚨 AUTO-REPORTING due to high confidence
📤 Submitting report: { reporterId: 'xxx', reportedUserId: 'yyy', reason: 'Nudity or Sexual Content' }
```

### Backend Console:
```
📥 Received report: { reporterId: 'xxx', reportedUserId: 'yyy', reason: 'Nudity or Sexual Content', isAIDetected: true }
📤 Uploading screenshot to Cloudinary...
✅ Screenshot uploaded: https://res.cloudinary.com/...
✅ Report saved: Reporter xxx reported Violator yyy (AI Detected)
```

### Admin Panel Console:
```
📊 Loading AI reports...
✅ AI reports loaded: 5 reports
📊 Stats: { total: 5, pending: 3, reviewed: 1, actionTaken: 1, dismissed: 0, avgConfidence: 0.78 }
```

## Troubleshooting

### Issue: AI not detecting
**Solution:** 
- Check browser console for TensorFlow.js errors
- Ensure camera permissions granted
- Wait 3 seconds for AI model to load
- Check "AI Protected" badge is green

### Issue: Screenshot is blank
**Solution:**
- Ensure partner's video is playing
- Check `remoteVideoRef.current.readyState >= 2`
- Verify video dimensions > 0

### Issue: Reporter/Violator wrong
**Solution:**
- Check `partnerUserId` is set correctly
- Verify socket.emit includes both IDs
- Check backend logs for correct IDs

### Issue: Admin panel not showing reports
**Solution:**
- Refresh admin panel
- Check backend logs for save errors
- Verify Cloudinary upload successful
- Check database for reports

## Success Criteria

✅ AI detects inappropriate content in partner's video
✅ Screenshot captures partner's video (not own video)
✅ Reporter is the person who saw the violation
✅ Violator is the person showing inappropriate content
✅ Admin panel displays all information correctly
✅ Confidence levels trigger appropriate actions
✅ Manual reports work correctly
✅ Silent reports (50-69%) don't notify users

## Notes

- AI model takes ~3 seconds to load on first use
- Checks run every 5 seconds during active chat
- Screenshots are high quality (0.9 JPEG quality)
- Cloudinary stores all evidence securely
- Reports are never deleted, only marked as dismissed
