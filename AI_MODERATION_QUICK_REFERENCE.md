# AI Moderation - Quick Reference Card

## 🎯 What Was Fixed

| Issue | Status |
|-------|--------|
| AI not detecting nude content | ✅ FIXED - Threshold lowered to 50% |
| Wrong screenshot being sent | ✅ FIXED - Now captures violator's video |
| Reporter not showing in admin | ✅ FIXED - Sends complete reporter info |
| Violator not showing in admin | ✅ FIXED - Sends complete violator info |
| Evidence not showing properly | ✅ FIXED - Screenshot shows actual violation |

## 🔍 How It Works

```
User A (Reporter) ←→ Video Chat ←→ User B (Violator)
                                         │
                                         │ Shows nude content
                                         ▼
                              AI monitors User B's video
                                         │
                                         ▼
                              Detects inappropriate content
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              50-69% Conf          70-84% Conf          85%+ Conf
              Silent Report        Warning Toast        Auto-Report
              (Admin only)         (User notified)      (Disconnect)
                    │                    │                    │
                    └────────────────────┴────────────────────┘
                                         │
                                         ▼
                              Capture User B's video
                                         │
                                         ▼
                              Send to backend with:
                              - Reporter: User A
                              - Violator: User B
                              - Screenshot: User B's video
                                         │
                                         ▼
                              Save to database
                                         │
                                         ▼
                              Display in admin panel:
                              👤 Reporter: User A (green)
                              ⚠️ Violator: User B (red)
                              🔞 Evidence: Screenshot (blurred)
```

## 📊 Confidence Levels

| Level | Confidence | Action | User Sees | Admin Sees |
|-------|-----------|--------|-----------|------------|
| 🟢 Safe | < 50% | None | Nothing | Nothing |
| 🟡 Suspicious | 50-69% | Silent Report | Nothing | Report |
| 🟠 Warning | 70-84% | Warn User | Toast Warning | Report |
| 🔴 Violation | 85%+ | Auto-Report | Error + Disconnect | Report |

## 🎮 Testing Commands

### Start Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Test Manual Report
1. Open 2 browser windows
2. Login with different accounts
3. Both go to Stranger Chat
4. Click "Report" button
5. Select reason
6. Check admin panel

### Test AI Detection
1. Open 2 browser windows
2. Start stranger chat
3. Show test content in one window
4. Watch console for AI predictions
5. Check admin panel for reports

## 🔧 Key Code Locations

### Frontend
- **AI Analysis:** `frontend/src/utils/contentModeration.js`
- **Screenshot Capture:** `frontend/src/pages/StrangerChatPage.jsx` line ~930
- **Report Submission:** `frontend/src/pages/StrangerChatPage.jsx` line ~950
- **Admin Panel:** `frontend/src/components/admin/AIModerationPanel.jsx`

### Backend
- **Report Handler:** `backend/src/lib/socket.js` line ~650
- **AI Suspicion Handler:** `backend/src/lib/socket.js` line ~700
- **Admin Controller:** `backend/src/controllers/admin.controller.js`

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| AI not detecting | Check console for TensorFlow errors, wait 3 seconds for model load |
| Screenshot blank | Verify partner's video is playing, check readyState >= 2 |
| Wrong reporter/violator | Check partnerUserId is set, verify socket.emit includes both IDs |
| Admin panel empty | Refresh panel, check backend logs, verify Cloudinary upload |
| False positives | Adjust confidence thresholds in MODERATION_CONFIG |

## 📝 Console Logs to Watch

### Good Detection:
```
🔍 AI Check #1 - Status: connected
📊 AI Predictions: Porn: 87.0%, Sexy: 10.0%, Neutral: 3.0%
⚠️ AI Moderation Alert: { confidence: '87.0%', category: 'Porn' }
🚨 AUTO-REPORTING due to high confidence
✅ Report saved: Reporter xxx reported Violator yyy (AI Detected)
```

### Safe Content:
```
🔍 AI Check #1 - Status: connected
📊 AI Predictions: Neutral: 95.0%, Drawing: 3.0%, Sexy: 2.0%
✅ Content check passed - safe
```

## ✅ Success Indicators

- [x] "AI Protected" badge is green
- [x] Console shows AI predictions every 5 seconds
- [x] High confidence triggers auto-report
- [x] Screenshot shows partner's video
- [x] Admin panel shows reporter (green ring)
- [x] Admin panel shows violator (red ring)
- [x] Evidence screenshot is blurred but viewable

## 🎯 Key Points to Remember

1. **AI monitors:** Partner's video (remoteVideoRef)
2. **Screenshot captures:** Partner's video (the violation)
3. **Reporter is:** Person who saw the violation
4. **Violator is:** Person showing inappropriate content
5. **Evidence shows:** Violator's nude/violent content
6. **Confidence levels:** 50% silent, 70% warn, 85% auto-ban
7. **Check interval:** Every 5 seconds during active chat
8. **Model load time:** ~3 seconds on first use

## 📞 Quick Support

**Issue:** AI not working
**Check:** Browser console → TensorFlow.js loaded? → "AI Protected" badge green?

**Issue:** Wrong screenshot
**Check:** remoteVideoRef.current → readyState >= 2? → videoWidth > 0?

**Issue:** Admin panel wrong info
**Check:** Backend logs → reporterId and reportedUserId correct? → Database saved?

## 🚀 Status: READY FOR PRODUCTION

All systems operational! 🎉
