# Friend Request Notification System - Complete

## Overview

The friend request system now has **complete real-time notifications** for all actions:
1. ✅ Sending friend request (from stranger chat or profile)
2. ✅ Receiving friend request (appears in Social Hub > Requests tab)
3. ✅ Accepting friend request (sender gets notified)
4. ✅ Rejecting friend request (sender gets notified)

## How It Works

### 1. Sending Friend Request (Stranger Chat)

**User A clicks "Add Friend" in stranger chat:**

1. **Frontend** (StrangerChatPage.jsx):
   ```javascript
   socket.emit("stranger:addFriend", { partnerUserId });
   ```

2. **Backend** (socket.js):
   - Creates `FriendRequest` in database
   - Emits to User B: `friendRequest:received` with sender's profile
   - Emits to User A: `stranger:friendRequestSent` (confirmation)

3. **Frontend** (App.jsx - User B):
   ```javascript
   socket.on("friendRequest:received", (senderProfileData) => {
     addPendingReceived(senderProfileData); // Adds to store
     toast.success("New friend request from [name]!");
   });
   ```

4. **Result**:
   - ✅ User B sees toast notification
   - ✅ User B's Social Hub > Requests tab shows the request
   - ✅ Badge count updates on Social Hub icon

### 2. Accepting Friend Request

**User B clicks "Accept" in Social Hub > Requests tab:**

1. **Frontend** (DiscoverPage.jsx):
   ```javascript
   await acceptRequest(user._id);
   ```

2. **Backend** (friend.controller.js):
   - Adds both users to each other's friends list
   - Removes from request lists
   - Emits to User A: `friendRequest:accepted`

3. **Frontend** (App.jsx - User A):
   ```javascript
   socket.on("friendRequest:accepted", ({ user, message }) => {
     toast.success("[name] accepted your friend request!");
     fetchFriendData(); // Refresh to show in sidebar
   });
   ```

4. **Result**:
   - ✅ User A sees toast notification
   - ✅ User B appears in User A's sidebar (Friends list)
   - ✅ User A appears in User B's sidebar
   - ✅ Both can now chat

### 3. Rejecting Friend Request

**User B clicks "Reject" in Social Hub > Requests tab:**

1. **Frontend** (DiscoverPage.jsx):
   ```javascript
   await rejectRequest(user._id);
   ```

2. **Backend** (friend.controller.js):
   - Removes from both users' request lists
   - Emits to User A: `friendRequest:rejected`

3. **Frontend** (App.jsx - User A):
   ```javascript
   socket.on("friendRequest:rejected", ({ message }) => {
     toast.error("Your friend request was declined");
     fetchFriendData(); // Refresh to remove from sent list
   });
   ```

4. **Result**:
   - ✅ User A sees toast notification
   - ✅ Request removed from User A's sent list
   - ✅ Request removed from User B's received list

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STRANGER CHAT                            │
│  User A ──[Add Friend]──> User B                           │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                   │
│  • Creates FriendRequest in DB                              │
│  • Emits: friendRequest:received → User B                   │
│  • Emits: stranger:friendRequestSent → User A               │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                USER B (Receiver)                            │
│  • Toast: "New friend request from User A!"                │
│  • Social Hub > Requests tab shows User A                  │
│  • Badge count: 1                                           │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│            USER B CLICKS "ACCEPT"                           │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                   │
│  • Adds to friends lists (both users)                       │
│  • Removes from request lists                               │
│  • Emits: friendRequest:accepted → User A                   │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                USER A (Sender)                              │
│  • Toast: "User B accepted your friend request!"           │
│  • User B appears in sidebar (Friends)                     │
│  • Can now chat with User B                                │
└─────────────────────────────────────────────────────────────┘
```

## Socket Events

### Emitted by Backend

| Event | Sent To | Data | Trigger |
|-------|---------|------|---------|
| `friendRequest:received` | Receiver | `{ _id, username, nickname, profilePic, isVerified }` | When friend request is sent |
| `friendRequest:accepted` | Sender | `{ user: {...}, message: "..." }` | When request is accepted |
| `friendRequest:rejected` | Sender | `{ message: "..." }` | When request is rejected |

### Listened by Frontend (App.jsx)

| Event | Action |
|-------|--------|
| `friendRequest:received` | Add to pendingReceived, show toast |
| `friendRequest:accepted` | Show toast, refresh friend data |
| `friendRequest:rejected` | Show toast, refresh friend data |

## Files Modified

### Backend
1. **`backend/src/controllers/friend.controller.js`**
   - Added socket notification in `acceptFriendRequest()`
   - Added socket notification in `rejectFriendRequest()`

### Frontend
2. **`frontend/src/App.jsx`**
   - Added `friendRequest:accepted` listener
   - Added `friendRequest:rejected` listener
   - Added cleanup for new listeners

## Testing Steps

### Test 1: Send Friend Request from Stranger Chat

1. **User A** and **User B** connect in stranger chat
2. **User A** clicks "Add Friend" button
3. **Verify**:
   - ✅ User A sees "Friend request sent!" toast
   - ✅ User B sees "New friend request from [User A]!" toast
   - ✅ User B opens Social Hub > Requests tab
   - ✅ User A's profile appears in the list
   - ✅ Badge shows "1" on Requests tab

### Test 2: Accept Friend Request

1. **User B** is in Social Hub > Requests tab
2. **User B** clicks "Accept" button on User A's request
3. **Verify**:
   - ✅ User A sees "[User B] accepted your friend request!" toast
   - ✅ User B appears in User A's sidebar (Friends section)
   - ✅ User A appears in User B's sidebar (Friends section)
   - ✅ Request disappears from User B's Requests tab
   - ✅ Both users can now open chat with each other

### Test 3: Reject Friend Request

1. **User C** sends friend request to **User D**
2. **User D** opens Social Hub > Requests tab
3. **User D** clicks "Reject" button on User C's request
4. **Verify**:
   - ✅ User C sees "Your friend request was declined" toast
   - ✅ Request disappears from User D's Requests tab
   - ✅ Request disappears from User C's sent list
   - ✅ Users are NOT friends

## UI Locations

### Where to See Friend Requests

**Social Hub (DiscoverPage.jsx):**
- Navigate to: `/discover`
- Click on "Requests" tab
- Shows all pending received requests
- Each request has:
  - User's avatar
  - Username/nickname
  - Accept button (green)
  - Reject button (red)

### Where to See Friends

**Sidebar (Sidebar.jsx):**
- Visible on HomePage
- Shows all friends
- Click on friend to open chat
- Green dot = online
- Badge = unread messages

## Notification Types

### Toast Notifications

| Action | Toast Message | Icon | Duration |
|--------|--------------|------|----------|
| Request Received | "New friend request from [name]! 🤝" | Success | 4s |
| Request Accepted | "[name] accepted your friend request!" | Success | 4s |
| Request Rejected | "Your friend request was declined" | Error | 4s |

### In-App Notifications

| Location | What Shows |
|----------|------------|
| Social Hub > Requests Tab | List of pending received requests |
| Sidebar | List of friends (after acceptance) |
| Badge on Requests Tab | Count of pending requests |

## Database Schema

### User Model (Embedded Arrays)

```javascript
{
  friends: [ObjectId],                    // Array of friend user IDs
  friendRequestsSent: [ObjectId],         // Requests I sent
  friendRequestsReceived: [ObjectId]      // Requests I received
}
```

### Flow:

1. **Send Request**: 
   - Sender: `friendRequestsSent.push(receiverId)`
   - Receiver: `friendRequestsReceived.push(senderId)`

2. **Accept Request**:
   - Both: `friends.push(otherId)`
   - Both: Remove from request arrays

3. **Reject Request**:
   - Both: Remove from request arrays

## Error Handling

### Duplicate Request
```javascript
if (existingRequest) {
  throw new Error("Friend request already sent.");
}
```

### Reverse Request
```javascript
if (reverseRequest) {
  socket.emit("stranger:addFriendError", { 
    error: "This user has already sent you a friend request. Check your Social Hub!" 
  });
}
```

### Already Friends
```javascript
if (sender.friends.includes(receiverId)) {
  throw new Error("You are already friends.");
}
```

## Console Logs (Expected)

### When Sending Request:
```
👥 Friend request from [senderId] to [receiverId] created
📤 Emitting friendRequest:received to [receiverId] with profile: [username]
✅ Friend request event emitted successfully
```

### When Accepting Request:
```
✅ Notifying [senderId] that [receiverId] accepted their friend request
```

### When Rejecting Request:
```
❌ Notifying [senderId] that [receiverId] rejected their friend request
```

## Troubleshooting

### Request not appearing in Social Hub

**Check:**
1. Is socket connected? `console.log(socket?.connected)`
2. Is user logged in? `console.log(authUser)`
3. Check browser console for `friendRequest:received` event
4. Refresh the page
5. Check database: `db.users.findOne({ _id: userId }).friendRequestsReceived`

### Notification not showing

**Check:**
1. Is socket connected for both users?
2. Check browser console for socket events
3. Verify backend is emitting events (check server logs)
4. Try refreshing both pages

### Friend not appearing in sidebar after acceptance

**Check:**
1. Refresh the page
2. Check database: `db.users.findOne({ _id: userId }).friends`
3. Verify `fetchFriendData()` was called
4. Check useFriendStore state

## Future Enhancements

- [ ] Add notification history page
- [ ] Add push notifications (browser API)
- [ ] Add email notifications for friend requests
- [ ] Add "Suggested Friends" based on mutual friends
- [ ] Add friend request expiration (auto-reject after 30 days)
- [ ] Add block user feature
- [ ] Add friend list categories/groups
