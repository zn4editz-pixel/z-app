# Call System Socket Event Fix

## Issues Found

### 1. ❌ Duplicate Socket Listeners
**Problem**: Both HomePage and PrivateCallModal were listening to the same socket events (`private:call-ended` and `private:call-rejected`), causing:
- Multiple rejection events
- "Call rejected: busy" errors
- "Received call rejected signal but wasn't the caller or partner mismatch" warnings
- Calls being automatically rejected

**Root Cause**: 
- HomePage's useEffect had `callState.isCallActive` in dependencies
- This caused socket listeners to re-register every time call state changed
- Created duplicate listeners that interfered with each other

### 2. ❌ Missing Default Avatar
**Problem**: 404 error for `/default-avatar.png`
**Solution**: Created `default-avatar.png` by copying existing `avatar.png`

## Fixes Applied

### Fix 1: Removed Duplicate Event Listeners from HomePage

**Before:**
```javascript
useEffect(() => {
  // ... handlers
  socket.on("private:incoming-call", handleIncomingCall);
  socket.on("private:call-ended", handleCallEnded);      // ❌ Duplicate
  socket.on("private:call-rejected", handleCallRejected); // ❌ Duplicate
  
  return () => {
    socket.off("private:incoming-call", handleIncomingCall);
    socket.off("private:call-ended", handleCallEnded);
    socket.off("private:call-rejected", handleCallRejected);
  };
}, [socket, callState.isCallActive]); // ❌ Causes re-registration
```

**After:**
```javascript
useEffect(() => {
  // Only listen to incoming calls in HomePage
  socket.on("private:incoming-call", handleIncomingCall);
  
  return () => {
    socket.off("private:incoming-call", handleIncomingCall);
  };
}, [socket]); // ✅ Only depends on socket
```

**Why**: 
- PrivateCallModal already handles `call-ended` and `call-rejected` events
- HomePage only needs to handle incoming calls
- Removed dependency on `callState.isCallActive` to prevent re-registration

### Fix 2: Fixed State Access in handleIncomingCall

**Before:**
```javascript
const handleIncomingCall = ({ callerInfo, callType }) => {
  if (callState.isCallActive) { // ❌ Stale closure
    socket.emit("private:reject-call", { callerId: callerInfo._id });
    return;
  }
  setIncomingCall({ callerInfo, callType });
};
```

**After:**
```javascript
const handleIncomingCall = ({ callerInfo, callType }) => {
  // Use functional setState to access latest state
  setCallState((prevState) => {
    if (prevState.isCallActive) { // ✅ Always latest state
      socket.emit("private:reject-call", { callerId: callerInfo._id });
      return prevState;
    }
    setIncomingCall({ callerInfo, callType });
    return prevState;
  });
};
```

**Why**: Using functional setState ensures we always check the latest call state, avoiding stale closures.

### Fix 3: Created Default Avatar File

```bash
Copy-Item "frontend/public/avatar.png" "frontend/public/default-avatar.png"
```

## Event Flow Now

### Incoming Call:
1. **User A** clicks call button
2. **Backend** emits `private:incoming-call` to User B
3. **HomePage** (User B) receives event → Shows IncomingCallModal
4. **User B** accepts → PrivateCallModal opens for both users

### During Call:
1. **PrivateCallModal** handles all WebRTC events:
   - `private:offer`
   - `private:answer`
   - `private:ice-candidate`
   - `private:call-accepted`

### Ending Call:
1. **User A** clicks end call button
2. **PrivateCallModal** (User A) emits `private:end-call`
3. **Backend** emits `private:call-ended` to User B
4. **PrivateCallModal** (User B) receives event → Closes modal
5. **Both modals** clean up and close

### Rejecting Call:
1. **User B** clicks reject button
2. **IncomingCallModal** emits `private:reject-call`
3. **Backend** emits `private:call-rejected` to User A
4. **PrivateCallModal** (User A) receives event → Shows "Call declined"

## Responsibility Separation

| Component | Listens To | Emits |
|-----------|-----------|-------|
| **HomePage** | `private:incoming-call` | None |
| **IncomingCallModal** | None | `private:reject-call` |
| **PrivateCallModal** | `private:offer`<br>`private:answer`<br>`private:ice-candidate`<br>`private:call-accepted`<br>`private:call-ended`<br>`private:call-rejected` | `private:initiate-call`<br>`private:offer`<br>`private:answer`<br>`private:ice-candidate`<br>`private:call-accepted`<br>`private:end-call` |

## Testing

1. **Open two browser windows** with different users
2. **User A**: Click call button
3. **User B**: Should see incoming call modal (no errors in console)
4. **User B**: Click accept
5. **Both users**: Should connect successfully
6. **Verify**:
   - ✅ No "call rejected" errors
   - ✅ No duplicate event warnings
   - ✅ Audio/video works
   - ✅ Timer counts up
7. **End call**: Should close cleanly
8. **Check chat**: Call log should appear

## Console Logs (Expected)

### User A (Caller):
```
📞 Starting audio call with: Username
Creating peer connection
Adding local tracks to peer connection
Sending ICE candidate
🎉 Received remote track! audio
✅ Remote stream set and playing
```

### User B (Receiver):
```
📞 Incoming call from: {_id: "...", nickname: "..."} Type: audio
Answering call - initializing media
Media initialized, waiting for offer
Received offer, creating peer connection
🎉 Received remote track! audio
✅ Remote stream set and playing
```

### When Call Ends:
```
Call ended by other user
✅ Call log created: audio call, 45s
```

## No More Errors

❌ **Before:**
```
⚠️ Received call rejected signal but wasn't the caller or partner mismatch
❌ Call rejected: busy
❌ Call rejected by other user
❌ GET /default-avatar.png 404 (Not Found)
```

✅ **After:**
```
📞 Starting audio call with: Username
📞 Incoming call from: {...} Type: audio
🎉 Received remote track! audio
✅ Remote stream set and playing
✅ Call log created: audio call, 45s
```

## Files Modified

1. `frontend/src/pages/HomePage.jsx` - Removed duplicate listeners
2. `frontend/public/default-avatar.png` - Created missing file

## Key Takeaways

1. **Avoid duplicate socket listeners** - Each event should be handled in only one place
2. **Be careful with useEffect dependencies** - State in dependencies can cause re-registration
3. **Use functional setState** - When accessing state in closures
4. **Separate concerns** - HomePage handles incoming calls, PrivateCallModal handles active calls
5. **Test thoroughly** - Check console for duplicate events and errors
