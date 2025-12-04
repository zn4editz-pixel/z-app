# Stranger Chat Friend Request Fix

## Problem

There are **two ways** to send friend requests:
1. ✅ **Search user and send request** - Working correctly
2. ❌ **Stranger video chat "Add Friend" button** - NOT working

The issue was that stranger chat was using a different system (FriendRequest model) while the rest of the app uses embedded arrays in the User model.

## Root Cause

**Backend had TWO different friend request systems:**

### System 1: Embedded Arrays (Used by search/profile)
```javascript
// User model
{
  friends: [ObjectId],
  friendRequestsSent: [ObjectId],
  friendRequestsReceived: [ObjectId]
}
```

### System 2: Separate Collection (Used by stranger chat) ❌
```javascript
// FriendRequest model
{
  sender: ObjectId,
  receiver: ObjectId,
  status: String
}
```

**Result**: Stranger chat requests were saved to a different collection that the Social Hub doesn't read from!

## Solution

Updated `backend/src/lib/socket.js` to use the **same embedded arrays system** as the rest of the app.

### Changes Made

**Before** (Using FriendRequest model):
```javascript
const existingRequest = await FriendRequest.findOne({ 
  sender: senderId, 
  receiver: receiverId 
});

const newRequest = new FriendRequest({
  sender: senderId,
  receiver: receiverId,
});
await newRequest.save();
```

**After** (Using embedded arrays):
```javascript
// Check if request already exists
if (sender.friendRequestsSent.includes(receiverId)) {
  throw new Error("Friend request already sent.");
}

// Add to arrays
sender.friendRequestsSent.push(receiverId);
receiver.friendRequestsReceived.push(senderId);

await Promise.all([
  sender.save(),
  receiver.save()
]);
```

## How It Works Now

### Flow 1: Search User → Send Request

1. User A searches for User B in `/discover`
2. Clicks "View Profile" → "Send Friend Request"
3. **Backend** (`friend.controller.js`):
   - Adds to `sender.friendRequestsSent`
   - Adds to `receiver.friendRequestsReceived`
4. User B sees request in Social Hub > Requests tab ✅

### Flow 2: Stranger Chat → Add Friend

1. User A and User B match in stranger video chat
2. User A clicks "Add Friend" button
3. **Backend** (`socket.js`):
   - Adds to `sender.friendRequestsSent`
   - Adds to `receiver.friendRequestsReceived`
   - Emits `friendRequest:received` to User B
4. User B sees request in Social Hub > Requests tab ✅

**Both flows now use the SAME system!**

## Testing

### Test Stranger Chat Friend Request

1. **Open two browser windows**
2. **User A** and **User B** go to `/stranger`
3. Wait for them to match
4. **User A** clicks "Add Friend" button
5. **Verify**:
   - ✅ User A sees: "Friend request sent!" toast
   - ✅ User B sees: "New friend request from User A! 🤝" toast
   - ✅ User B opens Social Hub > Requests tab
   - ✅ User A's profile appears in the list
   - ✅ User B can Accept or Reject

### Test Search Friend Request

1. **User C** goes to `/discover`
2. Searches for **User D**
3. Clicks "View Profile"
4. Clicks "Send Friend Request"
5. **Verify**:
   - ✅ User C sees: "Friend request sent!" toast
   - ✅ User D sees: "New friend request from User C! 🤝" toast
   - ✅ User D opens Social Hub > Requests tab
   - ✅ User C's profile appears in the list
   - ✅ User D can Accept or Reject

**Both should work identically now!**

## Files Modified

1. **`backend/src/lib/socket.js`**
   - Removed `FriendRequest` model import
   - Updated `stranger:addFriend` handler to use embedded arrays
   - Now matches the system used by `friend.controller.js`

## Database Schema

### User Model (Embedded Arrays)

```javascript
{
  _id: ObjectId,
  username: String,
  friends: [ObjectId],                    // Accepted friends
  friendRequestsSent: [ObjectId],         // Requests I sent
  friendRequestsReceived: [ObjectId],     // Requests I received
  // ... other fields
}
```

### Example Data

**User A sends request to User B:**
```javascript
// User A
{
  _id: "user_a_id",
  friendRequestsSent: ["user_b_id"]
}

// User B
{
  _id: "user_b_id",
  friendRequestsReceived: ["user_a_id"]
}
```

**User B accepts request:**
```javascript
// User A
{
  _id: "user_a_id",
  friends: ["user_b_id"],
  friendRequestsSent: []  // Removed
}

// User B
{
  _id: "user_b_id",
  friends: ["user_a_id"],
  friendRequestsReceived: []  // Removed
}
```

## Console Logs (Expected)

### When sending from stranger chat:
```
👥 Friend request from [senderId] to [receiverId] created
📤 Emitting friendRequest:received to [receiverId] with profile: [username]
✅ Friend request event emitted successfully
```

### When receiving:
```
📥 Received friendRequest:received event: {_id: "...", username: "...", ...}
```

## Troubleshooting

### Request still not appearing?

1. **Check backend logs** - Should see "Friend request created" message
2. **Check browser console** - Should see "Received friendRequest:received event"
3. **Refresh Social Hub page** - Sometimes needs refresh
4. **Check database**:
   ```javascript
   db.users.findOne({ _id: receiverId }).friendRequestsReceived
   // Should contain senderId
   ```

### Error: "Friend request already sent"

This means the request already exists. Check:
```javascript
db.users.findOne({ _id: senderId }).friendRequestsSent
// Should contain receiverId
```

### Request appears but can't accept/reject

Check that `friend.controller.js` is using the same embedded arrays system (it already is).

## Summary

✅ **Fixed**: Stranger chat friend requests now use the same system as search/profile requests

✅ **Result**: Both methods now save to the same place (User model embedded arrays)

✅ **Benefit**: All friend requests appear in Social Hub > Requests tab regardless of how they were sent

The system is now unified and consistent! 🎉
