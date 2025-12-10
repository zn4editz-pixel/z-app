# 🚀 Quick Reference Card

## Admin Dashboard Access
```
URL: http://localhost:5173/admin
Email: (from .env ADMIN_EMAIL)
Password: safwan123
```

## New Features Quick Access

### 1. Server Intelligence Center 📊
**Tab:** Server Intelligence  
**What:** Real-time monitoring with 7 graphs  
**Update:** Every 5 seconds  
**Theme:** Gold & Black

### 2. AI Analysis Agent 🤖
**Tab:** AI Analysis  
**What:** Intelligent system insights  
**Update:** Every 30 seconds  
**Features:** Positive/Negative insights, Timeline

### 3. Online Status 🟢
**Tab:** Users  
**What:** 100% accurate real-time status  
**Update:** Instant via WebSocket  
**Refresh:** Every 10 seconds

## API Endpoints

### Server Metrics
```
GET  /api/admin/server-metrics
GET  /api/admin/metrics-history
DEL  /api/admin/metrics-history
```

### AI Analysis
```
GET  /api/admin/ai-analysis
GET  /api/admin/ai-analysis/history
POST /api/admin/ai-analysis/trigger
```

### Manual Reports
```
POST /api/admin/manual-report
GET  /api/admin/manual-reports
```

## Database Cleanup
```bash
cd backend
node src/scripts/cleanup-database.js
```

## Start Application
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Key Files

### Frontend
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/components/admin/ServerIntelligenceCenter.jsx`
- `frontend/src/components/admin/AIAnalysisAgent.jsx`

### Backend
- `backend/src/routes/admin.route.js`
- `backend/src/controllers/serverMetrics.controller.js`
- `backend/src/controllers/aiAnalysis.controller.js`

## Troubleshooting

### Graphs not loading?
- Check `/api/admin/server-metrics` endpoint
- Verify admin authentication
- Check browser console

### AI Analysis not working?
- Check `/api/admin/ai-analysis` endpoint
- Verify routes are registered
- Check backend logs

### Online status wrong?
- Check WebSocket connection
- Verify socket events
- Force refresh (Ctrl+Shift+R)

## Status Indicators
- 🟢 Online
- ⚫ Offline
- 🟡 Away
- 🔴 Suspended

## Quick Commands
```bash
# Check backend logs
cd backend && npm run dev

# Check frontend logs
cd frontend && npm run dev

# Database cleanup
cd backend && node src/scripts/cleanup-database.js

# Check diagnostics
npm run test
```

---
**Last Updated:** December 9, 2025  
**All Systems:** ✅ Operational
