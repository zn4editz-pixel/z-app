# Friend Request System - How It Works

## Current Implementation ✅

The friend request system is working correctly! Here's the flow:

### Step 1: Send Friend Request
- User A clicks "Add Friend" on User B's profile
- Backend adds:
  - User B's ID to User A's `friendRequestsSent` array
  - User A's ID to User B's `friendRequestsReceived` array
- **User B does NOT appear in User A's sidebar yet**

### Step 2: User B Sees Request
- User B goes to Social Hub → Requests tab
- Sees User A's friend request with Accept/Reject buttons

### Step 3: Accept Request
- User B clicks "Accept"
- Backend:
  - Adds User A's ID to User B's `friends` array
  - Adds User B's ID to User A's `friends` array
  - Removes from both request arrays
- **NOW both users appear in each other's sidebar!**

### Step 4: Chat Available
- Both users can now:
  - See each other in the sidebar
  - Send messages
  - Make voice/video calls

## Important Rules

### ✅ Users ONLY appear in sidebar when:
1. Friend request was sent
2. Friend request was accepted
3. Both users are in each other's `friends` array

### ❌ Users do NOT appear in sidebar when:
- Request is still pending
- Request was rejected
- No request has been sent

## API Endpoints

### Get Friends (Sidebar)
```
GET /api/friends/all
```
Returns ONLY accepted friends (users in `friends` array)

### Get Pending Requests
```
GET /api/friends/requests
```
Returns:
- `sent`: Requests you sent (waiting for response)
- `received`: Requests you received (need to accept/reject)

## Database Structure

### User Model
```javascript
{
  friends: [userId1, userId2],              // ✅ Accepted friends (appear in sidebar)
  friendRequestsSent: [userId3],            // ⏳ Waiting for them to accept
  friendRequestsReceived: [userId4]         // ⏳ Waiting for you to accept
}
```

## Testing the Flow

1. **User A sends request to User B**
   - User A: Check Social Hub → Requests → "Sent" tab (should see User B)
   - User B: Check Social Hub → Requests → "Received" tab (should see User A)
   - Sidebar: Neither user appears yet ❌

2. **User B accepts request**
   - User A: Check sidebar (User B now appears) ✅
   - User B: Check sidebar (User A now appears) ✅
   - Both can now chat!

## Common Questions

**Q: Why don't I see someone in my sidebar after sending a request?**
A: They need to accept your request first. Check Social Hub → Requests → "Sent" to see pending requests.

**Q: Someone sent me a request but I don't see them in sidebar?**
A: Go to Social Hub → Requests → "Received" and accept their request first.

**Q: Can I cancel a sent request?**
A: Yes! Go to Social Hub → Requests → "Sent" and click reject/cancel.

## Summary

The system is working as designed:
- **Sidebar = Accepted friends only**
- **Social Hub Requests = Pending requests**
- **Must accept request before chatting**

This prevents spam and ensures both users agree to be friends before they can communicate.
