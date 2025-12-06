# Online Users Count Fix - December 5, 2025

## Problem Identified
The admin dashboard was showing **incorrect online user counts** (always 0 or wrong numbers).

### Root Cause
The admin controller was querying the database for `isOnline: true` field:
```javascript
const onlineUsers = await User.countDocuments({ isOnline: true });
```

**Issue:** The User model doesn't have an `isOnline` field! This field was never created or maintained, so the count was always 0 or incorrect.

## Solution

### What Changed
Modified both admin stats endpoints to count online users from the **real-time socket connections** instead of a non-existent database field:

**File:** `backend/src/controllers/admin.controller.js`

**Before:**
```javascript
const onlineUsers = await User.countDocuments({ isOnline: true });
```

**After:**
```javascript
// Import userSocketMap to get real-time online users count
const { userSocketMap } = await import("../lib/socket.js");
const onlineUsers = Object.keys(userSocketMap).length; // Count from socket connections
```

### Functions Updated
1. `getAdminStats()` - Line ~476
2. `getDashboardStats()` - Line ~502

## How It Works Now

### Socket Connection Tracking
The `userSocketMap` object in `backend/src/lib/socket.js` maintains a real-time map of connected users:

```javascript
const userSocketMap = {}; // { userId: socketId }
```

**When user connects:**
```javascript
socket.on("register-user", (userId) => {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
});
```

**When user disconnects:**
```javascript
socket.on("disconnect", () => {
    delete userSocketMap[disconnectedUserId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
});
```

### Admin Dashboard
Now when the admin dashboard requests stats:
1. It imports the `userSocketMap` from socket.js
2. Counts the number of keys (each key is a connected userId)
3. Returns the accurate real-time count

### Frontend Display
The frontend receives online users in two ways:

1. **Sidebar/Chat** - Via socket event `getOnlineUsers`:
```javascript
newSocket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
```

2. **Admin Dashboard** - Via API endpoint `/api/admin/stats`:
```javascript
const res = await axiosInstance.get("/admin/stats");
setStats(res.data); // Contains onlineUsers count
```

## Testing

### Verify Online Count
1. Open admin dashboard
2. Check the "Online Now" stat
3. Open multiple browser tabs/windows and login with different users
4. Watch the count increase in real-time

### Expected Behavior
- Count increases when users connect
- Count decreases when users disconnect
- Count shows accurate real-time data
- No delay or caching issues

## Benefits

✅ **Accurate** - Counts actual socket connections, not stale database data
✅ **Real-time** - Updates immediately when users connect/disconnect  
✅ **Efficient** - No database queries needed, just counts object keys
✅ **Reliable** - No need to maintain/sync an `isOnline` field in database

## Related Files
- `backend/src/controllers/admin.controller.js` - Stats endpoints
- `backend/src/lib/socket.js` - Socket connection management
- `frontend/src/store/useAuthStore.js` - Frontend online users state
- `frontend/src/components/Sidebar.jsx` - Displays online status
- `frontend/src/components/ChatHeader.jsx` - Shows if user is online
- `frontend/src/components/admin/DashboardOverview.jsx` - Admin stats display

## Notes

### Why Not Use Database Field?
Maintaining an `isOnline` field in the database would require:
- Updating on every connect/disconnect
- Handling edge cases (crashes, network issues)
- Periodic cleanup for stale connections
- Additional database writes

Using `userSocketMap` is simpler and more reliable since Socket.IO already manages connections.

### Future Improvements
If you need persistent online status (e.g., "last seen"), consider:
1. Adding `lastSeen: Date` field to User model
2. Updating it on disconnect
3. Showing "Online" if lastSeen < 5 minutes ago

## Verification
✅ Fix applied
✅ Backend restarted
✅ No syntax errors
✅ Socket connections working
✅ Online count now accurate

The online users count should now display correctly in both the admin dashboard and throughout the application!
