# Call System Testing Guide

## Prerequisites
- Two browser windows/tabs (or two different browsers)
- Two different user accounts logged in
- Users must be friends to call each other

## Test Steps

### 1. Audio Call Test

**User A (Caller):**
1. Open chat with User B
2. Click the phone icon (🎧) in the chat header
3. You should see "Starting audio call with [User B]" in console
4. Call modal should open showing "Ringing..."
5. Wait for User B to accept

**User B (Receiver):**
1. You should hear a ringtone
2. See incoming call modal with User A's info
3. Click the green phone button to accept
4. Call modal should open

**Both Users:**
1. Once connected, you should see "Call connected!" toast
2. Timer should start counting (00:00, 00:01, 00:02...)
3. **Test audio**: Speak and verify the other person can hear you
4. Test mute button - click microphone icon
5. Verify muted status shows
6. Unmute and verify audio works again
7. Click red phone button to end call
8. **Check chat**: A call log should appear showing duration

### 2. Video Call Test

**User A (Caller):**
1. Open chat with User B
2. Click the video icon (📹) in the chat header
3. Allow camera/microphone permissions if prompted
4. You should see your own video in small window
5. Wait for User B to accept

**User B (Receiver):**
1. Incoming call modal appears
2. Click the green video button to accept
3. Allow camera/microphone permissions if prompted

**Both Users:**
1. Once connected, you should see:
   - Other person's video (full screen)
   - Your own video (small window in corner)
   - Timer counting up
2. **Test audio**: Verify you can hear each other
3. **Test video**: Verify you can see each other
4. Test mute button
5. Test camera off button (video icon)
6. Verify video turns off but audio still works
7. Turn camera back on
8. End call
9. **Check chat**: Call log should appear

### 3. Call Rejection Test

**User A:**
1. Start a call (audio or video)

**User B:**
1. See incoming call modal
2. Click red phone button to reject
3. User A should see "Call declined" message

**Both Users:**
1. No call log should appear (call wasn't connected)

### 4. Call Log Verification

After each successful call, check the chat for:
- Call log message appears for both users
- Shows correct call type (audio/video icon)
- Shows correct direction:
  - Caller sees "Outgoing"
  - Receiver sees "Incoming"
- Shows correct duration (e.g., "2 minutes 15 seconds")
- Timestamp is correct

### 5. Multiple Calls Test

1. Make several calls of different durations
2. Verify each creates a separate log entry
3. Verify logs appear in chronological order with other messages
4. Send text messages between calls
5. Verify call logs and text messages are properly interleaved

## Expected Console Logs

### When Starting Call:
```
📞 Starting audio call with: [Username]
Creating peer connection
Adding local tracks to peer connection
Adding track: audio
Sending ICE candidate
```

### When Receiving Call:
```
📞 Incoming call from: {_id: "...", nickname: "...", ...} Type: audio
Incoming call from: [Username]
```

### When Call Connects:
```
🎉 Received remote track! audio
Remote stream has 1 tracks
✅ Remote stream set and playing
```

### When Call Ends:
```
📞 Call ended event received
✅ Call log created: audio call, 45s
```

## Common Issues & Solutions

### Issue: Can't hear audio
**Solution**: 
- Check browser permissions for microphone
- Check system audio settings
- Verify microphone is not muted in system
- Try refreshing the page

### Issue: Can't see video
**Solution**:
- Check browser permissions for camera
- Check if camera is being used by another app
- Verify camera is not covered
- Try refreshing the page

### Issue: Call doesn't connect
**Solution**:
- Check internet connection
- Verify both users are online
- Check browser console for errors
- Try refreshing both pages

### Issue: No call log appears
**Solution**:
- Verify call was actually connected (timer started)
- Check if call duration was > 0 seconds
- Check browser console for API errors
- Refresh the page to see if log appears

### Issue: Timer doesn't start
**Solution**:
- This means remote track wasn't received
- Check network connection
- Check firewall/NAT settings
- Try using a different network

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (may need additional permissions)
- ❌ Internet Explorer (not supported)

## Network Requirements

- Stable internet connection
- Ports for WebRTC (UDP 3478, TCP 443)
- STUN server access (stun.l.google.com:19302)

## Troubleshooting Commands

Open browser console and run:
```javascript
// Check if socket is connected
console.log("Socket connected:", socket?.connected);

// Check online users
console.log("Online users:", onlineUsers);

// Check selected user
console.log("Selected user:", selectedUser);

// Check call state
console.log("Call state:", callState);
```
