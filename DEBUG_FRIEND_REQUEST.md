# Debug Friend Request from Stranger Chat

## Issue
- Sender sees: "Friend request sent!" ✅
- Receiver sees: "Check your Social Hub!" ✅
- But request doesn't appear in Social Hub > Requests tab ❌

## Debugging Steps

### Step 1: Check Backend Logs

When User A clicks "Add Friend", check the **backend console** for these logs:

```
👥 Friend request from [senderId] to [receiverId] created
📤 Emitting friendRequest:received to [receiverId] with profile: [username]
✅ Friend request event emitted successfully
```

**If you DON'T see these logs:**
- The socket handler isn't being triggered
- Check if `stranger:addFriend` event is being emitted from frontend

**If you DO see these logs:**
- Backend is working correctly
- Move to Step 2

---

### Step 2: Check Frontend Console (Receiver)

Open **User B's browser console** and look for:

```
📥 Received friendRequest:received event: {_id: "...", username: "...", nickname: "...", ...}
Current pendingReceived before add: []
Current pendingReceived after add: [{...}]
```

**If you DON'T see "Received friendRequest:received":**
- Socket event is not reaching the frontend
- Check if socket is connected: `console.log(socket?.connected)`
- Check if App.jsx socket listener is registered

**If you DO see the event:**
- Frontend received the event
- Check if `pendingReceived` array was updated
- Move to Step 3

---

### Step 3: Check Zustand Store

In **User B's browser console**, run:

```javascript
// Check if store has the request
useFriendStore.getState().pendingReceived
// Should show array with the new request
```

**If array is empty:**
- `addPendingReceived` didn't work
- Check if there's a duplicate ID issue

**If array has the request:**
- Store is updated correctly
- Move to Step 4

---

### Step 4: Check DiscoverPage

1. **User B** navigates to `/discover`
2. Click "Requests" tab
3. Check browser console for:
   ```
   Current pendingReceived: [{...}]
   ```

**If request still doesn't show:**
- DiscoverPage isn't reading from store correctly
- Try refreshing the page

---

### Step 5: Check Database

Run this in MongoDB:

```javascript
// Check if request was saved to database
db.users.findOne({ _id: ObjectId("receiver_id") })

// Look for:
{
  friendRequestsReceived: [ObjectId("sender_id")]
}
```

**If array is empty:**
- Backend didn't save to database
- Check backend error logs

**If array has sender_id:**
- Database is correct
- Issue is in frontend

---

## Quick Test Commands

### In Browser Console (User B - Receiver)

```javascript
// 1. Check socket connection
console.log("Socket connected:", socket?.connected);

// 2. Check if event listener is registered
// (Should see friendRequest:received in the list)

// 3. Check store state
console.log("Pending requests:", useFriendStore.getState().pendingReceived);

// 4. Manually fetch friend data
useFriendStore.getState().fetchFriendData();

// 5. Check again
console.log("After fetch:", useFriendStore.getState().pendingReceived);
```

### In MongoDB

```javascript
// Find receiver's pending requests
db.users.findOne(
  { username: "receiver_username" },
  { friendRequestsReceived: 1 }
)

// Find sender's sent requests
db.users.findOne(
  { username: "sender_username" },
  { friendRequestsSent: 1 }
)
```

---

## Common Issues & Solutions

### Issue 1: Socket Not Connected

**Symptom**: No "Received friendRequest:received" log

**Solution**:
```javascript
// Check in browser console
console.log(socket?.connected); // Should be true

// If false, reconnect
socket?.connect();
```

### Issue 2: Event Not Reaching Frontend

**Symptom**: Backend logs show event emitted, but frontend doesn't receive

**Solution**:
- Check if socket.userId is set correctly
- Backend uses `partnerSocket.emit()` - verify partnerSocket exists
- Check CORS settings

### Issue 3: Store Not Updating

**Symptom**: Event received but `pendingReceived` array stays empty

**Solution**:
```javascript
// Manually add to store (temporary test)
useFriendStore.getState().addPendingReceived({
  _id: "test_id",
  username: "testuser",
  nickname: "Test User",
  profilePic: "/avatar.png"
});

// Check if it appears in Social Hub
```

### Issue 4: DiscoverPage Not Showing

**Symptom**: Store has data but DiscoverPage doesn't show it

**Solution**:
1. Refresh the page
2. Navigate away and back to `/discover`
3. Check if `fetchFriendData()` is being called on mount

---

## Expected Flow

### 1. User A clicks "Add Friend"
```
Frontend (StrangerChatPage.jsx)
  ↓ socket.emit("stranger:addFriend")
Backend (socket.js)
  ↓ Save to database
  ↓ partnerSocket.emit("friendRequest:received", senderProfile)
Frontend (App.jsx - User B)
  ↓ socket.on("friendRequest:received")
  ↓ addPendingReceived(senderProfile)
Store (useFriendStore.js)
  ↓ pendingReceived.push(senderProfile)
DiscoverPage (DiscoverPage.jsx)
  ↓ Reads pendingReceived from store
  ↓ Shows in Requests tab ✅
```

---

## Manual Fix (If Needed)

If the request is in the database but not showing in UI:

### Option 1: Refresh Friend Data

```javascript
// In User B's browser console
useFriendStore.getState().fetchFriendData();
```

### Option 2: Reload Page

Just refresh the page - `fetchFriendData()` is now called on mount.

### Option 3: Check Database and Manually Add

```javascript
// 1. Get request from database
const userId = "receiver_id";
const response = await fetch(`/api/friends/requests`, {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
console.log(data.received); // Should show the request

// 2. If it's there, manually add to store
useFriendStore.setState({
  pendingReceived: data.received
});
```

---

## Files to Check

1. **Backend**: `backend/src/lib/socket.js` - Line ~226 (stranger:addFriend handler)
2. **Frontend**: `frontend/src/App.jsx` - Line ~132 (friendRequest:received listener)
3. **Store**: `frontend/src/store/useFriendStore.js` - Line ~56 (addPendingReceived)
4. **UI**: `frontend/src/pages/DiscoverPage.jsx` - Line ~238 (Requests tab)

---

## Success Indicators

✅ Backend logs show: "Friend request created" and "Event emitted"
✅ Frontend logs show: "Received friendRequest:received event"
✅ Store logs show: pendingReceived array updated
✅ DiscoverPage shows request in Requests tab
✅ Can click Accept/Reject buttons

---

## Still Not Working?

1. **Restart backend server** - Changes to socket.js require restart
2. **Clear browser cache** - Old code might be cached
3. **Check network tab** - Verify socket connection is established
4. **Try incognito mode** - Rule out extension interference
5. **Check for errors** - Look for any red errors in console

---

## Contact Points

If still not working, provide:
1. Backend console logs (when clicking Add Friend)
2. Frontend console logs (User B's browser)
3. Database query results (friendRequestsReceived array)
4. Screenshot of Social Hub > Requests tab
